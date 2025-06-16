
import { useState, useEffect, useMemo } from 'react';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useProporoesPadrao } from './useProporoesPadrao';
import { useSupabaseCategoriasProduto } from './useSupabaseCategoriasProduto';

export interface AuditoriaItem {
  clienteNome: string;
  statusAgendamento: string;
  dataReposicao: Date;
  statusCliente: string;
  quantidadesPorProduto: Record<string, number>;
}

export interface ProdutoComCategoria {
  nome: string;
  categoria: string;
  categoriaId: number;
}

export const useAuditoriaPCPData = () => {
  const [dadosAuditoria, setDadosAuditoria] = useState<AuditoriaItem[]>([]);
  const [produtosAtivos, setProdutosAtivos] = useState<ProdutoComCategoria[]>([]);
  const [loading, setLoading] = useState(false);

  const { agendamentos, agendamentosCompletos } = useAgendamentoClienteStore();
  const { produtos } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();

  // Memoizar produtos ativos com categorias
  const produtosAtivosComCategoria = useMemo(() => {
    return produtos
      .filter(produto => produto.ativo)
      .map(produto => {
        const categoria = categorias.find(cat => cat.id === produto.categoria_id);
        return {
          nome: produto.nome,
          categoria: categoria?.nome || "Sem categoria",
          categoriaId: produto.categoria_id || 0
        };
      })
      .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome));
  }, [produtos, categorias]);

  // Atualizar produtos ativos
  useEffect(() => {
    setProdutosAtivos(produtosAtivosComCategoria);
  }, [produtosAtivosComCategoria]);

  // Processar dados de auditoria de forma otimizada
  const processarDadosAuditoria = async (dataInicio?: string, dataFim?: string, filtroCliente?: string, filtroStatus?: string) => {
    if (loading) return; // Evitar múltiplas execuções simultâneas
    
    setLoading(true);
    try {
      console.log('🔍 Processando dados de auditoria otimizado...');
      console.log('📊 Total de agendamentos:', agendamentos.length);
      console.log('🏭 Produtos ativos:', produtosAtivosComCategoria.length);

      const inicio = dataInicio ? new Date(dataInicio) : new Date();
      const fim = dataFim ? new Date(dataFim) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Filtrar agendamentos
      const agendamentosFiltrados = agendamentos.filter(agendamento => {
        const dataReposicao = new Date(agendamento.dataReposicao);
        
        // Filtro por período
        const dentroPeríodo = dataReposicao >= inicio && dataReposicao <= fim;
        
        // Filtro por cliente
        const clienteMatch = !filtroCliente || 
          agendamento.cliente.nome.toLowerCase().includes(filtroCliente.toLowerCase());
        
        // Filtro por status
        const statusMatch = !filtroStatus || filtroStatus === 'todos' || 
          agendamento.statusAgendamento === filtroStatus;
        
        return dentroPeríodo && clienteMatch && statusMatch;
      });

      console.log('📋 Agendamentos filtrados:', agendamentosFiltrados.length);

      // Processar em lotes para melhor performance
      const dadosProcessados: AuditoriaItem[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < agendamentosFiltrados.length; i += batchSize) {
        const batch = agendamentosFiltrados.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (agendamento) => {
          const quantidadesPorProduto: Record<string, number> = {};
          
          // Inicializar todas as quantidades como 0
          produtosAtivosComCategoria.forEach(produto => {
            quantidadesPorProduto[produto.nome] = 0;
          });

          try {
            // Usar cache primeiro
            const agendamentoCompleto = agendamentosCompletos.get(agendamento.cliente.id);
            
            if (agendamentoCompleto) {
              if (agendamentoCompleto.tipo_pedido === 'Alterado' && 
                  agendamentoCompleto.itens_personalizados && 
                  agendamentoCompleto.itens_personalizados.length > 0) {
                
                agendamentoCompleto.itens_personalizados.forEach(item => {
                  if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                    quantidadesPorProduto[item.produto] = item.quantidade;
                  }
                });
              } else if (agendamentoCompleto.tipo_pedido === 'Padrão') {
                const quantidadeTotal = agendamentoCompleto.quantidade_total;
                
                if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
                  try {
                    const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
                    
                    quantidadesCalculadas.forEach(item => {
                      if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                        quantidadesPorProduto[item.produto] = item.quantidade;
                      }
                    });
                  } catch (error) {
                    console.error('❌ Erro ao calcular quantidades por proporção:', error);
                  }
                }
              }
            } else {
              // Fallback para dados da lista de agendamentos
              if (agendamento.pedido && 
                  agendamento.pedido.tipoPedido === 'Alterado' && 
                  agendamento.pedido.itensPedido && 
                  agendamento.pedido.itensPedido.length > 0) {
                
                agendamento.pedido.itensPedido.forEach(item => {
                  const nomeProduto = item.nomeSabor || (item.sabor && item.sabor.nome);
                  const quantidade = item.quantidadeSabor || 0;
                  
                  if (nomeProduto && quantidade > 0) {
                    if (quantidadesPorProduto.hasOwnProperty(nomeProduto)) {
                      quantidadesPorProduto[nomeProduto] = quantidade;
                    }
                  }
                });
              } else {
                const quantidadeTotal = agendamento.cliente.quantidadePadrao || 0;
                
                if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
                  try {
                    const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
                    
                    quantidadesCalculadas.forEach(item => {
                      if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                        quantidadesPorProduto[item.produto] = item.quantidade;
                      }
                    });
                  } catch (error) {
                    console.error('❌ Erro ao calcular quantidades por proporção (fallback):', error);
                    if (produtosAtivosComCategoria.length > 0) {
                      const primeiroProduto = produtosAtivosComCategoria[0].nome;
                      quantidadesPorProduto[primeiroProduto] = quantidadeTotal;
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ Erro ao processar agendamento:', error);
          }

          return {
            clienteNome: agendamento.cliente.nome,
            statusAgendamento: agendamento.statusAgendamento,
            dataReposicao: agendamento.dataReposicao,
            statusCliente: agendamento.cliente.statusCliente || 'Ativo',
            quantidadesPorProduto
          };
        });

        const batchResults = await Promise.all(batchPromises);
        dadosProcessados.push(...batchResults);
      }

      console.log('✅ Dados de auditoria processados:', dadosProcessados.length);
      setDadosAuditoria(dadosProcessados);
    } catch (error) {
      console.error('❌ Erro ao processar dados de auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    dadosAuditoria,
    produtosAtivos,
    loading,
    processarDadosAuditoria
  };
};
