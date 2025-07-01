
import { useState, useEffect } from 'react';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseCategoriasProduto } from '@/hooks/useSupabaseCategoriasProduto';
import { useConfiguracoesStore } from '@/hooks/useConfiguracoesStore';
import { useSupabasePrecosCategoriaCliente } from '@/hooks/useSupabasePrecosCategoriaCliente';

// Preços temporários por categoria (fallback quando não há configuração)
const PRECOS_TEMPORARIOS: Record<string, number> = {
  'revenda padrão': 4.50,
  'food service': 70.00,
  'default': 5.00
};

export function useFaturamentoPrevisto() {
  const [faturamentoSemanal, setFaturamentoSemanal] = useState<number>(0);
  const [faturamentoMensal, setFaturamentoMensal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [disponivel, setDisponivel] = useState(false);
  const [precosDetalhados, setPrecosDetalhados] = useState<Array<{
    clienteId: string;
    clienteNome: string;
    categoriaId: number;
    categoriaNome: string;
    precoUnitario: number;
    precoPersonalizado: boolean;
    giroSemanal: number;
    faturamentoSemanal: number;
  }>>([]);

  const { clientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { obterConfiguracao } = useConfiguracoesStore();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();

  const obterPrecoCategoria = (nomeCategoria: string): number => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    for (const [key, preco] of Object.entries(PRECOS_TEMPORARIOS)) {
      if (nomeNormalizado.includes(key)) {
        return preco;
      }
    }
    return PRECOS_TEMPORARIOS.default;
  };

  const calcularGiroSemanal = (qtdPadrao: number, periodicidade: number): number => {
    if (periodicidade === 0) return 0;
    return Math.round((qtdPadrao / periodicidade) * 7);
  };

  const obterPrecoPorCliente = async (clienteId: string, categoriaId: number, categoriaNome: string): Promise<{ preco: number; personalizado: boolean }> => {
    try {
      // Carregar preços personalizados do cliente
      const precosPersonalizados = await carregarPrecosPorCliente(clienteId);
      const precoPersonalizado = precosPersonalizados.find(p => p.categoria_id === categoriaId);
      
      if (precoPersonalizado && precoPersonalizado.preco_unitario > 0) {
        return {
          preco: precoPersonalizado.preco_unitario,
          personalizado: true
        };
      }
      
      // Usar preço padrão da configuração
      const configPrecificacao = obterConfiguracao('precificacao');
      const precosPadrao = configPrecificacao?.precosPorCategoria || {};
      const precoPadrao = precosPadrao[categoriaId.toString()];
      
      if (precoPadrao && precoPadrao > 0) {
        return {
          preco: precoPadrao,
          personalizado: false
        };
      }
      
      // Fallback para preços temporários
      return {
        preco: obterPrecoCategoria(categoriaNome),
        personalizado: false
      };
    } catch (error) {
      console.error(`Erro ao carregar preço para cliente ${clienteId}, categoria ${categoriaId}:`, error);
      // Fallback em caso de erro
      const configPrecificacao = obterConfiguracao('precificacao');
      const precosPadrao = configPrecificacao?.precosPorCategoria || {};
      const precoPadrao = precosPadrao[categoriaId.toString()];
      
      return {
        preco: precoPadrao || obterPrecoCategoria(categoriaNome),
        personalizado: false
      };
    }
  };

  const calcularFaturamento = async () => {
    setIsLoading(true);
    
    try {
      // Filtrar apenas clientes ativos
      const clientesAtivos = clientes.filter(cliente => cliente.statusCliente === 'Ativo');
      
      if (clientesAtivos.length === 0 || categorias.length === 0) {
        setDisponivel(false);
        setFaturamentoSemanal(0);
        setFaturamentoMensal(0);
        setPrecosDetalhados([]);
        setIsLoading(false);
        return;
      }

      let totalFaturamentoSemanal = 0;
      const detalhes: typeof precosDetalhados = [];

      // Processar cada cliente
      for (const cliente of clientesAtivos) {
        // Verificar se cliente tem categorias habilitadas
        if (!cliente.categoriasHabilitadas || cliente.categoriasHabilitadas.length === 0) {
          continue;
        }

        // Processar cada categoria habilitada do cliente
        for (const categoriaId of cliente.categoriasHabilitadas) {
          const categoria = categorias.find(cat => cat.id === categoriaId);
          if (!categoria) continue;

          const giroSemanal = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
          
          // Obter preço específico para este cliente e categoria
          const { preco: precoAplicado, personalizado } = await obterPrecoPorCliente(
            cliente.id, 
            categoriaId, 
            categoria.nome
          );
          
          const faturamentoSemanal = giroSemanal * precoAplicado;
          
          totalFaturamentoSemanal += faturamentoSemanal;
          
          // Adicionar aos detalhes
          detalhes.push({
            clienteId: cliente.id,
            clienteNome: cliente.nome,
            categoriaId,
            categoriaNome: categoria.nome,
            precoUnitario: precoAplicado,
            precoPersonalizado: personalizado,
            giroSemanal,
            faturamentoSemanal
          });
        }
      }

      const totalFaturamentoMensal = totalFaturamentoSemanal * 4;

      setFaturamentoSemanal(totalFaturamentoSemanal);
      setFaturamentoMensal(totalFaturamentoMensal);
      setPrecosDetalhados(detalhes);
      setDisponivel(totalFaturamentoSemanal > 0);
      
      console.log('💰 Faturamento calculado com preços personalizados:', {
        totalSemanal: totalFaturamentoSemanal,
        totalMensal: totalFaturamentoMensal,
        detalhes: detalhes.length
      });
      
    } catch (error) {
      console.error('Erro ao calcular faturamento previsto:', error);
      setDisponivel(false);
      setFaturamentoSemanal(0);
      setFaturamentoMensal(0);
      setPrecosDetalhados([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientes.length > 0 && categorias.length > 0) {
      calcularFaturamento();
    }
  }, [clientes, categorias]);

  return {
    faturamentoSemanal,
    faturamentoMensal,
    isLoading,
    disponivel,
    precosDetalhados,
    recalcular: calcularFaturamento,
  };
}
