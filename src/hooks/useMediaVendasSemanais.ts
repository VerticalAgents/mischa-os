import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

interface MediaVendasProduto {
  produto_id: string;
  produto_nome: string;
  media_semanal: number;
  total_vendido: number;
  semanas_com_vendas: number;
}

interface MediaVendasMap {
  [produto_id: string]: number;
}

export const useMediaVendasSemanais = () => {
  const [mediaVendasPorProduto, setMediaVendasPorProduto] = useState<MediaVendasMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarMediaVendas();
  }, []);

  const carregarMediaVendas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calcular data de 84 dias atrás (12 semanas)
      const dataInicio = subDays(new Date(), 84);

      console.log('📊 [MediaVendas] Carregando histórico de entregas dos últimos 84 dias...');

      // Buscar entregas dos últimos 84 dias
      const { data: entregas, error: errorEntregas } = await supabase
        .from('historico_entregas')
        .select('itens, data')
        .eq('tipo', 'entrega')
        .gte('data', dataInicio.toISOString())
        .order('data', { ascending: false });

      if (errorEntregas) {
        console.error('❌ [MediaVendas] Erro ao buscar entregas:', errorEntregas);
        throw errorEntregas;
      }

      console.log('✅ [MediaVendas] Entregas carregadas:', entregas?.length || 0);

      // Processar itens para agregar por produto
      const produtosMap = new Map<string, { total: number; nome: string }>();

      if (entregas && entregas.length > 0) {
        entregas.forEach(entrega => {
          if (entrega.itens && Array.isArray(entrega.itens)) {
            entrega.itens.forEach((item: any) => {
              const produtoId = item.produto_id;
              const quantidade = Number(item.quantidade) || 0;
              const produtoNome = item.produto_nome || 'Produto sem nome';

              if (produtoId && quantidade > 0) {
                const atual = produtosMap.get(produtoId) || { total: 0, nome: produtoNome };
                produtosMap.set(produtoId, {
                  total: atual.total + quantidade,
                  nome: produtoNome
                });
              }
            });
          }
        });
      }

      // Calcular média dividindo por 12 semanas
      const mediaVendas: MediaVendasMap = {};
      
      produtosMap.forEach((valor, produtoId) => {
        const mediaSemanal = valor.total / 12; // Dividir por 12 semanas
        mediaVendas[produtoId] = Math.round(mediaSemanal); // Arredondar para inteiro
        
        console.log(`📊 [MediaVendas] ${valor.nome}: Total=${valor.total}, Média/semana=${mediaSemanal.toFixed(1)}`);
      });

      console.log('✅ [MediaVendas] Médias calculadas para', Object.keys(mediaVendas).length, 'produtos');
      
      setMediaVendasPorProduto(mediaVendas);
    } catch (err) {
      console.error('❌ [MediaVendas] Erro ao calcular média de vendas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return {
    mediaVendasPorProduto,
    loading,
    error,
    recarregar: carregarMediaVendas
  };
};
