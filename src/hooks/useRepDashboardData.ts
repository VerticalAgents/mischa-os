import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek } from "date-fns";

export interface RepAgendamentoLite {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  data_proxima_reposicao: string | null;
  status_agendamento: string;
  quantidade_total: number;
}

export interface RepDashboardData {
  totalClientesAtivos: number;
  totalClientes: number;
  previstosSemanaAtual: RepAgendamentoLite[];
  totalBrowniesPrevistosSemana: number;
  agendamentosPendentes: RepAgendamentoLite[];
}

/**
 * Busca dados agregados para a Home do representante.
 * RLS já filtra automaticamente para mostrar apenas clientes/agendamentos do rep logado.
 */
export function useRepDashboardData() {
  const [data, setData] = useState<RepDashboardData>({
    totalClientesAtivos: 0,
    totalClientes: 0,
    previstosSemanaAtual: [],
    totalBrowniesPrevistosSemana: 0,
    agendamentosPendentes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Clientes (RLS filtra)
      const { data: clientes, error: errClientes } = await supabase
        .from("clientes")
        .select("id, nome, ativo, status_cliente");
      if (errClientes) throw errClientes;

      const total = clientes?.length ?? 0;
      const ativos = clientes?.filter((c) => c.ativo && c.status_cliente === "ATIVO").length ?? 0;

      // 2. Agendamentos (RLS filtra)
      const { data: agendamentos, error: errAgend } = await supabase
        .from("agendamentos_clientes")
        .select("id, cliente_id, data_proxima_reposicao, status_agendamento, quantidade_total");
      if (errAgend) throw errAgend;

      const clienteMap = new Map((clientes || []).map((c) => [c.id, c.nome]));
      const today = new Date();
      const inicioSemana = startOfWeek(today, { weekStartsOn: 1 });
      const fimSemana = endOfWeek(today, { weekStartsOn: 1 });

      const enriched: RepAgendamentoLite[] = (agendamentos || []).map((a) => ({
        id: a.id,
        cliente_id: a.cliente_id,
        cliente_nome: clienteMap.get(a.cliente_id) || "Cliente",
        data_proxima_reposicao: a.data_proxima_reposicao,
        status_agendamento: a.status_agendamento,
        quantidade_total: a.quantidade_total,
      }));

      const previstosSemana = enriched
        .filter((a) => {
          if (a.status_agendamento !== "Previsto") return false;
          if (!a.data_proxima_reposicao) return false;
          const d = new Date(a.data_proxima_reposicao + "T00:00:00");
          return d >= inicioSemana && d <= fimSemana;
        })
        .sort((a, b) =>
          (a.data_proxima_reposicao || "").localeCompare(b.data_proxima_reposicao || "")
        );

      const totalBrowniesPrevistosSemana = previstosSemana.reduce(
        (sum, a) => sum + (a.quantidade_total || 0),
        0
      );

      const pendentes = enriched
        .filter((a) => ["Agendar", "Pendente"].includes(a.status_agendamento))
        .sort((a, b) =>
          (a.data_proxima_reposicao || "").localeCompare(b.data_proxima_reposicao || "")
        );

      setData({
        totalClientesAtivos: ativos,
        totalClientes: total,
        previstosSemanaAtual: previstosSemana.slice(0, 10),
        totalBrowniesPrevistosSemana,
        agendamentosPendentes: pendentes.slice(0, 10),
      });
    } catch (err: any) {
      console.error("Erro ao carregar dashboard do representante:", err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { data, loading, error, refetch };
}