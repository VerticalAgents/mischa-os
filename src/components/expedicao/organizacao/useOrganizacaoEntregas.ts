import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hojeISO } from '@/utils/dataLocal';

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
  linkGoogleMaps?: string;
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
      // Usar a data de HOJE (não o filtro de data do usuário)
      const hoje = hojeISO();
      
      // Query principal: agendamentos de HOJE que estão separados ou despachados
      const { data: agendamentos, error: agendError } = await supabase
        .from('agendamentos_clientes')
        .select(`
          id,
          cliente_id,
          data_proxima_reposicao,
          quantidade_total,
          status_agendamento,
          substatus_pedido,
          clientes!inner (
            nome,
            endereco_entrega,
            contato_telefone,
            tipo_cobranca,
            forma_pagamento,
            emite_nota_fiscal,
            representante_id,
            categorias_habilitadas,
            link_google_maps
          )
        `)
        .eq('data_proxima_reposicao', hoje)
        .eq('status_agendamento', 'Agendado')
        .in('substatus_pedido', ['Separado', 'Despachado']);

      if (agendError) throw agendError;
      if (!agendamentos || agendamentos.length === 0) {
        setEntregas([]);
        setLoading(false);
        return;
      }

      // Buscar usuário logado para filtrar configurações
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Queries complementares em paralelo (não bloqueantes)
      const [representantesResult, precosResult, categoriasResult, configResult] = await Promise.allSettled([
        supabase.from('representantes').select('id, nome').eq('ativo', true),
        supabase.from('precos_categoria_cliente').select(`
          cliente_id,
          categoria_id,
          preco_unitario,
          categorias_produto!inner (id, nome)
        `),
        supabase.from('categorias_produto').select('id, nome').eq('ativo', true),
        currentUser 
          ? supabase.from('configuracoes_sistema').select('configuracoes').eq('modulo', 'precificacao').eq('user_id', currentUser.id).single()
          : Promise.resolve({ data: null, error: null })
      ]);

      // Mapear dados complementares
      const representantesMap = new Map();
      if (representantesResult.status === 'fulfilled' && representantesResult.value.data) {
        representantesResult.value.data.forEach((rep: any) => {
          representantesMap.set(rep.id, rep.nome);
        });
      }

      // Mapear preços personalizados por cliente e categoria
      const precosPersonalizadosMap = new Map<string, Map<number, { categoria: string; preco: number }>>();
      if (precosResult.status === 'fulfilled' && precosResult.value.data) {
        precosResult.value.data.forEach((preco: any) => {
          if (!precosPersonalizadosMap.has(preco.cliente_id)) {
            precosPersonalizadosMap.set(preco.cliente_id, new Map());
          }
          const clientePrecos = precosPersonalizadosMap.get(preco.cliente_id)!;
          clientePrecos.set(preco.categoria_id, {
            categoria: preco.categorias_produto?.nome || 'Sem categoria',
            preco: preco.preco_unitario || 0
          });
        });
      }

      // Mapear categorias por ID
      const categoriasMap = new Map<number, string>();
      if (categoriasResult.status === 'fulfilled' && categoriasResult.value.data) {
        categoriasResult.value.data.forEach((cat: any) => {
          categoriasMap.set(cat.id, cat.nome);
        });
      }

      // Buscar preços padrão das configurações (por categoria ID)
      const precosPadrao: Record<string, number> = {};
      if (configResult.status === 'fulfilled' && configResult.value.data?.configuracoes) {
        const config = configResult.value.data.configuracoes as any;
        if (config.precosPorCategoria) {
          Object.assign(precosPadrao, config.precosPorCategoria);
        }
      }

      // Normalizar e mapear entregas
      const entregasProcessadas: EntregaOrganizada[] = agendamentos.map((ag: any, index: number) => {
        const cliente = ag.clientes;
        const representanteNome = representantesMap.get(cliente?.representante_id) || 'Sem representante';
        
        // Buscar categorias habilitadas do cliente
        const categoriasHabilitadas: number[] = Array.isArray(cliente?.categorias_habilitadas) 
          ? cliente.categorias_habilitadas 
          : [];

        // Construir array de preços baseado nas categorias habilitadas
        const precosCliente: Array<{ categoria: string; preco: number }> = [];
        const precosPersonalizados = precosPersonalizadosMap.get(ag.cliente_id);

        categoriasHabilitadas.forEach((categoriaId: number) => {
          const nomeCategoria = categoriasMap.get(categoriaId);
          if (!nomeCategoria) return;

          // Verificar se tem preço personalizado
          const precoPersonalizado = precosPersonalizados?.get(categoriaId);
          
          if (precoPersonalizado) {
            // Usar preço personalizado
            precosCliente.push({
              categoria: precoPersonalizado.categoria,
              preco: precoPersonalizado.preco
            });
          } else {
            // Usar preço padrão da categoria (das configurações) - buscar por ID
            const precoPadrao = precosPadrao[categoriaId.toString()];
            
            // Só adiciona se houver preço configurado
            if (precoPadrao && precoPadrao > 0) {
              precosCliente.push({
                categoria: nomeCategoria,
                preco: precoPadrao
              });
            }
          }
        });

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
          linkGoogleMaps: cliente?.link_google_maps || undefined,
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
    setEntregas(prev => {
      const itemAtual = prev.find(e => e.id === id);
      if (!itemAtual) return prev;
      
      const ordemAntiga = itemAtual.ordem;
      
      // Se a ordem não mudou, não faz nada
      if (ordemAntiga === novaOrdem) return prev;
      
      // Encontrar o item que tem a nova ordem (para fazer swap)
      const itemComNovaOrdem = prev.find(e => e.ordem === novaOrdem && e.id !== id);
      
      return prev.map(e => {
        if (e.id === id) {
          // Item atual recebe a nova ordem
          return { ...e, ordem: novaOrdem };
        }
        if (itemComNovaOrdem && e.id === itemComNovaOrdem.id) {
          // Item que tinha a nova ordem recebe a ordem antiga (swap)
          return { ...e, ordem: ordemAntiga };
        }
        return e;
      });
    });
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
      partes.push(`${entrega.endereco}`);
      
      if (entrega.linkGoogleMaps) {
        partes.push(`📍 ${entrega.linkGoogleMaps}`);
      }
      
      if (entrega.telefone) {
        partes.push(`📞 ${entrega.telefone}`);
      }
      
      partes.push(`📦 Quantidade: ${entrega.quantidade}`);
      partes.push(`💰 ${entrega.tipoCobranca} - ${entrega.formaPagamento}`);
      
      const textoNF = entrega.emiteNotaFiscal ? 'Exige NF na entrega' : 'Sem NF';
      partes.push(`📄 ${textoNF}`);
      
      if (entrega.precos.length > 0) {
        partes.push(`💵 Preços:`);
        entrega.precos.forEach(p => {
          partes.push(`• ${p.categoria}: R$ ${p.preco.toFixed(2)}`);
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
