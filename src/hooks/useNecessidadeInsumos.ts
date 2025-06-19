
import { useState, useCallback, useMemo } from 'react';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';
import { useSupabaseReceitas } from './useSupabaseReceitas';
import { useSupabaseInsumos } from './useSupabaseInsumos';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useProporoesPadrao } from './useProporoesPadrao';
import { format } from 'date-fns';

export interface NecessidadeInsumo {
  insumoId: string;
  nomeInsumo: string;
  unidadeMedida: string;
  quantidadeNecessaria: number;
  estoqueAtual: number;
  quantidadeComprar: number;
  custoMedio: number;
  custoTotal: number;
}

export const useNecessidadeInsumos = () => {
  const [loading, setLoading] = useState(false);
  const [necessidadeInsumos, setNecessidadeInsumos] = useState<NecessidadeInsumo[]>([]);
  const [resumoCalculo, setResumoCalculo] = useState<{
    totalSabores: number;
    totalReceitas: number;
    totalInsumos: number;
    valorTotalCompra: number;
  } | null>(null);
  const [dadosAuditoria, setDadosAuditoria] = useState<any[]>([]);

  const { agendamentos, agendamentosCompletos } = useAgendamentoClienteStore();
  const { receitas } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();
  const { produtos } = useSupabaseProdutos();
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();

  // Processar agendamentos para o período específico (otimizado)
  const processarAgendamentosLocal = useCallback(async (
    dataInicio: string,
    dataFim: string
  ) => {
    console.log('🔄 Processando agendamentos para período:', dataInicio, 'até', dataFim);
    
    if (!agendamentos || agendamentos.length === 0) {
      console.log('❌ Nenhum agendamento disponível');
      return [];
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Filtrar agendamentos pelo período local
    const agendamentosFiltrados = agendamentos.filter(agendamento => {
      try {
        const dataReposicao = new Date(agendamento.dataReposicao);
        return dataReposicao >= inicio && dataReposicao <= fim;
      } catch (error) {
        console.error('❌ Erro ao filtrar agendamento:', agendamento.cliente.nome, error);
        return false;
      }
    });

    console.log('📋 Agendamentos filtrados:', agendamentosFiltrados.length);

    // Processar cada agendamento
    const dadosProcessados = [];
    
    for (const agendamento of agendamentosFiltrados) {
      const quantidadesPorProduto: Record<string, number> = {};
      
      // Inicializar produtos ativos
      produtos.forEach(produto => {
        if (produto.ativo) {
          quantidadesPorProduto[produto.nome] = 0;
        }
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
                quantidadesPorProduto[item.produto] = Number(item.quantidade) || 0;
              }
            });
          } else if (agendamentoCompleto.tipo_pedido === 'Padrão') {
            const quantidadeTotal = Number(agendamentoCompleto.quantidade_total) || 0;
            
            if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
              const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
              
              quantidadesCalculadas.forEach((item: any) => {
                if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                  quantidadesPorProduto[item.produto] = Number(item.quantidade) || 0;
                }
              });
            }
          }
        } else {
          // Fallback
          if (agendamento.pedido && 
              agendamento.pedido.tipoPedido === 'Alterado' && 
              agendamento.pedido.itensPedido && 
              agendamento.pedido.itensPedido.length > 0) {
            
            agendamento.pedido.itensPedido.forEach((item: any) => {
              const nomeProduto = item.nomeSabor || (item.sabor && item.sabor.nome);
              const quantidade = Number(item.quantidadeSabor) || 0;
              
              if (nomeProduto && quantidade > 0 && quantidadesPorProduto.hasOwnProperty(nomeProduto)) {
                quantidadesPorProduto[nomeProduto] = quantidade;
              }
            });
          } else {
            const quantidadeTotal = Number(agendamento.cliente.quantidadePadrao) || 0;
            
            if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
              const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
              
              quantidadesCalculadas.forEach((item: any) => {
                if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                  quantidadesPorProduto[item.produto] = Number(item.quantidade) || 0;
                }
              });
            }
          }
        }

        dadosProcessados.push({
          clienteNome: agendamento.cliente.nome,
          statusAgendamento: agendamento.statusAgendamento,
          dataReposicao: agendamento.dataReposicao,
          statusCliente: agendamento.cliente.statusCliente || 'Ativo',
          quantidadesPorProduto
        });

      } catch (error) {
        console.error('❌ Erro ao processar agendamento:', agendamento.cliente.nome, error);
      }
    }

    console.log('✅ Dados processados:', dadosProcessados.length);
    return dadosProcessados;
  }, [agendamentos, agendamentosCompletos, produtos, calcularQuantidadesPorProporcao, temProporcoesConfiguradas]);

  const calcularNecessidadeInsumos = useCallback(async (
    dataInicio: string,
    dataFim: string
  ) => {
    setLoading(true);
    
    try {
      console.log('🔄 Iniciando cálculo de necessidade de insumos...');
      
      // Processar agendamentos com filtro local
      const dadosProcessados = await processarAgendamentosLocal(dataInicio, dataFim);
      setDadosAuditoria(dadosProcessados);
      
      if (!dadosProcessados || dadosProcessados.length === 0) {
        console.log('❌ Nenhum agendamento encontrado para o período');
        setNecessidadeInsumos([]);
        setResumoCalculo(null);
        return;
      }

      console.log('📊 Agendamentos encontrados:', dadosProcessados.length);

      // Consolidar quantidades por produto
      const quantidadesPorProduto = new Map<string, number>();
      
      dadosProcessados.forEach(agendamento => {
        Object.entries(agendamento.quantidadesPorProduto).forEach(([nomeProduto, quantidade]) => {
          const quantidadeNum = Number(quantidade) || 0;
          if (quantidadeNum > 0) {
            const atual = quantidadesPorProduto.get(nomeProduto) || 0;
            quantidadesPorProduto.set(nomeProduto, atual + quantidadeNum);
          }
        });
      });

      console.log('📦 Produtos consolidados:', Object.fromEntries(quantidadesPorProduto));

      // Subtrair estoque atual de produtos
      const necessidadeProducao = new Map<string, number>();
      
      quantidadesPorProduto.forEach((quantidadeNecessaria, nomeProduto) => {
        const produto = produtos.find(p => p.nome === nomeProduto);
        const estoqueAtual = Number(produto?.estoque_atual) || 0;
        const necessidade = Math.max(0, quantidadeNecessaria - estoqueAtual);
        
        if (necessidade > 0) {
          necessidadeProducao.set(nomeProduto, necessidade);
        }
      });

      console.log('🏭 Necessidade de produção:', Object.fromEntries(necessidadeProducao));

      // Calcular necessidade de insumos por receita
      const necessidadeInsumosPorId = new Map<string, {
        nome: string;
        unidade: string;
        quantidade: number;
        custoMedio: number;
      }>();

      let totalReceitas = 0;

      necessidadeProducao.forEach((quantidadeNecessaria, nomeProduto) => {
        const receita = receitas.find(r => r.nome === nomeProduto);
        
        if (!receita) {
          console.warn(`⚠️ Receita não encontrada para produto: ${nomeProduto}`);
          return;
        }

        // CORREÇÃO: Cada receita gera 40 unidades (não usar receita.rendimento)
        const numeroReceitas = Math.ceil(quantidadeNecessaria / 40);
        totalReceitas += numeroReceitas;
        
        console.log(`📝 ${nomeProduto}: ${quantidadeNecessaria} unidades = ${numeroReceitas} receitas (40 unidades/receita)`);

        receita.itens.forEach(item => {
          const quantidadeItem = Number(item.quantidade) * numeroReceitas;
          const atual = necessidadeInsumosPorId.get(item.insumo_id) || {
            nome: item.nome_insumo,
            unidade: '',
            quantidade: 0,
            custoMedio: 0
          };
          
          const insumo = insumos.find(i => i.id === item.insumo_id);
          if (insumo) {
            atual.nome = insumo.nome;
            atual.unidade = insumo.unidade_medida;
            atual.custoMedio = Number(insumo.custo_medio);
          }
          
          atual.quantidade += quantidadeItem;
          necessidadeInsumosPorId.set(item.insumo_id, atual);
        });
      });

      // Subtrair estoque atual de insumos e calcular o que comprar
      const necessidadeFinal: NecessidadeInsumo[] = [];
      let valorTotalCompra = 0;

      necessidadeInsumosPorId.forEach((necessidade, insumoId) => {
        const insumo = insumos.find(i => i.id === insumoId);
        const estoqueAtual = Number(insumo?.estoque_atual) || 0;
        const quantidadeComprar = Math.max(0, necessidade.quantidade - estoqueAtual);
        const custoTotal = quantidadeComprar * necessidade.custoMedio;
        
        valorTotalCompra += custoTotal;

        necessidadeFinal.push({
          insumoId,
          nomeInsumo: necessidade.nome,
          unidadeMedida: necessidade.unidade,
          quantidadeNecessaria: necessidade.quantidade,
          estoqueAtual,
          quantidadeComprar,
          custoMedio: necessidade.custoMedio,
          custoTotal
        });
      });

      // Ordenar por quantidade a comprar (maior primeiro)
      necessidadeFinal.sort((a, b) => b.quantidadeComprar - a.quantidadeComprar);

      setNecessidadeInsumos(necessidadeFinal);
      setResumoCalculo({
        totalSabores: quantidadesPorProduto.size,
        totalReceitas,
        totalInsumos: necessidadeFinal.length,
        valorTotalCompra
      });

      console.log('✅ Cálculo concluído:', {
        insumos: necessidadeFinal.length,
        valorTotal: valorTotalCompra
      });

    } catch (error) {
      console.error('❌ Erro no cálculo de necessidade de insumos:', error);
      setNecessidadeInsumos([]);
      setResumoCalculo(null);
    } finally {
      setLoading(false);
    }
  }, [processarAgendamentosLocal, receitas, insumos, produtos]);

  return {
    necessidadeInsumos,
    resumoCalculo,
    loading,
    calcularNecessidadeInsumos,
    dadosAuditoria
  };
};
