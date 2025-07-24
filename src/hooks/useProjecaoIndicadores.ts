import { useState, useEffect } from 'react';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseCategoriasProduto } from '@/hooks/useSupabaseCategoriasProduto';
import { useSupabaseTiposLogistica } from '@/hooks/useSupabaseTiposLogistica';
import { useSupabasePrecosCategoriaCliente } from '@/hooks/useSupabasePrecosCategoriaCliente';
import { useSupabaseGirosSemanaPersonalizados } from '@/hooks/useSupabaseGirosSemanaPersonalizados';
import { useConfiguracoesStore } from '@/hooks/useConfiguracoesStore';

// Preços temporários por categoria (fallback)
const PRECOS_TEMPORARIOS: Record<string, number> = {
  'revenda padrão': 4.50,
  'food service': 70.00,
  'default': 5.00
};

// Custos diferenciados por categoria - ATUALIZADO: Revenda Padrão de R$1,32 para R$1,41
const CUSTOS_UNITARIOS: Record<string, number> = {
  'revenda padrão': 1.41,
  'food service': 29.17,
  'default': 1.41
};

const ALIQUOTA_PROVISORIA = 0.04; // 4%

interface IndicadoresGerais {
  faturamentoGeralMensal: number;
  totalGeralMensal: number;
  faturamentoPorCategoria: Record<string, number>;
  custoPorCategoria: Record<string, number>;
  totalCustoInsumosMensal: number;
  totalImpostoMensal: number;
  totalLogisticaMensal: number;
  faturamentoRevendaPadrao: number;
  faturamentoFoodService: number;
  custoInsumosRevendaPadrao: number;
  custoInsumosFoodService: number;
  custoLogistico: number;
  impostos: number;
}

interface ProjecaoCategoria {
  categoriaId: number;
  nomeCategoria: string;
  faturamento: number;
  custoInsumos: number;
}

interface ProjecaoCliente {
  clienteId: string;
  nomeCliente: string;
  categorias: ProjecaoCategoria[];
  emiteNotaFiscal: boolean;
  impostoTotal: number;
  custoLogistico: number;
  lucroBruto: number;
}

