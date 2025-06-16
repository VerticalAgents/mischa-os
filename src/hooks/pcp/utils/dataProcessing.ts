
import { AgendamentoItem } from '@/components/agendamento/types';
import { ProdutoComCategoria } from '../types';

export const processarAgendamentosBatch = async (
  agendamentos: AgendamentoItem[],
  produtosAtivosComCategoria: ProdutoComCategoria[],
  agendamentosCompletos: Map<string, any>,
  calcularQuantidadesPorProporcao: (quantidade: number) => Promise<any[]>,
  temProporcoesConfiguradas: () => boolean,
  batchSize: number = 50 // Aumentei o batch size para melhor performance
) => {
  const dadosProcessados: any[] = [];
  
  // Criar mapa de produtos para acesso O(1)
  const produtosMap = new Map<string, boolean>();
  produtosAtivosComCategoria.forEach(produto => {
    produtosMap.set(produto.nome, true);
  });

  // Processar em lotes menores para evitar bloqueio da UI
  for (let i = 0; i < agendamentos.length; i += batchSize) {
    const batch = agendamentos.slice(i, i + batchSize);
    
    // Usar Promise.all para processar o lote em paralelo
    const batchPromises = batch.map(async (agendamento) => {
      const quantidadesPorProduto: Record<string, number> = {};
      
      // Inicializar apenas produtos que existem (otimização)
      produtosAtivosComCategoria.forEach(produto => {
        quantidadesPorProduto[produto.nome] = 0;
      });

      try {
        // Usar cache primeiro (mais eficiente)
        const agendamentoCompleto = agendamentosCompletos.get(agendamento.cliente.id);
        
        if (agendamentoCompleto) {
          await processarAgendamentoCompleto(
            agendamentoCompleto, 
            quantidadesPorProduto, 
            produtosMap,
            calcularQuantidadesPorProporcao,
            temProporcoesConfiguradas
          );
        } else {
          // Fallback mais eficiente
          await processarAgendamentoFallback(
            agendamento, 
            quantidadesPorProduto, 
            produtosMap,
            calcularQuantidadesPorProporcao,
            temProporcoesConfiguradas
          );
        }
      } catch (error) {
        console.error('❌ Erro ao processar agendamento:', agendamento.cliente.nome, error);
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

    // Pequena pausa para não bloquear a UI em lotes grandes
    if (i % (batchSize * 4) === 0 && agendamentos.length > batchSize * 4) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  return dadosProcessados;
};

// Função auxiliar para processar agendamento completo
const processarAgendamentoCompleto = async (
  agendamentoCompleto: any,
  quantidadesPorProduto: Record<string, number>,
  produtosMap: Map<string, boolean>,
  calcularQuantidadesPorProporcao: (quantidade: number) => Promise<any[]>,
  temProporcoesConfiguradas: () => boolean
) => {
  if (agendamentoCompleto.tipo_pedido === 'Alterado' && 
      agendamentoCompleto.itens_personalizados && 
      agendamentoCompleto.itens_personalizados.length > 0) {
    
    // Processar itens personalizados
    agendamentoCompleto.itens_personalizados.forEach((item: any) => {
      if (produtosMap.has(item.produto)) {
        quantidadesPorProduto[item.produto] = item.quantidade;
      }
    });
  } else if (agendamentoCompleto.tipo_pedido === 'Padrão') {
    const quantidadeTotal = agendamentoCompleto.quantidade_total;
    
    if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
      try {
        const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
        
        quantidadesCalculadas.forEach((item: any) => {
          if (produtosMap.has(item.produto)) {
            quantidadesPorProduto[item.produto] = item.quantidade;
          }
        });
      } catch (error) {
        console.error('❌ Erro ao calcular quantidades por proporção:', error);
      }
    }
  }
};

// Função auxiliar para processar agendamento fallback
const processarAgendamentoFallback = async (
  agendamento: AgendamentoItem,
  quantidadesPorProduto: Record<string, number>,
  produtosMap: Map<string, boolean>,
  calcularQuantidadesPorProporcao: (quantidade: number) => Promise<any[]>,
  temProporcoesConfiguradas: () => boolean
) => {
  if (agendamento.pedido && 
      agendamento.pedido.tipoPedido === 'Alterado' && 
      agendamento.pedido.itensPedido && 
      agendamento.pedido.itensPedido.length > 0) {
    
    agendamento.pedido.itensPedido.forEach((item: any) => {
      const nomeProduto = item.nomeSabor || (item.sabor && item.sabor.nome);
      const quantidade = item.quantidadeSabor || 0;
      
      if (nomeProduto && quantidade > 0 && produtosMap.has(nomeProduto)) {
        quantidadesPorProduto[nomeProduto] = quantidade;
      }
    });
  } else {
    const quantidadeTotal = agendamento.cliente.quantidadePadrao || 0;
    
    if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
      try {
        const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
        
        quantidadesCalculadas.forEach((item: any) => {
          if (produtosMap.has(item.produto)) {
            quantidadesPorProduto[item.produto] = item.quantidade;
          }
        });
      } catch (error) {
        console.error('❌ Erro ao calcular quantidades por proporção (fallback):', error);
      }
    }
  }
};

export const filtrarAgendamentos = (
  agendamentos: AgendamentoItem[],
  dataInicio?: string,
  dataFim?: string,
  filtroCliente?: string,
  filtroStatus?: string
) => {
  if (!agendamentos || agendamentos.length === 0) {
    return [];
  }

  const inicio = dataInicio ? new Date(dataInicio) : new Date();
  const fim = dataFim ? new Date(dataFim) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return agendamentos.filter(agendamento => {
    try {
      const dataReposicao = new Date(agendamento.dataReposicao);
      
      // Filtro por período
      const dentroPeríodo = dataReposicao >= inicio && dataReposicao <= fim;
      
      // Filtro por cliente (case insensitive)
      const clienteMatch = !filtroCliente || 
        agendamento.cliente.nome.toLowerCase().includes(filtroCliente.toLowerCase());
      
      // Filtro por status
      const statusMatch = !filtroStatus || filtroStatus === 'todos' || 
        agendamento.statusAgendamento === filtroStatus;
      
      return dentroPeríodo && clienteMatch && statusMatch;
    } catch (error) {
      console.error('❌ Erro ao filtrar agendamento:', agendamento.cliente.nome, error);
      return false;
    }
  });
};
