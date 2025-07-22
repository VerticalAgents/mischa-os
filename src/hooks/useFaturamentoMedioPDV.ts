
import { useState, useEffect } from 'react';
import { useFaturamentoPrevisto } from './useFaturamentoPrevisto';
import { useClienteStore } from './useClienteStore';

export function useFaturamentoMedioPDV() {
  const { precosDetalhados } = useFaturamentoPrevisto();
  const { clientes } = useClienteStore();
  const [faturamentoMedioRevenda, setFaturamentoMedioRevenda] = useState(0);

  // Função para verificar se uma categoria é "Revenda Padrão"
  const isCategoriaRevenda = (categoriaNome: string): boolean => {
    const nome = categoriaNome.toLowerCase();
    return nome.includes('revenda') || nome.includes('padrão');
  };

  useEffect(() => {
    if (!precosDetalhados || precosDetalhados.length === 0) {
      setFaturamentoMedioRevenda(0);
      return;
    }

    // Filtrar apenas dados de clientes com categoria "Revenda Padrão"
    const dadosRevenda = precosDetalhados.filter(detalhe => 
      isCategoriaRevenda(detalhe.categoriaNome)
    );

    if (dadosRevenda.length === 0) {
      setFaturamentoMedioRevenda(0);
      return;
    }

    // Agrupar por cliente para evitar contar o mesmo cliente múltiplas vezes
    const faturamentoPorCliente = new Map<string, number>();
    
    dadosRevenda.forEach(detalhe => {
      const faturamentoAtual = faturamentoPorCliente.get(detalhe.clienteId) || 0;
      const faturamentoMensal = detalhe.faturamentoSemanal * 4;
      faturamentoPorCliente.set(detalhe.clienteId, faturamentoAtual + faturamentoMensal);
    });

    // Calcular média
    const totalFaturamento = Array.from(faturamentoPorCliente.values()).reduce((sum, valor) => sum + valor, 0);
    const numeroClientes = faturamentoPorCliente.size;
    const media = numeroClientes > 0 ? totalFaturamento / numeroClientes : 0;

    setFaturamentoMedioRevenda(media);
  }, [precosDetalhados]);

  return { faturamentoMedioRevenda };
}
