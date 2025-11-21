import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EntregaOrganizada {
  id: string;
  clienteId: string;
  clienteNome: string;
  endereco: string;
  telefone?: string;
  representante: string;
  dataPrevista: Date;
  quantidade: number;
  tipoCobranca: string;
  formaPagamento: string;
  emiteNotaFiscal: boolean;
  precos: { categoria: string; preco: number }[];
  observacao: string;
  selecionada: boolean;
  ordem: number;
}

export const useOrganizacaoEntregas = (dataFiltro: string) => {
  const [entregas, setEntregas] = useState<EntregaOrganizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [textoGerado, setTextoGerado] = useState('');

  useEffect(() => {
    carregarEntregas();
  }, [dataFiltro]);

  useEffect(() => {
    gerarTexto();
  }, [entregas]);

  const carregarEntregas = async () => {
    setLoading(true);
    try {
      // Query principal: agendamentos com clientes
      const { data: agendamentos, error: agendError } = await supabase
        .from('agendamentos_clientes')
        .select(`
          id,
          cliente_id,
          data_proxima_reposicao,
          quantidade_total,
          status_agendamento,
          clientes!inner (
            nome,
            endereco_entrega,
            contato_telefone,
            tipo_cobranca,
            forma_pagamento,
            emite_nota_fiscal,
            representante_id
          )
        `)
        .eq('data_proxima_reposicao', dataFiltro)
        .in('status_agendamento', ['Despachar', 'Previsto']);

      if (agendError) throw agendError;
      if (!agendamentos || agendamentos.length === 0) {
        setEntregas([]);
        setLoading(false);
        return;
      }

      // Queries complementares em paralelo (não bloqueantes)
      const [representantesResult, precosResult] = await Promise.allSettled([
        supabase.from('representantes').select('id, nome').eq('ativo', true),
        supabase.from('precos_categoria_cliente').select(`
          cliente_id,
          preco_unitario,
          categorias_produto!inner (nome)
        `)
      ]);

      // Mapear dados complementares
      const representantesMap = new Map();
      if (representantesResult.status === 'fulfilled' && representantesResult.value.data) {
        representantesResult.value.data.forEach((rep: any) => {
          representantesMap.set(rep.id, rep.nome);
        });
      }

      const precosMap = new Map();
      if (precosResult.status === 'fulfilled' && precosResult.value.data) {
        precosResult.value.data.forEach((preco: any) => {
          if (!precosMap.has(preco.cliente_id)) {
            precosMap.set(preco.cliente_id, []);
          }
          precosMap.get(preco.cliente_id).push({
            categoria: preco.categorias_produto?.nome || 'Sem categoria',
            preco: preco.preco_unitario || 0
          });
        });
      }

      // Normalizar e mapear entregas
      const entregasProcessadas: EntregaOrganizada[] = agendamentos.map((ag: any, index: number) => {
        const cliente = ag.clientes;
        const representanteNome = representantesMap.get(cliente?.representante_id) || 'Sem representante';
        const precosCliente = precosMap.get(ag.cliente_id) || [];

        return {
          id: ag.id,
          clienteId: ag.cliente_id,
          clienteNome: cliente?.nome || 'Cliente sem nome',
          endereco: cliente?.endereco_entrega || 'Endereço não cadastrado',
          telefone: cliente?.contato_telefone || undefined,
          representante: representanteNome,
          dataPrevista: new Date(ag.data_proxima_reposicao),
          quantidade: ag.quantidade_total || 0,
          tipoCobranca: normalizarTipoCobranca(cliente?.tipo_cobranca),
          formaPagamento: normalizarFormaPagamento(cliente?.forma_pagamento),
          emiteNotaFiscal: cliente?.emite_nota_fiscal ?? false,
          precos: precosCliente,
          observacao: '',
          selecionada: false,
          ordem: index + 1
        };
      });

      setEntregas(entregasProcessadas);
    } catch (error: any) {
      console.error('Erro ao carregar entregas:', error);
      toast.error('Erro ao carregar entregas: ' + error.message);
      setEntregas([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizarTipoCobranca = (tipo?: string): string => {
    if (!tipo) return 'À vista';
    const tipos: Record<string, string> = {
      'a_vista': 'À vista',
      'avista': 'À vista',
      'À vista': 'À vista',
      'a_prazo': 'A prazo',
      'aprazo': 'A prazo',
      'A prazo': 'A prazo'
    };
    return tipos[tipo] || tipo;
  };

  const normalizarFormaPagamento = (forma?: string): string => {
    if (!forma) return 'Dinheiro';
    const formas: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'boleto': 'Boleto',
      'cartao': 'Cartão',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito'
    };
    return formas[forma.toLowerCase()] || forma;
  };

  const toggleSelecao = (id: string) => {
    setEntregas(prev => prev.map(e => 
      e.id === id ? { ...e, selecionada: !e.selecionada } : e
    ));
  };

  const atualizarObservacao = (id: string, observacao: string) => {
    setEntregas(prev => prev.map(e => 
      e.id === id ? { ...e, observacao } : e
    ));
  };

  const atualizarOrdem = (id: string, novaOrdem: number) => {
    setEntregas(prev => prev.map(e => 
      e.id === id ? { ...e, ordem: novaOrdem } : e
    ));
  };

  const selecionarTodas = () => {
    setEntregas(prev => prev.map(e => ({ ...e, selecionada: true })));
  };

  const desselecionarTodas = () => {
    setEntregas(prev => prev.map(e => ({ ...e, selecionada: false })));
  };

  const gerarTexto = () => {
    const selecionadas = entregas
      .filter(e => e.selecionada)
      .sort((a, b) => a.ordem - b.ordem);

    if (selecionadas.length === 0) {
      setTextoGerado('');
      return;
    }

    const linhas = selecionadas.map((entrega, index) => {
      const partes: string[] = [];
      
      partes.push(`${index + 1}. ${entrega.clienteNome}`);
      partes.push(`📍 ${entrega.endereco}`);
      
      if (entrega.telefone) {
        partes.push(`📞 ${entrega.telefone}`);
      }
      
      partes.push(`📦 Quantidade: ${entrega.quantidade}`);
      partes.push(`💰 ${entrega.tipoCobranca} - ${entrega.formaPagamento}`);
      
      if (entrega.emiteNotaFiscal) {
        partes.push(`📄 Emite NF`);
      }
      
      if (entrega.precos.length > 0) {
        partes.push(`💵 Preços:`);
        entrega.precos.forEach(p => {
          partes.push(`   • ${p.categoria}: R$ ${p.preco.toFixed(2)}`);
        });
      }
      
      if (entrega.observacao) {
        partes.push(`📝 ${entrega.observacao}`);
      }
      
      partes.push(`👤 Rep: ${entrega.representante}`);
      
      return partes.join('\n');
    });

    const texto = `🚚 *ENTREGAS DO DIA - ${new Date(dataFiltro).toLocaleDateString('pt-BR')}*\n\n${linhas.join('\n\n---\n\n')}`;
    setTextoGerado(texto);
  };

  return {
    entregas,
    loading,
    textoGerado,
    toggleSelecao,
    atualizarObservacao,
    atualizarOrdem,
    selecionarTodas,
    desselecionarTodas,
    recarregar: carregarEntregas
  };
};
