import { useState, useCallback, useMemo } from 'react';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';
import { useSupabaseReceitas } from './useSupabaseReceitas';
import { useSupabaseInsumos } from './useSupabaseInsumos';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useProporoesPadrao } from './useProporoesPadrao';
import { useRendimentosReceitaProduto } from './useRendimentosReceitaProduto';
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

export interface ProdutoIgnorado {
  nomeProduto: string;
  quantidadeNecessaria: number;
  motivo: 'sem_rendimento' | 'sem_receita' | 'receita_sem_insumos';
}

export interface DetalheCalculo {
  produtoNome: string;
  quantidadeNecessaria: number;
  receitaNome: string;
  rendimentoReal?: number;
  rendimentoUsado: number;
  receitasCalculadas: number;
  tipoRendimento: 'real' | 'fallback';
}

export const useNecessidadeInsumos = () => {
  const [loading, setLoading] = useState(false);
  const [necessidadeInsumos, setNecessidadeInsumos] = useState<NecessidadeInsumo[]>([]);
  const [resumoCalculo, setResumoCalculo] = useState<{
    totalSabores: number;
    totalReceitas: number;
    totalInsumos: number;
    valorTotalCompra: number;
    produtosProcessados: number;
    produtosIgnorados: number;
    coberturaRendimentos: number;
  } | null>(null);
  const [dadosAuditoria, setDadosAuditoria] = useState<any[]>([]);
  const [produtosIgnorados, setProdutosIgnorados] = useState<ProdutoIgnorado[]>([]);
  const [detalhesCalculo, setDetalhesCalculo] = useState<DetalheCalculo[]>([]);

  const { agendamentos, agendamentosCompletos } = useAgendamentoClienteStore();
  const { receitas } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();
  const { produtos } = useSupabaseProdutos();
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();
  const { obterRendimentoPorProduto } = useRendimentosReceitaProduto();

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

    const dadosProcessados = [];
    
    for (const agendamento of agendamentosFiltrados) {
      const quantidadesPorProduto: Record<string, number> = {};
      
      produtos.forEach(produto => {
        if (produto.ativo) {
          quantidadesPorProduto[produto.nome] = 0;
        }
      });

      try {
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
      
      const dadosProcessados = await processarAgendamentosLocal(dataInicio, dataFim);
      setDadosAuditoria(dadosProcessados);
      
      if (!dadosProcessados || dadosProcessados.length === 0) {
        console.log('❌ Nenhum agendamento encontrado para o período');
        setNecessidadeInsumos([]);
        setResumoCalculo(null);
        setProdutosIgnorados([]);
        setDetalhesCalculo([]);
        return;
      }

      console.log('📊 Agendamentos encontrados:', dadosProcessados.length);

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

      const necessidadeInsumosPorId = new Map<string, {
        nome: string;
        unidade: string;
        quantidade: number;
        custoMedio: number;
      }>();

      const produtosIgnoradosTemp: ProdutoIgnorado[] = [];
      const detalhesCalculoTemp: DetalheCalculo[] = [];
      let totalReceitas = 0;
      let produtosProcessados = 0;

      console.log('🔄 Iniciando cálculo baseado em rendimentos reais...');

      necessidadeProducao.forEach((quantidadeNecessaria, nomeProduto) => {
        console.log(`📝 Processando produto: ${nomeProduto} (${quantidadeNecessaria} unidades)`);
        
        const produto = produtos.find(p => p.nome === nomeProduto);
        if (!produto) {
          console.warn(`⚠️ Produto não encontrado no cadastro: ${nomeProduto}`);
          produtosIgnoradosTemp.push({
            nomeProduto,
            quantidadeNecessaria,
            motivo: 'sem_receita'
          });
          return;
        }

        const rendimentoVinculo = obterRendimentoPorProduto(produto.id);
        let receita;
        let rendimentoUsado = 40;
        let tipoRendimento: 'real' | 'fallback' = 'fallback';

        if (rendimentoVinculo) {
          rendimentoUsado = Number(rendimentoVinculo.rendimento);
          tipoRendimento = 'real';
          
          receita = receitas.find(r => r.id === rendimentoVinculo.receita_id);
          
          console.log(`✅ Rendimento real encontrado: ${nomeProduto} → ${rendimentoUsado} unidades/receita (receita: ${receita?.nome || 'não encontrada'})`);
        } else {
          receita = receitas.find(r => r.nome === nomeProduto);
          
          console.log(`⚠️ Rendimento não cadastrado para: ${nomeProduto}. Usando fallback: receita "${receita?.nome || 'não encontrada'}" com rendimento padrão ${rendimentoUsado}`);
        }

        if (!receita) {
          console.warn(`❌ Receita não encontrada para produto: ${nomeProduto}`);
          produtosIgnoradosTemp.push({
            nomeProduto,
            quantidadeNecessaria,
            motivo: 'sem_receita'
          });
          return;
        }

        if (!receita.itens || receita.itens.length === 0) {
          console.warn(`❌ Receita sem insumos: ${receita.nome}`);
          produtosIgnoradosTemp.push({
            nomeProduto,
            quantidadeNecessaria,
            motivo: 'receita_sem_insumos'
          });
          return;
        }

        const numeroReceitas = Math.ceil(quantidadeNecessaria / rendimentoUsado);
        totalReceitas += numeroReceitas;
        produtosProcessados++;

        console.log(`📊 ${nomeProduto}: ${quantidadeNecessaria} unidades ÷ ${rendimentoUsado} rendimento = ${numeroReceitas} receitas`);

        detalhesCalculoTemp.push({
          produtoNome: nomeProduto,
          quantidadeNecessaria,
          receitaNome: receita.nome,
          rendimentoReal: rendimentoVinculo?.rendimento,
          rendimentoUsado,
          receitasCalculadas: numeroReceitas,
          tipoRendimento
        });

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

          console.log(`   📌 ${atual.nome}: +${quantidadeItem} (${item.quantidade} × ${numeroReceitas} receitas) = ${atual.quantidade} total`);
        });
      });

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

      necessidadeFinal.sort((a, b) => b.quantidadeComprar - a.quantidadeComprar);

      const totalProdutosComNecessidade = necessidadeProducao.size;
      const coberturaRendimentos = totalProdutosComNecessidade > 0 
        ? (produtosProcessados / totalProdutosComNecessidade) * 100 
        : 100;

      setNecessidadeInsumos(necessidadeFinal);
      setProdutosIgnorados(produtosIgnoradosTemp);
      setDetalhesCalculo(detalhesCalculoTemp);
      setResumoCalculo({
        totalSabores: quantidadesPorProduto.size,
        totalReceitas,
        totalInsumos: necessidadeFinal.length,
        valorTotalCompra,
        produtosProcessados,
        produtosIgnorados: produtosIgnoradosTemp.length,
        coberturaRendimentos
      });

      console.log('✅ Cálculo concluído:', {
        produtosProcessados,
        produtosIgnorados: produtosIgnoradosTemp.length,
        insumos: necessidadeFinal.length,
        valorTotal: valorTotalCompra,
        coberturaRendimentos: `${coberturaRendimentos.toFixed(1)}%`
      });

      console.log('📋 Produtos ignorados:', produtosIgnoradosTemp);
      console.log('📊 Detalhes do cálculo:', detalhesCalculoTemp);

    } catch (error) {
      console.error('❌ Erro no cálculo de necessidade de insumos:', error);
      setNecessidadeInsumos([]);
      setResumoCalculo(null);
      setProdutosIgnorados([]);
      setDetalhesCalculo([]);
    } finally {
      setLoading(false);
    }
  }, [processarAgendamentosLocal, receitas, insumos, produtos, obterRendimentoPorProduto]);

  return {
    necessidadeInsumos,
    resumoCalculo,
    loading,
    calcularNecessidadeInsumos,
    dadosAuditoria,
    produtosIgnorados,
    detalhesCalculo
  };
};
