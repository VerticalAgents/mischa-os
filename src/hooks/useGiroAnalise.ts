
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnaliseGiroData } from '@/types/giro';
import { Cliente } from '@/types';
import { 
  calcularGiroSemanalHistorico,
  getISOWeekNumber,
  formatarSemanaDisplay,
  gerarUltimas12Semanas
} from '@/utils/giroCalculations';

interface EntregaHistorico {
  data: string;
  quantidade: number;
  tipo: 'entrega' | 'retorno';
}

interface GiroSemanal {
  semana: string;
  ano: number;
  numeroSemana: number;
  totalEntregues: number;
}

export function useGiroAnalise(cliente: Cliente) {
  const [dadosGiro, setDadosGiro] = useState<AnaliseGiroData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDadosGiro() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Carregando dados de giro para cliente:', cliente.id);

        // **MUDANÇA PRINCIPAL: Usar função centralizada para calcular média histórica**
        const { giroSemanal: mediaHistorica, numeroSemanas: numeroSemanasHistorico } = await calcularGiroSemanalHistorico(cliente.id);
        console.log('📊 Média histórica calculada (função centralizada):', mediaHistorica, 'em', numeroSemanasHistorico, 'semanas');

        // Buscar histórico de entregas dos últimos 84 dias para o gráfico (12 semanas)
        const dataLimiteGrafico = new Date();
        dataLimiteGrafico.setDate(dataLimiteGrafico.getDate() - 84);

        const { data: historicoGrafico, error: historicoError } = await supabase
          .from('historico_entregas')
          .select('data, quantidade, tipo')
          .eq('cliente_id', cliente.id)
          .eq('tipo', 'entrega')
          .gte('data', dataLimiteGrafico.toISOString()) // Usar 'data' em vez de 'created_at'
          .order('data', { ascending: true });

        if (historicoError) {
          console.error('Erro ao carregar histórico para gráfico:', historicoError);
          throw historicoError;
        }

        console.log('📈 Histórico para gráfico carregado:', historicoGrafico?.length || 0, 'entregas');

        // Processar dados por semana para o gráfico
        const giroSemanal = new Map<string, number>();
        
        // Inicializar todas as 12 semanas com 0
        const ultimas12Semanas = gerarUltimas12Semanas();
        ultimas12Semanas.forEach(semana => {
          giroSemanal.set(semana.chave, 0);
        });

        // Agrupar entregas por semana para o gráfico
        historicoGrafico?.forEach(entrega => {
          const dataEntrega = new Date(entrega.data);
          const { year, week } = getISOWeekNumber(dataEntrega);
          const chave = `${year}-${week.toString().padStart(2, '0')}`;
          
          if (giroSemanal.has(chave)) {
            const valorAtual = giroSemanal.get(chave) || 0;
            giroSemanal.set(chave, valorAtual + entrega.quantidade);
          }
        });

        // Preparar dados do gráfico com datas do período
        const dadosGrafico = ultimas12Semanas.map(semana => ({
          semana: semana.display,
          valor: giroSemanal.get(semana.chave) || 0,
          startDate: semana.startDate.toISOString(),
          endDate: semana.endDate.toISOString()
        }));

        console.log('📈 Dados do gráfico preparados:', dadosGrafico);

        // Calcular última semana (usar os dados do gráfico)
        const valoresSemanas = Array.from(giroSemanal.values());
        const ultimaSemana = valoresSemanas[valoresSemanas.length - 1] || 0;

        // Variação percentual (comparar última semana com média histórica)
        const variacaoPercentual = mediaHistorica > 0 
          ? Math.round(((ultimaSemana - mediaHistorica) / mediaHistorica) * 100)
          : 0;

        // Meta (usar meta do cliente ou 10% acima da média histórica)
        const meta = cliente.metaGiroSemanal && cliente.metaGiroSemanal > 0 
          ? cliente.metaGiroSemanal 
          : Math.round(mediaHistorica * 1.1);

        // Achievement
        const achievement = meta > 0 ? Math.round((mediaHistorica / meta) * 100) : 0;

        // Semáforo baseado no achievement
        let semaforo: 'vermelho' | 'amarelo' | 'verde' = 'vermelho';
        if (achievement >= 95) {
          semaforo = 'verde';
        } else if (achievement >= 80) {
          semaforo = 'amarelo';
        }

        const resultado: AnaliseGiroData = {
          mediaHistorica, // Usar o valor calculado pela função centralizada
          numeroSemanasHistorico,
          ultimaSemana,
          variacaoPercentual,
          meta,
          achievement,
          historico: dadosGrafico,
          semaforo
        };

        console.log('✅ Análise de giro calculada (unificada):', resultado);
        setDadosGiro(resultado);

      } catch (err) {
        console.error('❌ Erro ao calcular giro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }

    carregarDadosGiro();
  }, [cliente.id, cliente.metaGiroSemanal]);

  const atualizarMeta = (novaMeta: number) => {
    if (dadosGiro) {
      const novoAchievement = Math.round((dadosGiro.mediaHistorica / novaMeta) * 100);
      let novoSemaforo: 'vermelho' | 'amarelo' | 'verde' = 'vermelho';
      
      if (novoAchievement >= 95) {
        novoSemaforo = 'verde';
      } else if (novoAchievement >= 80) {
        novoSemaforo = 'amarelo';
      }

      setDadosGiro({
        ...dadosGiro,
        meta: novaMeta,
        achievement: novoAchievement,
        semaforo: novoSemaforo
      });
    }
  };

  return {
    dadosGiro,
    isLoading,
    error,
    atualizarMeta
  };
}
