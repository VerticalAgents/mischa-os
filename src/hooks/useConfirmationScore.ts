import { useMemo, useEffect, useState } from "react";
import { differenceInDays, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { AgendamentoItem } from "@/components/agendamento/types";
import { ConfirmationScore } from "@/types/confirmationScore";

interface HistoricoEntrega {
  cliente_id: string;
  data: string;
  quantidade: number;
  tipo: string;
}

interface Reagendamento {
  cliente_id: string;
  data_original: string;
  data_nova: string;
  tipo: string;
  created_at: string;
  agendamento_id: string | null;
}

export function useConfirmationScore(agendamentos: AgendamentoItem[]) {
  const [entregas, setEntregas] = useState<HistoricoEntrega[]>([]);
  const [reagendamentos, setReagendamentos] = useState<Reagendamento[]>([]);
  const [loading, setLoading] = useState(false);

  const clienteIds = useMemo(() => 
    [...new Set(agendamentos.map(a => a.cliente.id))],
    [agendamentos]
  );

  useEffect(() => {
    if (clienteIds.length === 0) return;

    const fetchData = async () => {
      setLoading(true);
      const dataLimite84 = subDays(new Date(), 84).toISOString().split('T')[0];
      const dataLimite90 = subDays(new Date(), 90).toISOString().split('T')[0];

      const [entregasRes, reagendamentosRes] = await Promise.all([
        supabase
          .from('historico_entregas')
          .select('cliente_id, data, quantidade, tipo')
          .in('cliente_id', clienteIds)
          .gte('data', dataLimite84)
          .eq('tipo', 'entrega')
          .order('data', { ascending: true }),
        supabase
          .from('reagendamentos_entre_semanas')
          .select('cliente_id, data_original, data_nova, tipo, created_at, agendamento_id')
          .in('cliente_id', clienteIds)
          .gte('created_at', dataLimite90)
      ]);

      setEntregas((entregasRes.data || []) as HistoricoEntrega[]);
      setReagendamentos((reagendamentosRes.data || []) as Reagendamento[]);
      setLoading(false);
    };

    fetchData();
  }, [clienteIds]);

  const scores = useMemo(() => {
    const map = new Map<string, ConfirmationScore>();

    for (const agendamento of agendamentos) {
      const clienteId = agendamento.cliente.id;
      const entregasCliente = entregas.filter(e => e.cliente_id === clienteId);
      const reagendamentosCliente = reagendamentos.filter(r => r.cliente_id === clienteId);

      // COLD START
      if (entregasCliente.length === 0) {
        map.set(clienteId, {
          score: 70,
          nivel: 'medio',
          motivo: 'Cliente novo, sem histórico de entregas',
          fatores: { baseline: 70, penalidade_volatilidade: 0, vetor_tendencia: 0 }
        });
        continue;
      }

      if (entregasCliente.length === 1) {
        const periodicidade = agendamento.cliente.periodicidadePadrao || 14;
        map.set(clienteId, {
          score: 80,
          nivel: 'medio',
          motivo: `Apenas 1 entrega registrada; cadência estimada de ${periodicidade} dias`,
          fatores: { baseline: 80, penalidade_volatilidade: 0, vetor_tendencia: 0 }
        });
        continue;
      }

      // Calculate mean interval (Im)
      const datas = entregasCliente.map(e => new Date(e.data)).sort((a, b) => a.getTime() - b.getTime());
      let totalIntervalos = 0;
      for (let i = 1; i < datas.length; i++) {
        totalIntervalos += differenceInDays(datas[i], datas[i - 1]);
      }
      const intervaloMedio = totalIntervalos / (datas.length - 1);
      
      // BASELINE
      const ultimaEntrega = datas[datas.length - 1];
      const dataAgendada = new Date(agendamento.dataReposicao);
      const dataEsperada = new Date(ultimaEntrega);
      dataEsperada.setDate(dataEsperada.getDate() + Math.round(intervaloMedio));
      
      const desvio = differenceInDays(dataAgendada, dataEsperada);
      const peso = entregasCliente.length === 2 ? 0.5 : 1;
      let penalidade = 0;
      if (desvio > 0) {
        penalidade = desvio * 2;
      } else if (desvio < -3) {
        penalidade = Math.abs(desvio + 3) * 1.5;
      }
      let baseline = 95 - penalidade * peso;

      // VOLATILIDADE
      // Try to match by agendamento_id first, fall back to date proximity
      const agendamentoId = agendamento.id;
      let reagendamentosVinculados = agendamentoId 
        ? reagendamentosCliente.filter(r => r.agendamento_id === agendamentoId)
        : [];
      
      // If no direct match, use date proximity (within 7 days of scheduled date)
      if (reagendamentosVinculados.length === 0) {
        reagendamentosVinculados = reagendamentosCliente.filter(r => {
          const dataOriginal = new Date(r.data_original);
          return Math.abs(differenceInDays(dataOriginal, dataAgendada)) <= 7;
        });
      }

      let penalidade_volatilidade = reagendamentosVinculados.length * -15;
      
      // Extra penalty for last-minute changes (<24h)
      for (const r of reagendamentosVinculados) {
        const createdAt = new Date(r.created_at);
        const dataOriginal = new Date(r.data_original);
        const horasAntecedencia = (dataOriginal.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        if (horasAntecedencia < 24) {
          penalidade_volatilidade -= 10;
        }
      }

      // VETOR DE TENDÊNCIA
      let vetor_tendencia = 0;
      if (reagendamentosCliente.length > 0) {
        const adiantamentos = reagendamentosCliente.filter(r => r.tipo === 'adiantamento').length;
        const adiamentos = reagendamentosCliente.filter(r => r.tipo === 'adiamento').length;
        
        if (adiantamentos > adiamentos) {
          vetor_tendencia = 5; // bonus
        }
        
        // 2+ postponements on current order
        const adiamentosVinculados = reagendamentosVinculados.filter(r => r.tipo === 'adiamento').length;
        if (adiamentosVinculados >= 2) {
          vetor_tendencia -= 20;
        }
      }

      const scoreRaw = baseline + penalidade_volatilidade + vetor_tendencia;
      const score = Math.min(99, Math.max(5, Math.round(scoreRaw)));

      // Build explanation
      const motivos: string[] = [];
      motivos.push(`Cadência de ${Math.round(intervaloMedio)} dias`);
      if (reagendamentosVinculados.length > 0) {
        motivos.push(`${reagendamentosVinculados.length} reagendamento(s)`);
      }
      if (desvio > 0) {
        motivos.push(`${desvio} dia(s) além da cadência`);
      } else if (desvio < -3) {
        motivos.push(`${Math.abs(desvio)} dia(s) antes da cadência`);
      }

      map.set(clienteId, {
        score,
        nivel: score > 85 ? 'alto' : score >= 50 ? 'medio' : 'baixo',
        motivo: motivos.join('; '),
        fatores: {
          baseline: Math.round(baseline),
          penalidade_volatilidade,
          vetor_tendencia
        }
      });
    }

    return map;
  }, [agendamentos, entregas, reagendamentos]);

  return { scores, loading };
}
