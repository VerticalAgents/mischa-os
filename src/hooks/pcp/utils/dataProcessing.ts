
import { AgendamentoItem } from '@/components/agendamento/types';
import { ProdutoComCategoria } from '../types';

export const processarAgendamentosBatch = async (
  agendamentos: AgendamentoItem[],
  produtosAtivosComCategoria: ProdutoComCategoria[],
  agendamentosCompletos: Map<string, any>,
  calcularQuantidadesPorProporcao: (quantidade: number) => Promise<any[]>,
  temProporcoesConfiguradas: () => boolean,
  batchSize: number = 10
) => {
  const dadosProcessados: any[] = [];
  
  for (let i = 0; i < agendamentos.length; i += batchSize) {
    const batch = agendamentos.slice(i, i + batchSize);
    
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
            
            agendamentoCompleto.itens_personalizados.forEach((item: any) => {
              if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                quantidadesPorProduto[item.produto] = item.quantidade;
              }
            });
          } else if (agendamentoCompleto.tipo_pedido === 'Padrão') {
            const quantidadeTotal = agendamentoCompleto.quantidade_total;
            
            if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
              try {
                const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
                
                quantidadesCalculadas.forEach((item: any) => {
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
            
            agendamento.pedido.itensPedido.forEach((item: any) => {
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
                
                quantidadesCalculadas.forEach((item: any) => {
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

  return dadosProcessados;
};

export const filtrarAgendamentos = (
  agendamentos: AgendamentoItem[],
  dataInicio?: string,
  dataFim?: string,
  filtroCliente?: string,
  filtroStatus?: string
) => {
  const inicio = dataInicio ? new Date(dataInicio) : new Date();
  const fim = dataFim ? new Date(dataFim) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return agendamentos.filter(agendamento => {
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
};