export const useProjecaoIndicadores = () => {
  const [indicadores, setIndicadores] = useState<IndicadoresGerais | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { clientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { tiposLogistica } = useSupabaseTiposLogistica();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  const { obterGiroPersonalizado } = useSupabaseGirosSemanaPersonalizados();
  const { obterConfiguracao } = useConfiguracoesStore();

  const obterPrecoCategoria = (nomeCategoria: string): number => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    for (const [key, preco] of Object.entries(PRECOS_TEMPORARIOS)) {
      if (nomeNormalizado.includes(key)) {
        return preco;
      }
    }
    return PRECOS_TEMPORARIOS.default;
  };

  const obterCustoCategoria = (nomeCategoria: string): number => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    for (const [key, custo] of Object.entries(CUSTOS_UNITARIOS)) {
      if (nomeNormalizado.includes(key)) {
        return custo;
      }
    }
    return CUSTOS_UNITARIOS.default;
  };

  const obterPrecoPorCliente = async (clienteId: string, categoriaId: number, categoriaNome: string): Promise<{ preco: number; personalizado: boolean }> => {
    try {
      const precosPersonalizados = await carregarPrecosPorCliente(clienteId);
      const precoPersonalizado = precosPersonalizados.find(p => p.categoria_id === categoriaId);
      
      if (precoPersonalizado && precoPersonalizado.preco_unitario > 0) {
        return {
          preco: precoPersonalizado.preco_unitario,
          personalizado: true
        };
      }
      
      const configPrecificacao = obterConfiguracao('precificacao');
      const precosPadrao = configPrecificacao?.precosPorCategoria || {};
      const precoPadrao = precosPadrao[categoriaId.toString()];
      
      if (precoPadrao && precoPadrao > 0) {
        return {
          preco: precoPadrao,
          personalizado: false
        };
      }
      
      return {
        preco: obterPrecoCategoria(categoriaNome),
        personalizado: false
      };
    } catch (error) {
      console.error(`Erro ao carregar preço para cliente ${clienteId}, categoria ${categoriaId}:`, error);
      const configPrecificacao = obterConfiguracao('precificacao');
      const precosPadrao = configPrecificacao?.precosPorCategoria || {};
      const precoPadrao = precosPadrao[categoriaId.toString()];
      
      return {
        preco: precoPadrao || obterPrecoCategoria(categoriaNome),
        personalizado: false
      };
    }
  };

  const obterPercentualLogistico = (tipoLogistica: string): number => {
    const tipo = tiposLogistica.find(t => t.nome.toLowerCase() === tipoLogistica.toLowerCase() || tipoLogistica.toLowerCase().includes(t.nome.toLowerCase()));
    if (tipo) {
      return tipo.percentual_logistico / 100;
    }

    if (tipoLogistica === 'Distribuição') {
      return 0.08;
    } else if (tipoLogistica === 'Própria') {
      return 0.03;
    }
    return 0;
  };

  const calcularGiroSemanal = (qtdPadrao: number, periodicidade: number, clienteId: string, categoriaId: number): number => {
    const giroPersonalizado = obterGiroPersonalizado(clienteId, categoriaId);
    
    if (giroPersonalizado !== null) {
      return giroPersonalizado;
    }
    
    if (periodicidade === 0) return 0;
    return Math.round(qtdPadrao / periodicidade * 7);
  };

  const calcularIndicadores = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const clientesAtivos = clientes.filter(cliente => cliente.statusCliente === 'Ativo');
      const projecoesCalculadas: ProjecaoCliente[] = [];

      for (const cliente of clientesAtivos) {
        if (!cliente.categoriasHabilitadas || cliente.categoriasHabilitadas.length === 0) {
          continue;
        }

        const categoriasCliente: ProjecaoCategoria[] = [];
        
        for (const categoriaId of cliente.categoriasHabilitadas) {
          const categoria = categorias.find(cat => cat.id === categoriaId);
          if (!categoria) continue;

          const giroSemanal = calcularGiroSemanal(
            cliente.quantidadePadrao, 
            cliente.periodicidadePadrao,
            cliente.id,
            categoriaId
          );
          
          const { preco: precoAplicado } = await obterPrecoPorCliente(
            cliente.id, 
            categoriaId, 
            categoria.nome
          );
          
          const custoUnitario = obterCustoCategoria(categoria.nome);
          const faturamento = giroSemanal * precoAplicado;
          const custoInsumos = giroSemanal * custoUnitario;

          categoriasCliente.push({
            categoriaId,
            nomeCategoria: categoria.nome,
            faturamento,
            custoInsumos
          });
        }

        if (categoriasCliente.length === 0) continue;

        const faturamentoTotal = categoriasCliente.reduce((sum, cat) => sum + cat.faturamento, 0);
        const custoInsumosTotal = categoriasCliente.reduce((sum, cat) => sum + cat.custoInsumos, 0);

        const impostoTotal = cliente.emiteNotaFiscal ? faturamentoTotal * ALIQUOTA_PROVISORIA : 0;
        const percentualLogistico = obterPercentualLogistico(cliente.tipoLogistica || 'Própria');
        const custoLogistico = faturamentoTotal * percentualLogistico;
        const lucroBruto = faturamentoTotal - custoInsumosTotal - impostoTotal - custoLogistico;

        projecoesCalculadas.push({
          clienteId: cliente.id,
          nomeCliente: cliente.nome,
          categorias: categoriasCliente,
          emiteNotaFiscal: cliente.emiteNotaFiscal || false,
          impostoTotal,
          custoLogistico,
          lucroBruto
        });
      }

      // Calcular indicadores agregados
      const faturamentoPorCategoria: Record<string, number> = {};
      const custoPorCategoria: Record<string, number> = {};
      let totalCustoInsumosSemanal = 0;
      let totalImpostoSemanal = 0;
      let totalLogisticaSemanal = 0;
      let somaLucros = 0;
      let faturamentoGeralSemanal = 0;

      projecoesCalculadas.forEach(projecao => {
        projecao.categorias.forEach(categoria => {
          const nomeCategoria = categoria.nomeCategoria;
          faturamentoPorCategoria[nomeCategoria] = (faturamentoPorCategoria[nomeCategoria] || 0) + categoria.faturamento;
          custoPorCategoria[nomeCategoria] = (custoPorCategoria[nomeCategoria] || 0) + categoria.custoInsumos;
          totalCustoInsumosSemanal += categoria.custoInsumos;
          faturamentoGeralSemanal += categoria.faturamento;
        });

        totalImpostoSemanal += projecao.impostoTotal;
        totalLogisticaSemanal += projecao.custoLogistico;
        somaLucros += projecao.lucroBruto;
      });

      // Converter valores semanais para mensais
      const faturamentoGeralMensal = faturamentoGeralSemanal * 4;
      const totalGeralMensal = somaLucros * 4;
      const totalCustoInsumosMensal = totalCustoInsumosSemanal * 4;
      const totalImpostoMensal = totalImpostoSemanal * 4;
      const totalLogisticaMensal = totalLogisticaSemanal * 4;

      const faturamentoPorCategoriaMensal: Record<string, number> = {};
      const custoPorCategoriaMensal: Record<string, number> = {};

      Object.keys(faturamentoPorCategoria).forEach(categoria => {
        faturamentoPorCategoriaMensal[categoria] = faturamentoPorCategoria[categoria] * 4;
        custoPorCategoriaMensal[categoria] = custoPorCategoria[categoria] * 4;
      });

      // Extrair valores específicos por categoria
      const faturamentoRevendaPadrao = faturamentoPorCategoriaMensal['Revenda Padrão'] || 0;
      const faturamentoFoodService = faturamentoPorCategoriaMensal['Food Service'] || 0;
      const custoInsumosRevendaPadrao = custoPorCategoriaMensal['Revenda Padrão'] || 0;
      const custoInsumosFoodService = custoPorCategoriaMensal['Food Service'] || 0;

      setIndicadores({
        faturamentoGeralMensal,
        totalGeralMensal,
        faturamentoPorCategoria: faturamentoPorCategoriaMensal,
        custoPorCategoria: custoPorCategoriaMensal,
        totalCustoInsumosMensal,
        totalImpostoMensal,
        totalLogisticaMensal,
        faturamentoRevendaPadrao,
        faturamentoFoodService,
        custoInsumosRevendaPadrao,
        custoInsumosFoodService,
        custoLogistico: totalLogisticaMensal,
        impostos: totalImpostoMensal
      });

    } catch (err) {
      console.error('Erro ao calcular indicadores:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientes.length > 0 && categorias.length > 0 && tiposLogistica.length > 0) {
      calcularIndicadores();
    }
  }, [clientes, categorias, tiposLogistica]);

  return {
    indicadores,
    isLoading,
    error,
    recalculate: calcularIndicadores
  };
};
