
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnaliseGiroData } from '@/types/giro';
import { Cliente } from '@/types';

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
  entregas: EntregaHistorico[];
  dataInicial: string;
  dataFinal: string;
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

// Nova função para calcular data inicial e final da semana
function calcularPeriodoSemana(ano: number, numeroSemana: number): { dataInicial: string; dataFinal: string } {
  // Encontrar a primeira quinta-feira do ano (semana 1 ISO)
  const jan4 = new Date(ano, 0, 4);
  const diasParaPrimeiraQuinta = ((4 - jan4.getDay()) + 7) % 7;
  const primeiraQuinta = new Date(jan4);
  primeiraQuinta.setDate(jan4.getDate() + diasParaPrimeiraQuinta);
  
  // Calcular a segunda-feira da semana 1
  const primeiraSegunda = new Date(primeiraQuinta);
  primeiraSegunda.setDate(primeiraQuinta.getDate() - 3);
  
  // Calcular a data da semana desejada
  const dataInicial = new Date(primeiraSegunda);
  dataInicial.setDate(primeiraSegunda.getDate() + (numeroSemana - 1) * 7);
  
  const dataFinal = new Date(dataInicial);
  dataFinal.setDate(dataInicial.getDate() + 6);
  
  return {
    dataInicial: dataInicial.toLocaleDateString('pt-BR'),
    dataFinal: dataFinal.toLocaleDateString('pt-BR')
  };
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

        // Calcular data de 84 dias atrás (12 semanas)
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 84);

        // Buscar histórico de entregas dos últimos 84 dias
        const { data: historico, error: historicoError } = await supabase
          .from('historico_entregas')
          .select('data, quantidade, tipo')
          .eq('cliente_id', cliente.id)
          .eq('tipo', 'entrega') // Apenas entregas, não retornos
          .gte('created_at', dataLimite.toISOString())
          .order('data', { ascending: true });

        if (historicoError) {
          console.error('Erro ao carregar histórico:', historicoError);
          throw historicoError;
        }

        console.log('📊 Histórico carregado:', historico?.length || 0, 'entregas');

        // Processar dados por semana
        const giroSemanal = new Map<string, { total: number; entregas: EntregaHistorico[] }>();
        
        // Inicializar todas as 12 semanas com 0
        const ultimas12Semanas = gerarUltimas12Semanas();
        ultimas12Semanas.forEach(semana => {
          giroSemanal.set(semana.chave, { total: 0, entregas: [] });
        });

        // Agrupar entregas por semana
        historico?.forEach(entrega => {
          const dataEntrega = new Date(entrega.data);
          const { year, week } = getISOWeekNumber(dataEntrega);
          const chave = `${year}-${week.toString().padStart(2, '0')}`;
          
          if (giroSemanal.has(chave)) {
            const semanaData = giroSemanal.get(chave)!;
            semanaData.total += entrega.quantidade;
            semanaData.entregas.push({
              data: entrega.data,
              quantidade: entrega.quantidade,
              tipo: entrega.tipo as 'entrega' | 'retorno'
            });
            giroSemanal.set(chave, semanaData);
          }
        });

        // Preparar dados do gráfico com informações detalhadas
        const dadosGrafico = ultimas12Semanas.map(semana => {
          const dadosSemana = giroSemanal.get(semana.chave) || { total: 0, entregas: [] };
          const { dataInicial, dataFinal } = calcularPeriodoSemana(semana.ano, semana.semana);
          
          return {
            semana: semana.display,
            valor: dadosSemana.total,
            entregas: dadosSemana.entregas,
            periodo: `${dataInicial} - ${dataFinal}`,
            dataInicial,
            dataFinal
          };
        });

        console.log('📈 Dados do gráfico preparados:', dadosGrafico);

        // Calcular métricas
        const valoresSemanas = Array.from(giroSemanal.values()).map(item => item.total);
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
          semaforo
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
  }, [cliente.id, cliente.metaGiroSemanal]);

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
