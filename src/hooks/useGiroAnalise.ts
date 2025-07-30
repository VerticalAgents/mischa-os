import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnaliseGiroData } from '@/types/giro';
import { Cliente } from '@/types';
import { useFaturamentoMedioPDV } from './useFaturamentoMedioPDV';

interface EntregaDetalhada {
  data: string;
  quantidade: number;
}

interface GiroSemanalDetalhado {
  semana: string;
  ano: number;
  numeroSemana: number;
  totalEntregues: number;
  entregas: EntregaDetalhada[];
}

// Função para obter o número da semana ISO
function getISOWeekNumber(date: Date): { year: number; week: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { year: target.getFullYear(), week: weekNumber };
}

// Função para formatar semana para exibição
function formatarSemanaDisplay(ano: number, semana: number): string {
  return `Sem ${semana.toString().padStart(2, '0')}`;
}

// Função para gerar array de 12 semanas
function gerarUltimas12Semanas(): Array<{ ano: number; semana: number; chave: string; display: string }> {
  const semanas: Array<{ ano: number; semana: number; chave: string; display: string }> = [];
  const hoje = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const data = new Date();
    data.setDate(hoje.getDate() - (i * 7));
    const { year, week } = getISOWeekNumber(data);
    const chave = `${year}-${week.toString().padStart(2, '0')}`;
    const display = formatarSemanaDisplay(year, week);
    
    semanas.push({
      ano: year,
      semana: week,
      chave,
      display
    });
  }
  
  return semanas;
}

export function useGiroAnalise(cliente: Cliente) {
  const [dadosGiro, setDadosGiro] = useState<AnaliseGiroData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { faturamentoMedioRevenda } = useFaturamentoMedioPDV();

  // Calcular giro médio geral baseado no faturamento médio
  const giroMedioGeral = faturamentoMedioRevenda > 0 ? Math.round(faturamentoMedioRevenda / 150) : 150;

  useEffect(() => {
    async function carregarDadosGiro() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Carregando dados de giro para cliente:', cliente.id);

        // Calcular data de 84 dias atrás (12 semanas)
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 84);

        // Buscar histórico de entregas dos últimos 84 dias com detalhes
        const { data: historico, error: historicoError } = await supabase
          .from('historico_entregas')
          .select('data, quantidade, tipo, created_at')
          .eq('cliente_id', cliente.id)
          .eq('tipo', 'entrega')
          .gte('created_at', dataLimite.toISOString())
          .order('data', { ascending: true });

        if (historicoError) {
          console.error('Erro ao carregar histórico:', historicoError);
          throw historicoError;
        }

        console.log('📊 Histórico carregado:', historico?.length || 0, 'entregas');

        // Processar dados por semana com detalhes das entregas
        const giroSemanal = new Map<string, GiroSemanalDetalhado>();
        
        // Inicializar todas as 12 semanas
        const ultimas12Semanas = gerarUltimas12Semanas();
        ultimas12Semanas.forEach(semana => {
          giroSemanal.set(semana.chave, {
            semana: semana.display,
            ano: semana.ano,
            numeroSemana: semana.semana,
            totalEntregues: 0,
            entregas: []
          });
        });

        // Agrupar entregas por semana
        historico?.forEach(entrega => {
          const dataEntrega = new Date(entrega.data);
          const { year, week } = getISOWeekNumber(dataEntrega);
          const chave = `${year}-${week.toString().padStart(2, '0')}`;
          
          if (giroSemanal.has(chave)) {
            const semanaData = giroSemanal.get(chave)!;
            semanaData.totalEntregues += entrega.quantidade;
            semanaData.entregas.push({
              data: entrega.data,
              quantidade: entrega.quantidade
            });
          }
        });

        // Preparar dados do gráfico
        const dadosGrafico = ultimas12Semanas.map(semana => {
          const dadosSemana = giroSemanal.get(semana.chave)!;
          return {
            semana: semana.display,
            valor: dadosSemana.totalEntregues,
            entregas: dadosSemana.entregas,
            mediaGeral: giroMedioGeral
          };
        });

        console.log('📈 Dados do gráfico preparados:', dadosGrafico);

        // Calcular métricas
        const valoresSemanas = Array.from(giroSemanal.values()).map(s => s.totalEntregues);
        const ultimasSemanas = valoresSemanas.slice(-4); // Últimas 4 semanas
        const ultimaSemana = valoresSemanas[valoresSemanas.length - 1] || 0;
        
        // Média histórica das últimas 4 semanas
        const mediaHistorica = ultimasSemanas.length > 0 
          ? Math.round(ultimasSemanas.reduce((acc, val) => acc + val, 0) / ultimasSemanas.length)
          : 0;

        // Variação percentual
        const variacaoPercentual = mediaHistorica > 0 
          ? Math.round(((ultimaSemana - mediaHistorica) / mediaHistorica) * 100)
          : 0;

        // Meta (usar meta do cliente ou 10% acima da média histórica)
        const meta = cliente.metaGiroSemanal && cliente.metaGiroSemanal > 0 
          ? cliente.metaGiroSemanal 
          : Math.round(mediaHistorica * 1.1);

        // Achievement
        const achievement = meta > 0 ? Math.round((ultimaSemana / meta) * 100) : 0;

        // Semáforo
        let semaforo: 'vermelho' | 'amarelo' | 'verde' = 'vermelho';
        if (achievement >= 95) {
          semaforo = 'verde';
        } else if (achievement >= 80) {
          semaforo = 'amarelo';
        }

        const resultado: AnaliseGiroData = {
          mediaHistorica,
          ultimaSemana,
          variacaoPercentual,
          meta,
          achievement,
          historico: dadosGrafico,
          semaforo,
          giroMedioGeral
        };

        console.log('✅ Análise de giro calculada:', resultado);
        setDadosGiro(resultado);

      } catch (err) {
        console.error('❌ Erro ao calcular giro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }

    carregarDadosGiro();
  }, [cliente.id, cliente.metaGiroSemanal, giroMedioGeral]);

  const atualizarMeta = (novaMeta: number) => {
    if (dadosGiro) {
      const novoAchievement = Math.round((dadosGiro.ultimaSemana / novaMeta) * 100);
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
