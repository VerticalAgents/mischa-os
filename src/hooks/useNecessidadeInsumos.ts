
import { useState, useCallback, useMemo } from 'react';
import { useAuditoriaPCPData } from './useAuditoriaPCPData';
import { useSupabaseReceitas } from './useSupabaseReceitas';
import { useSupabaseInsumos } from './useSupabaseInsumos';
import { useSupabaseProdutos } from './useSupabaseProdutos';
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

  const { processarDadosAuditoria, dadosAuditoria } = useAuditoriaPCPData();
  const { receitas } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();
  const { produtos } = useSupabaseProdutos();

  const calcularNecessidadeInsumos = useCallback(async (
    dataInicio: string,
    dataFim: string
  ) => {
    setLoading(true);
    
    try {
      console.log('🔄 Iniciando cálculo de necessidade de insumos...');
      
      // Paso 1: Buscar agendamentos do período
      await processarDadosAuditoria(dataInicio, dataFim, '', 'todos');
      
      if (!dadosAuditoria || dadosAuditoria.length === 0) {
        console.log('❌ Nenhum agendamento encontrado para o período');
        setNecessidadeInsumos([]);
        setResumoCalculo(null);
        return;
      }

      console.log('📊 Agendamentos encontrados:', dadosAuditoria.length);

      // Paso 2: Consolidar quantidades por produto
      const quantidadesPorProduto = new Map<string, number>();
      
      dadosAuditoria.forEach(agendamento => {
        Object.entries(agendamento.quantidadesPorProduto).forEach(([nomeProduto, quantidade]) => {
          if (quantidade > 0) {
            const atual = quantidadesPorProduto.get(nomeProduto) || 0;
            quantidadesPorProduto.set(nomeProduto, atual + quantidade);
          }
        });
      });

      console.log('📦 Produtos consolidados:', Object.fromEntries(quantidadesPorProduto));

      // Paso 3: Subtrair estoque atual de produtos
      const necessidadeProducao = new Map<string, number>();
      
      quantidadesPorProduto.forEach((quantidadeNecessaria, nomeProduto) => {
        const produto = produtos.find(p => p.nome === nomeProduto);
        const estoqueAtual = produto?.estoque_atual || 0;
        const necessidade = Math.max(0, quantidadeNecessaria - estoqueAtual);
        
        if (necessidade > 0) {
          necessidadeProducao.set(nomeProduto, necessidade);
        }
      });

      console.log('🏭 Necessidade de produção:', Object.fromEntries(necessidadeProducao));

      // Paso 4: Calcular necessidade de insumos por receita
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

        // Cada receita gera 40 unidades
        const numeroReceitas = Math.ceil(quantidadeNecessaria / receita.rendimento);
        totalReceitas += numeroReceitas;
        
        console.log(`📝 ${nomeProduto}: ${quantidadeNecessaria} unidades = ${numeroReceitas} receitas`);

        receita.itens.forEach(item => {
          const quantidadeItem = item.quantidade * numeroReceitas;
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

      // Paso 5: Subtrair estoque atual de insumos e calcular o que comprar
      const necessidadeFinal: NecessidadeInsumo[] = [];
      let valorTotalCompra = 0;

      necessidadeInsumosPorId.forEach((necessidade, insumoId) => {
        const insumo = insumos.find(i => i.id === insumoId);
        const estoqueAtual = insumo?.estoque_atual || 0;
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
  }, [processarDadosAuditoria, dadosAuditoria, receitas, insumos, produtos]);

  return {
    necessidadeInsumos,
    resumoCalculo,
    loading,
    calcularNecessidadeInsumos
  };
};
