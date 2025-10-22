import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GiroSemanalData {
  semana: string;
  ano: number;
  numeroSemana: number;
  giroReal: number;
  giroAgendado?: number;
  mediaHistorica: number;
}

interface GiroDashboardData {
  historicoSemanas: GiroSemanalData[];
  ultimas4Semanas: {
    total: number;
    media: number;
    variacao: number;
    tendencia: 'crescimento' | 'queda' | 'estavel';
  };
  mediaGeral: number;
}

export function useGiroDashboardGeral() {
  const [data, setData] = useState<GiroDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calcular as últimas 12 semanas
      const hoje = new Date();
      const semanas: Array<{ inicio: Date; fim: Date; chave: string }> = [];
      
      for (let i = 11; i >= 0; i--) {
        const dataReferencia = subWeeks(hoje, i);
        const inicio = startOfWeek(dataReferencia, { weekStartsOn: 1 });
        const fim = endOfWeek(dataReferencia, { weekStartsOn: 1 });
        const chave = format(inicio, 'yyyy-MM-dd');
        semanas.push({ inicio, fim, chave });
      }

      // Buscar histórico consolidado das últimas 12 semanas
      const { data: historicoData, error: historicoError } = await supabase
        .from('historico_giro_semanal_consolidado')
        .select('semana, giro_semanal')
        .gte('semana', format(semanas[0].inicio, 'yyyy-MM-dd'))
        .lte('semana', format(semanas[semanas.length - 1].inicio, 'yyyy-MM-dd'))
        .order('semana', { ascending: true });

      if (historicoError) throw historicoError;

      // Buscar agendamentos da semana atual
      const semanaAtual = semanas[semanas.length - 1];
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos_clientes')
        .select('quantidade_total, status_agendamento')
        .in('status_agendamento', ['Previsto', 'Agendado']);

      if (agendamentosError) throw agendamentosError;

      // Calcular giro agendado da semana atual
      const giroAgendadoAtual = agendamentosData?.reduce(
        (sum, ag) => sum + (ag.quantidade_total || 0),
        0
      ) || 0;

      // Mapear dados do histórico
      const historicoMap = new Map(
        historicoData?.map(h => [h.semana, h.giro_semanal]) || []
      );

      // Calcular média histórica (excluindo semana atual)
      const girosAnteriores = Array.from(historicoMap.values());
      const mediaGeral = girosAnteriores.length > 0
        ? girosAnteriores.reduce((sum, val) => sum + val, 0) / girosAnteriores.length
        : 0;

      // Construir dados das semanas
      const historicoSemanas: GiroSemanalData[] = semanas.map((sem, index) => {
        const giroReal = historicoMap.get(sem.chave) || 0;
        const isUltimaSemana = index === semanas.length - 1;
        
        return {
          semana: format(sem.inicio, "'Sem' w", { locale: ptBR }),
          ano: sem.inicio.getFullYear(),
          numeroSemana: parseInt(format(sem.inicio, 'w')),
          giroReal,
          giroAgendado: isUltimaSemana ? giroAgendadoAtual : undefined,
          mediaHistorica: mediaGeral,
        };
      });

      // Calcular estatísticas das últimas 4 semanas
      const ultimas4 = historicoSemanas.slice(-4);
      const totalUltimas4 = ultimas4.reduce(
        (sum, s) => sum + s.giroReal + (s.giroAgendado || 0),
        0
      );
      const mediaUltimas4 = totalUltimas4 / 4;
      
      // Calcular variação (3 semanas anteriores vs atual + agendada)
      const total3Anteriores = ultimas4.slice(0, 3).reduce((sum, s) => sum + s.giroReal, 0);
      const media3Anteriores = total3Anteriores / 3;
      const semanaAtualTotal = ultimas4[3].giroReal + (ultimas4[3].giroAgendado || 0);
      const variacao = media3Anteriores > 0
        ? ((semanaAtualTotal - media3Anteriores) / media3Anteriores) * 100
        : 0;

      // Determinar tendência
      let tendencia: 'crescimento' | 'queda' | 'estavel' = 'estavel';
      if (Math.abs(variacao) > 5) {
        tendencia = variacao > 0 ? 'crescimento' : 'queda';
      }

      setData({
        historicoSemanas,
        ultimas4Semanas: {
          total: totalUltimas4,
          media: mediaUltimas4,
          variacao,
          tendencia,
        },
        mediaGeral,
      });
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard geral:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refresh: carregarDados };
}
