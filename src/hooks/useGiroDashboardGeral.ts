import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoSemana {
  semana: string;
  giroReal: number;
  giroAgendado?: number;
  isProjecao?: boolean;
}

interface DadosDashboard {
  historicoSemanas: HistoricoSemana[];
  ultimas4Semanas: number;
  mediaUltimas4: number;
  mediaGeral: number;
  variacao: number;
  tendencia: 'crescimento' | 'queda' | 'estavel';
  tendencia12Semanas: {
    tipo: 'crescimento' | 'queda' | 'estavel';
    percentual: number;
  };
  picoSemanal: number;
  valeSemanal: number;
  amplitudeVariacao: number;
  giroRealAtual: number;
  giroAgendadoAtual: number;
  giroProjetado: number;
  performanceVsMedia: number;
  percentualSemanaPassado: number;
  diasRestantes: number;
}

export const useGiroDashboardGeral = () => {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calcular últimas 12 semanas
        const hoje = new Date();
        const semanas = Array.from({ length: 12 }, (_, i) => {
          const inicio = startOfWeek(subWeeks(hoje, 11 - i), { locale: ptBR });
          const fim = endOfWeek(inicio, { locale: ptBR });
          return {
            inicio,
            fim,
            chave: format(inicio, 'yyyy-MM-dd')
          };
        });

        // Buscar dados consolidados de histórico (agregando duplicatas)
        const { data: historicoData, error: historicoError } = await supabase
          .from('historico_giro_semanal_consolidado')
          .select('semana, giro_semanal')
          .gte('semana', semanas[0].chave)
          .lte('semana', semanas[semanas.length - 1].chave);

        if (historicoError) throw historicoError;

        // Agregar dados por semana (corrigir duplicatas)
        const girosPorSemana = new Map<string, number>();
        historicoData?.forEach(h => {
          const atual = girosPorSemana.get(h.semana) || 0;
          girosPorSemana.set(h.semana, atual + (h.giro_semanal || 0));
        });

        // Buscar agendamentos da semana atual apenas
        const semanaAtual = semanas[semanas.length - 1];
        const { data: agendamentosData, error: agendamentosError } = await supabase
          .from('agendamentos_clientes')
          .select('quantidade_total, status_agendamento, data_proxima_reposicao')
          .in('status_agendamento', ['Previsto', 'Agendado'])
          .gte('data_proxima_reposicao', format(semanaAtual.inicio, 'yyyy-MM-dd'))
          .lte('data_proxima_reposicao', format(semanaAtual.fim, 'yyyy-MM-dd'));

        if (agendamentosError) throw agendamentosError;

        // Calcular giro agendado da semana atual
        const giroAgendadoAtual = agendamentosData?.reduce(
          (sum, ag) => sum + (ag.quantidade_total || 0),
          0
        ) || 0;

        // Processar dados históricos
        const historicoSemanas: HistoricoSemana[] = semanas.map((sem, index) => {
          const giroSemana = girosPorSemana.get(sem.chave) || 0;
          const isUltimaSemana = index === semanas.length - 1;

          return {
            semana: format(sem.inicio, 'dd/MM', { locale: ptBR }),
            giroReal: giroSemana,
            giroAgendado: isUltimaSemana && giroAgendadoAtual > 0 ? giroAgendadoAtual : undefined,
            isProjecao: isUltimaSemana && giroAgendadoAtual > 0
          };
        });

        // Calcular média geral (excluindo semana atual)
        const girosCompletos = historicoSemanas
          .slice(0, -1)
          .map(s => s.giroReal)
          .filter(g => g > 0);

        const mediaGeral = girosCompletos.length > 0
          ? girosCompletos.reduce((sum, val) => sum + val, 0) / girosCompletos.length
          : 0;

        // Calcular total e média das últimas 4 semanas (apenas dados reais)
        const ultimas4 = historicoSemanas.slice(-4).map(s => s.giroReal);
        const ultimas4Semanas = ultimas4.reduce((sum, val) => sum + val, 0);
        const mediaUltimas4 = ultimas4Semanas / 4;

        // Calcular variação real vs real (semana atual vs média 3 anteriores)
        const ultimas3Semanas = ultimas4.slice(0, 3);
        const media3Anteriores = ultimas3Semanas.reduce((a, b) => a + b, 0) / 3;
        const giroRealAtual = ultimas4[3];
        const variacao = media3Anteriores > 0
          ? ((giroRealAtual - media3Anteriores) / media3Anteriores) * 100
          : 0;

        // Determinar tendência básica
        let tendencia: 'crescimento' | 'queda' | 'estavel' = 'estavel';
        if (Math.abs(variacao) >= 5) {
          tendencia = variacao > 0 ? 'crescimento' : 'queda';
        }

        // Calcular tendência de 12 semanas (regressão linear simples)
        const giros12Semanas = historicoSemanas
          .slice(0, -1) // Excluir semana atual
          .map(s => s.giroReal)
          .filter(g => g > 0);

        const n = giros12Semanas.length;
        const sumX = n * (n - 1) / 2;
        const sumY = giros12Semanas.reduce((a, b) => a + b, 0);
        const sumXY = giros12Semanas.reduce((acc, y, x) => acc + x * y, 0);
        const sumX2 = n * (n - 1) * (2 * n - 1) / 6;

        const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
        const percentualTendencia = sumY > 0 ? (slope / (sumY / n)) * 100 : 0;

        const tendencia12Semanas = {
          tipo: Math.abs(percentualTendencia) < 2 ? 'estavel' as const :
            (percentualTendencia > 0 ? 'crescimento' as const : 'queda' as const),
          percentual: percentualTendencia
        };

        // Calcular pico e vale das últimas 12 semanas
        const picoSemanal = giros12Semanas.length > 0 ? Math.max(...giros12Semanas) : 0;
        const valeSemanal = giros12Semanas.length > 0 ? Math.min(...giros12Semanas) : 0;
        const amplitudeVariacao = picoSemanal - valeSemanal;

        // Calcular projeção da semana atual
        const giroProjetado = giroRealAtual + giroAgendadoAtual;
        const performanceVsMedia = mediaGeral > 0
          ? ((giroProjetado / mediaGeral) - 1) * 100
          : 0;

        // Calcular percentual da semana que já passou
        const diasDesdeInicio = Math.floor(
          (hoje.getTime() - semanaAtual.inicio.getTime()) / (1000 * 60 * 60 * 24)
        );
        const percentualSemanaPassado = Math.min((diasDesdeInicio / 7) * 100, 100);
        const diasRestantes = Math.max(7 - diasDesdeInicio, 0);

        setDados({
          historicoSemanas,
          ultimas4Semanas,
          mediaUltimas4,
          mediaGeral,
          variacao,
          tendencia,
          tendencia12Semanas,
          picoSemanal,
          valeSemanal,
          amplitudeVariacao,
          giroRealAtual,
          giroAgendadoAtual,
          giroProjetado,
          performanceVsMedia,
          percentualSemanaPassado,
          diasRestantes
        });
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard de giro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  return { dados, loading, error };
};
