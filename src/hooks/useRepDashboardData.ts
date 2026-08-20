import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, format } from "date-fns";

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
  agendamentosSemanaAtual: number;
  confirmadosSemanaAtual: number;
  entreguesSemanaAtual: number;
  previstosSemanaAtual: RepAgendamentoLite[];
  totalBrowniesPrevistosSemana: number;
  totalUnidadesSemanaAtual: number;
  taxaConfirmacaoSemana: number; // 0-1
  agendamentosPendentes: RepAgendamentoLite[];
  semanaAtualLabel: string;
}

/**
 * Busca dados agregados para a Home do representante.
 * RLS já filtra automaticamente para mostrar apenas clientes/agendamentos do rep logado.
 */
export function useRepDashboardData() {
  const [data, setData] = useState<RepDashboardData>({
    totalClientesAtivos: 0,
    totalClientes: 0,
    agendamentosSemanaAtual: 0,
    confirmadosSemanaAtual: 0,
    entreguesSemanaAtual: 0,
    previstosSemanaAtual: [],
    totalBrowniesPrevistosSemana: 0,
    totalUnidadesSemanaAtual: 0,
    taxaConfirmacaoSemana: 0,
    agendamentosPendentes: [],
    semanaAtualLabel: "",
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

      const agendamentosNaSemana = enriched.filter((a) => {
        if (!a.data_proxima_reposicao) return false;
        const d = new Date(a.data_proxima_reposicao + "T00:00:00");
        return d >= inicioSemana && d <= fimSemana;
      });

      const confirmadosSemana = agendamentosNaSemana.filter(
        (a) => a.status_agendamento === "Confirmado"
      ).length;
      const entreguesSemana = agendamentosNaSemana.filter(
        (a) => a.status_agendamento === "Entregue"
      ).length;
      const confirmadosOuAvancados = agendamentosNaSemana.filter((a) =>
        ["Confirmado", "Separado", "Despachado", "Entregue"].includes(a.status_agendamento)
      ).length;
      const totalUnidadesSemana = agendamentosNaSemana.reduce(
        (sum, a) => sum + (a.quantidade_total || 0),
        0
      );
      const taxaConfirmacaoSemana =
        agendamentosNaSemana.length > 0
          ? Math.round((confirmadosOuAvancados / agendamentosNaSemana.length) * 100) / 100
          : 0;


      const previstosSemana = agendamentosNaSemana
        .filter((a) => a.status_agendamento === "Previsto")
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
        agendamentosSemanaAtual: agendamentosNaSemana.length,
        confirmadosSemanaAtual: confirmadosSemana,
        entreguesSemanaAtual: entreguesSemana,
        previstosSemanaAtual: previstosSemana,
        totalBrowniesPrevistosSemana,
        totalUnidadesSemanaAtual: totalUnidadesSemana,
        taxaConfirmacaoSemana,
        agendamentosPendentes: pendentes.slice(0, 10),
        semanaAtualLabel: `${format(inicioSemana, "dd/MM")} – ${format(fimSemana, "dd/MM")}`,
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
