import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendaGC, DocumentosStatus } from "./gestaoclick/types";
import { VendaGCCard } from "./gestaoclick/VendaGCCard";
import { AcoesMassaGC } from "./gestaoclick/AcoesMassaGC";
import { useGerarDocumentoVenda } from "./gestaoclick/useGerarDocumentoVenda";

const STORAGE_KEY = "gestaoclick_documentos_status";

export default function GestaoClickTab() {
  const [vendas, setVendas] = useState<VendaGC[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentosStatus, setDocumentosStatus] = useState<Record<string, DocumentosStatus>>({});
  
  const { gerarDocumentoA4, gerarPDFConsolidado } = useGerarDocumentoVenda();

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

      // Buscar produtos para mapear categoria
      const { data: produtos } = await supabase
        .from("produtos_finais")
        .select("id, nome, categoria_id");

      const produtosMap = new Map(produtos?.map(p => [p.id, p]) || []);

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
        
        // Processar itens
        const itensRaw = ag.itens_personalizados as any[] || [];
        const itens = itensRaw.map(item => {
          const produto = produtosMap.get(item.produto_id);
          const categoriaId = produto?.categoria_id;
          
          // Determinar preço: personalizado > padrão categoria > fallback
          let precoUnitario = precoPadrao;
          if (categoriaId && precosCliente?.has(categoriaId)) {
            precoUnitario = precosCliente.get(categoriaId)!;
          } else if (categoriaId && precosPadraoCategoria.has(categoriaId)) {
            precoUnitario = precosPadraoCategoria.get(categoriaId)!;
          }

          return {
            produto_id: item.produto_id,
            produto_nome: item.nome || produto?.nome || "Produto",
            quantidade: item.quantidade || 0,
            preco_unitario: precoUnitario,
            subtotal: (item.quantidade || 0) * precoUnitario,
            categoria_id: categoriaId
          };
        });

        const valorTotal = itens.reduce((sum, item) => sum + item.subtotal, 0);

        return {
          id: ag.id,
          gestaoclick_venda_id: ag.gestaoclick_venda_id!,
          gestaoclick_sincronizado_em: ag.gestaoclick_sincronizado_em || "",
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

  // Calcular pendências
  const { pendentesA4, pendentesBoleto, pendentesNF, tudoGerado } = useMemo(() => {
    let a4 = 0, boleto = 0, nf = 0;
    
    vendasFiltradas.forEach(v => {
      const status = documentosStatus[v.id] || { a4: false, boleto: false, nf: false };
      if (!status.a4) a4++;
      if (v.forma_pagamento === 'BOLETO' && !status.boleto) boleto++;
      if (!status.nf) nf++;
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

  const handleGerarNF = (venda: VendaGC) => {
    // UI only - marcar como gerado
    setDocumentosStatus(prev => ({
      ...prev,
      [venda.id]: { ...prev[venda.id], a4: prev[venda.id]?.a4 || false, boleto: prev[venda.id]?.boleto || false, nf: true }
    }));
    toast.info(`NF marcada como gerada (integração pendente)`);
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

  const handleGerarTodasNFs = () => {
    const pendentes = vendasFiltradas.filter(v => !documentosStatus[v.id]?.nf);
    pendentes.forEach(v => handleGerarNF(v));
    if (pendentes.length > 0) {
      toast.info(`${pendentes.length} NFs marcadas (integração pendente)`);
    }
  };

  const handleImprimirTodos = () => {
    gerarPDFConsolidado(vendasFiltradas);
    toast.success("PDF consolidado gerado para impressão");
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
          onClick={carregarVendas}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
