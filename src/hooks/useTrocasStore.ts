import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrocaItem {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome: string;
}

export interface TrocaRegistro {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  historico_entrega_id?: string;
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome: string;
  data_troca: string;
}

export interface TrocasEstatisticas {
  totalTrocas: number;
  trocasMes: number;
  trocasMesAnterior: number;
  porMotivo: { motivo: string; quantidade: number; percentual: number }[];
  evolucaoMensal: { mes: string; quantidade: number }[];
}

export function useTrocasStore() {
  const [trocas, setTrocas] = useState<TrocaRegistro[]>([]);
  const [estatisticas, setEstatisticas] = useState<TrocasEstatisticas | null>(null);
  const [loading, setLoading] = useState(false);

  const carregarTrocas = useCallback(async (limite = 100) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trocas')
        .select(`
          *,
          clientes!inner(nome)
        `)
        .order('data_troca', { ascending: false })
        .limit(limite);

      if (error) throw error;
      
      const trocasFormatadas = (data || []).map((t: any) => ({
        ...t,
        cliente_nome: t.clientes?.nome
      }));
      
      setTrocas(trocasFormatadas);
      return trocasFormatadas;
    } catch (error) {
      console.error('Erro ao carregar trocas:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarEstatisticas = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar todas as trocas
      const { data: todasTrocas, error } = await supabase
        .from('trocas')
        .select('*')
        .order('data_troca', { ascending: false });

      if (error) throw error;
      
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);

      const trocasMes = (todasTrocas || []).filter(t => 
        new Date(t.data_troca) >= inicioMes
      ).reduce((sum, t) => sum + t.quantidade, 0);

      const trocasMesAnterior = (todasTrocas || []).filter(t => {
        const data = new Date(t.data_troca);
        return data >= inicioMesAnterior && data <= fimMesAnterior;
      }).reduce((sum, t) => sum + t.quantidade, 0);

      const totalTrocas = (todasTrocas || []).reduce((sum, t) => sum + t.quantidade, 0);

      // Agrupar por motivo
      const motivosMap = new Map<string, number>();
      (todasTrocas || []).forEach(t => {
        const atual = motivosMap.get(t.motivo_nome) || 0;
        motivosMap.set(t.motivo_nome, atual + t.quantidade);
      });

      const porMotivo = Array.from(motivosMap.entries())
        .map(([motivo, quantidade]) => ({
          motivo,
          quantidade,
          percentual: totalTrocas > 0 ? Math.round((quantidade / totalTrocas) * 100) : 0
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

      // Evolução mensal (últimos 6 meses)
      const evolucaoMensal: { mes: string; quantidade: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const mes = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 0);
        
        const qtdMes = (todasTrocas || []).filter(t => {
          const data = new Date(t.data_troca);
          return data >= mes && data <= fimMes;
        }).reduce((sum, t) => sum + t.quantidade, 0);

        evolucaoMensal.push({
          mes: mes.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          quantidade: qtdMes
        });
      }

      setEstatisticas({
        totalTrocas,
        trocasMes,
        trocasMesAnterior,
        porMotivo,
        evolucaoMensal
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    trocas,
    estatisticas,
    loading,
    carregarTrocas,
    carregarEstatisticas
  };
}
