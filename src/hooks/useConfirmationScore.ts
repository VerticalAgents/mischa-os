import { useMemo, useEffect, useState } from "react";
import { subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { AgendamentoItem } from "@/components/agendamento/types";
import { ConfirmationScore } from "@/types/confirmationScore";
import { calcularConfirmationScore } from "@/utils/confirmationScore";

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

      map.set(
        clienteId,
        calcularConfirmationScore({
          entregas: entregas.filter((e) => e.cliente_id === clienteId),
          reagendamentos: reagendamentos.filter((r) => r.cliente_id === clienteId),
          dataAgendada: new Date(agendamento.dataReposicao),
          agendamentoId: agendamento.id,
          periodicidadePadrao: agendamento.cliente.periodicidadePadrao,
        })
      );
    }

    return map;
  }, [agendamentos, entregas, reagendamentos]);

  return { scores, loading };
}
