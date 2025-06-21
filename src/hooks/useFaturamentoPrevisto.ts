
import { useState, useEffect } from 'react';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseCategoriasProduto } from '@/hooks/useSupabaseCategoriasProduto';

// Preços temporários por categoria (mesma lógica da projeção por PDV)
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

  const { clientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();

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

  const calcularFaturamento = () => {
    setIsLoading(true);
    
    try {
      // Filtrar apenas clientes ativos
      const clientesAtivos = clientes.filter(cliente => cliente.statusCliente === 'Ativo');
      
      if (clientesAtivos.length === 0 || categorias.length === 0) {
        setDisponivel(false);
        setFaturamentoSemanal(0);
        setFaturamentoMensal(0);
        setIsLoading(false);
        return;
      }

      let totalFaturamentoSemanal = 0;

      clientesAtivos.forEach(cliente => {
        // Verificar se cliente tem categorias habilitadas
        if (!cliente.categoriasHabilitadas || cliente.categoriasHabilitadas.length === 0) {
          return;
        }

        cliente.categoriasHabilitadas.forEach(categoriaId => {
          const categoria = categorias.find(cat => cat.id === categoriaId);
          if (!categoria) return;

          const giroSemanal = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
          const precoAplicado = obterPrecoCategoria(categoria.nome);
          const faturamento = giroSemanal * precoAplicado;
          
          totalFaturamentoSemanal += faturamento;
        });
      });

      const totalFaturamentoMensal = totalFaturamentoSemanal * 4;

      setFaturamentoSemanal(totalFaturamentoSemanal);
      setFaturamentoMensal(totalFaturamentoMensal);
      setDisponivel(totalFaturamentoSemanal > 0);
    } catch (error) {
      console.error('Erro ao calcular faturamento previsto:', error);
      setDisponivel(false);
      setFaturamentoSemanal(0);
      setFaturamentoMensal(0);
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
    recalcular: calcularFaturamento,
  };
}
