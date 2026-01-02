import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendaGC, DocumentosStatus, NfStatus } from "./gestaoclick/types";
import { VendaGCCard } from "./gestaoclick/VendaGCCard";
import { AcoesMassaGC } from "./gestaoclick/AcoesMassaGC";
import { useGerarDocumentoVenda } from "./gestaoclick/useGerarDocumentoVenda";
import { useGestaoClickNF } from "./gestaoclick/useGestaoClickNF";

const STORAGE_KEY = "gestaoclick_documentos_status";

export default function GestaoClickTab() {
  const [vendas, setVendas] = useState<VendaGC[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentosStatus, setDocumentosStatus] = useState<Record<string, DocumentosStatus>>({});
  
  const { gerarDocumentoA4, gerarPDFConsolidado } = useGerarDocumentoVenda();
  const { gerarNF, emitirNF, gerarNFsEmMassa, abrirNF, loading: loadingNF, loadingEmitir } = useGestaoClickNF();

  // Carregar status dos documentos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDocumentosStatus(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar status dos documentos:", e);
      }
    }
  }, []);

  // Salvar status no localStorage quando mudar
  useEffect(() => {
    if (Object.keys(documentosStatus).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documentosStatus));
    }
  }, [documentosStatus]);

  const [syncing, setSyncing] = useState(false);

  // Sincronizar status com GestaoClick (verificar exclusões)
  const sincronizarComGestaoClick = useCallback(async () => {
    setSyncing(true);
    try {
      // Buscar agendamentos para verificar
      const { data: agendamentos } = await supabase
        .from("agendamentos_clientes")
        .select("id, gestaoclick_venda_id, gestaoclick_nf_id")
        .not("gestaoclick_venda_id", "is", null);

      if (!agendamentos || agendamentos.length === 0) {
        return { vendasExcluidas: 0, nfsExcluidas: 0 };
      }

      // Chamar edge function para verificar cada venda/NF
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'sincronizar_status',
          agendamentos: agendamentos.map(a => ({
            id: a.id,
            gestaoclick_venda_id: a.gestaoclick_venda_id,
            gestaoclick_nf_id: a.gestaoclick_nf_id
          }))
        }
      });

      if (error) {
        console.error("Erro ao sincronizar:", error);
        return { vendasExcluidas: 0, nfsExcluidas: 0 };
      }

      return {
        vendasExcluidas: data?.vendasExcluidas?.length || 0,
        nfsExcluidas: data?.nfsExcluidas?.length || 0
      };
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      return { vendasExcluidas: 0, nfsExcluidas: 0 };
    } finally {
      setSyncing(false);
    }
  }, []);

  const carregarVendas = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar agendamentos com gestaoclick_venda_id preenchido
      const { data: agendamentos, error } = await supabase
        .from("agendamentos_clientes")
        .select(`
          id,
          cliente_id,
          gestaoclick_venda_id,
          gestaoclick_sincronizado_em,
          gestaoclick_nf_id,
          gestaoclick_nf_status,
          data_proxima_reposicao,
          quantidade_total,
          itens_personalizados
        `)
        .not("gestaoclick_venda_id", "is", null)
        .order("data_proxima_reposicao", { ascending: true });

      if (error) throw error;

      if (!agendamentos || agendamentos.length === 0) {
        setVendas([]);
        setLoading(false);
        return;
      }

      // Buscar dados dos clientes
      const clienteIds = [...new Set(agendamentos.map(a => a.cliente_id))];
      const { data: clientes } = await supabase
        .from("clientes")
        .select("id, nome, cnpj_cpf, endereco_entrega, contato_telefone, contato_email, forma_pagamento, tipo_cobranca, prazo_pagamento_dias")
        .in("id", clienteIds);

      const clientesMap = new Map(clientes?.map(c => [c.id, c]) || []);

      // Buscar preços personalizados
      const { data: precosPersonalizados } = await supabase
        .from("precos_categoria_cliente")
        .select("cliente_id, categoria_id, preco_unitario")
        .in("cliente_id", clienteIds);

      const precosMap = new Map<string, Map<number, number>>();
      precosPersonalizados?.forEach(p => {
        if (!precosMap.has(p.cliente_id)) {
          precosMap.set(p.cliente_id, new Map());
        }
        precosMap.get(p.cliente_id)!.set(p.categoria_id, p.preco_unitario);
      });

      // Buscar produtos para mapear categoria pelo nome e ordem
      const { data: produtos } = await supabase
        .from("produtos_finais")
        .select("id, nome, categoria_id, ordem_categoria");

      // Buscar configuração de preços padrão
      const { data: configPrecificacao } = await supabase
        .from("configuracoes_sistema")
        .select("configuracoes")
        .eq("modulo", "precificacao")
        .single();

      const precoPadrao = 4.50;
      const precosPadraoCategoria = new Map<number, number>();
      if (configPrecificacao?.configuracoes) {
        const config = configPrecificacao.configuracoes as any;
        if (config.precosPorCategoria) {
          Object.entries(config.precosPorCategoria).forEach(([catId, preco]) => {
            precosPadraoCategoria.set(Number(catId), Number(preco));
          });
        }
      }

      // Montar vendas
      const vendasProcessadas: VendaGC[] = agendamentos.map(ag => {
        const cliente = clientesMap.get(ag.cliente_id);
        const precosCliente = precosMap.get(ag.cliente_id);
        
        // Processar itens - estrutura: { produto: "Nome do Produto", quantidade: X }
        const itensRaw = ag.itens_personalizados as any[] || [];
        const itens = itensRaw.map(item => {
          const nomeProduto = item.produto || item.nome || "Produto";
          
          // Buscar produto pelo nome para obter categoria e ordem
          const produto = produtos?.find(p => p.nome === nomeProduto);
          const categoriaId = produto?.categoria_id;
          const ordemCategoria = produto?.ordem_categoria ?? 999;
          
          // Determinar preço: personalizado > padrão categoria > fallback
          let precoUnitario = precoPadrao;
          if (categoriaId && precosCliente?.has(categoriaId)) {
            precoUnitario = precosCliente.get(categoriaId)!;
          } else if (categoriaId && precosPadraoCategoria.has(categoriaId)) {
            precoUnitario = precosPadraoCategoria.get(categoriaId)!;
          }

          return {
            produto_id: produto?.id || "",
            produto_nome: nomeProduto,
            quantidade: item.quantidade || 0,
            preco_unitario: precoUnitario,
            subtotal: (item.quantidade || 0) * precoUnitario,
            categoria_id: categoriaId,
            ordem_categoria: ordemCategoria
          };
        });
        
        // Ordenar itens pela ordem_categoria
        itens.sort((a, b) => (a.ordem_categoria ?? 999) - (b.ordem_categoria ?? 999));

        const valorTotal = itens.reduce((sum, item) => sum + item.subtotal, 0);

        return {
          id: ag.id,
          gestaoclick_venda_id: ag.gestaoclick_venda_id!,
          gestaoclick_sincronizado_em: ag.gestaoclick_sincronizado_em || "",
          gestaoclick_nf_id: ag.gestaoclick_nf_id || undefined,
          gestaoclick_nf_status: (ag as any).gestaoclick_nf_status as NfStatus || null,
          cliente_id: ag.cliente_id,
          cliente_nome: cliente?.nome || "Cliente",
          cliente_cnpj_cpf: cliente?.cnpj_cpf || undefined,
          cliente_endereco: cliente?.endereco_entrega || undefined,
          cliente_telefone: cliente?.contato_telefone || undefined,
          cliente_email: cliente?.contato_email || undefined,
          forma_pagamento: cliente?.forma_pagamento || "PIX",
          tipo_cobranca: cliente?.tipo_cobranca || "A_VISTA",
          prazo_pagamento_dias: cliente?.prazo_pagamento_dias || 7,
          data_proxima_reposicao: ag.data_proxima_reposicao || "",
          quantidade_total: ag.quantidade_total || 0,
          itens,
          valor_total: valorTotal,
          data_vencimento: ""
        };
      });

      setVendas(vendasProcessadas);
    } catch (error) {
      console.error("Erro ao carregar vendas GC:", error);
      toast.error("Erro ao carregar vendas do GestaoClick");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarVendas();
  }, [carregarVendas]);

  // Filtrar vendas
  const vendasFiltradas = useMemo(() => {
    if (!searchTerm) return vendas;
    const term = searchTerm.toLowerCase();
    return vendas.filter(v => 
      v.cliente_nome.toLowerCase().includes(term) ||
      v.gestaoclick_venda_id.includes(term)
    );
  }, [vendas, searchTerm]);

  // Calcular pendências - usar gestaoclick_nf_id para NF status
  const { pendentesA4, pendentesBoleto, pendentesNF, tudoGerado } = useMemo(() => {
    let a4 = 0, boleto = 0, nf = 0;
    
    vendasFiltradas.forEach(v => {
      const status = documentosStatus[v.id] || { a4: false, boleto: false, nf: false };
      if (!status.a4) a4++;
      if (v.forma_pagamento === 'BOLETO' && !status.boleto) boleto++;
      // NF pendente se não tem gestaoclick_nf_id E não está marcado localmente
      if (!v.gestaoclick_nf_id && !status.nf) nf++;
    });

    const tudo = vendasFiltradas.length > 0 && a4 === 0 && boleto === 0 && nf === 0;
    
    return { pendentesA4: a4, pendentesBoleto: boleto, pendentesNF: nf, tudoGerado: tudo };
  }, [vendasFiltradas, documentosStatus]);

  // Handlers
  const handleGerarA4 = (venda: VendaGC) => {
    gerarDocumentoA4(venda);
    setDocumentosStatus(prev => ({
      ...prev,
      [venda.id]: { ...prev[venda.id], a4: true, boleto: prev[venda.id]?.boleto || false, nf: prev[venda.id]?.nf || false }
    }));
    toast.success(`Documento A4 gerado para ${venda.cliente_nome}`);
  };

  const handleGerarBoleto = (venda: VendaGC) => {
    // UI only - marcar como gerado
    setDocumentosStatus(prev => ({
      ...prev,
      [venda.id]: { ...prev[venda.id], a4: prev[venda.id]?.a4 || false, boleto: true, nf: prev[venda.id]?.nf || false }
    }));
    toast.info(`Boleto marcado como gerado (integração pendente)`);
  };

  // Gerar NF (cria rascunho em aberto)
  const handleGerarNF = async (venda: VendaGC) => {
    const result = await gerarNF(venda.id, venda.cliente_id);
    
    if (result.success && result.nfId) {
      toast.success(`NF #${result.nfId} criada (em aberto). Clique em "Emitir NF" para emitir.`);
      carregarVendas();
    } else {
      toast.error(result.error || "Erro ao gerar NF");
    }
  };

  // Emitir NF existente
  const handleEmitirNF = async (venda: VendaGC) => {
    if (!venda.gestaoclick_nf_id) {
      toast.error("Nenhuma NF para emitir. Gere a NF primeiro.");
      return;
    }

    const result = await emitirNF(venda.gestaoclick_nf_id, venda.id);
    
    if (result.success && result.emitida) {
      toast.success(`NF #${venda.gestaoclick_nf_id} emitida com sucesso!`);
      carregarVendas();
    } else if (result.success && !result.emitida) {
      toast.warning(`NF não pôde ser emitida: ${result.warning || 'Verifique no GestaoClick.'}`);
      carregarVendas();
    } else {
      toast.error(result.error || "Erro ao emitir NF");
    }
  };

  // Regenerar NF (limpa a anterior e cria nova)
  const handleRegenerarNF = async (venda: VendaGC) => {
    // Limpar NF no banco primeiro
    const { error } = await supabase
      .from('agendamentos_clientes')
      .update({ 
        gestaoclick_nf_id: null,
        gestaoclick_nf_status: null 
      })
      .eq('id', venda.id);

    if (error) {
      toast.error("Erro ao limpar NF anterior");
      return;
    }

    // Gerar nova NF
    const result = await gerarNF(venda.id, venda.cliente_id);
    
    if (result.success && result.nfId) {
      toast.success(`Nova NF #${result.nfId} criada (em aberto). Clique em "Emitir NF" para emitir.`);
      carregarVendas();
    } else {
      toast.error(result.error || "Erro ao gerar nova NF");
      carregarVendas();
    }
  };

  const handleGerarTodosA4 = () => {
    const pendentes = vendasFiltradas.filter(v => !documentosStatus[v.id]?.a4);
    pendentes.forEach(v => handleGerarA4(v));
    if (pendentes.length > 0) {
      toast.success(`${pendentes.length} documentos A4 gerados`);
    }
  };

  const handleGerarTodosBoletos = () => {
    const pendentes = vendasFiltradas.filter(v => 
      v.forma_pagamento === 'BOLETO' && !documentosStatus[v.id]?.boleto
    );
    pendentes.forEach(v => handleGerarBoleto(v));
    if (pendentes.length > 0) {
      toast.info(`${pendentes.length} boletos marcados (integração pendente)`);
    }
  };

  const handleGerarTodasNFs = async () => {
    const pendentes = vendasFiltradas.filter(v => !v.gestaoclick_nf_id && !documentosStatus[v.id]?.nf);
    
    if (pendentes.length === 0) {
      toast.info("Todas as NFs já foram geradas");
      return;
    }

    toast.info(`Gerando ${pendentes.length} NFs...`);
    
    const result = await gerarNFsEmMassa(
      pendentes.map(v => ({ id: v.id, clienteId: v.cliente_id }))
    );
    
    if (result.sucesso > 0) {
      toast.success(`${result.sucesso} NFs geradas com sucesso`);
      carregarVendas();
    }
    if (result.falha > 0) {
      toast.error(`${result.falha} NFs falharam: ${result.erros[0] || 'Erro desconhecido'}`);
    }
  };

  const handleImprimirTodos = () => {
    gerarPDFConsolidado(vendasFiltradas);
    toast.success("PDF consolidado gerado para impressão");
  };

  // Handler de atualização com sincronização
  const handleRefresh = async () => {
    toast.info("Sincronizando com GestaoClick...");
    const { vendasExcluidas, nfsExcluidas } = await sincronizarComGestaoClick();
    
    if (vendasExcluidas > 0 || nfsExcluidas > 0) {
      toast.warning(`${vendasExcluidas} vendas e ${nfsExcluidas} NFs foram removidas do GC`);
      // Limpar status local dos documentos excluídos
      setDocumentosStatus({});
    }
    
    await carregarVendas();
    toast.success("Dados atualizados");
  };

  const getDocumentosStatus = (vendaId: string): DocumentosStatus => {
    return documentosStatus[vendaId] || { a4: false, boleto: false, nf: false };
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações em Massa */}
      <AcoesMassaGC
        totalVendas={vendasFiltradas.length}
        pendentesA4={pendentesA4}
        pendentesBoleto={pendentesBoleto}
        pendentesNF={pendentesNF}
        tudoGerado={tudoGerado}
        onGerarTodosA4={handleGerarTodosA4}
        onGerarTodosBoletos={handleGerarTodosBoletos}
        onGerarTodasNFs={handleGerarTodasNFs}
        onImprimirTodos={handleImprimirTodos}
      />

      {/* Barra de Busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou nº venda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={loading || syncing}
        >
          <RefreshCw className={`h-4 w-4 ${loading || syncing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Lista de Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : vendasFiltradas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma venda GestaoClick pendente</p>
          <p className="text-sm">Vendas com entregas confirmadas não aparecem aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendasFiltradas.map(venda => (
            <VendaGCCard
              key={venda.id}
              venda={venda}
              documentosStatus={getDocumentosStatus(venda.id)}
              onGerarA4={() => handleGerarA4(venda)}
              onGerarBoleto={() => handleGerarBoleto(venda)}
              onGerarNF={() => handleGerarNF(venda)}
              onEmitirNF={() => handleEmitirNF(venda)}
              onRegenerarNF={() => handleRegenerarNF(venda)}
              loadingNF={loadingNF}
              loadingEmitir={loadingEmitir}
            />
          ))}
        </div>
      )}
    </div>
  );
}
