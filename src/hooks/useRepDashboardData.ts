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

      const today = new Date();
      const inicioSemana = startOfWeek(today, { weekStartsOn: 1 });
      const fimSemana = endOfWeek(today, { weekStartsOn: 1 });
      const inicioISO = format(inicioSemana, "yyyy-MM-dd");
      const fimISO = format(fimSemana, "yyyy-MM-dd");

      // Consultas em paralelo e já filtradas no servidor (muito mais rápido no mobile)
      const [clientesRes, semanaRes, pendentesRes, entregasRes] = await Promise.all([
        supabase.from("clientes").select("id, nome, ativo, status_cliente"),
        supabase
          .from("agendamentos_clientes")
          .select("id, cliente_id, data_proxima_reposicao, status_agendamento, quantidade_total")
          .gte("data_proxima_reposicao", inicioISO)
          .lte("data_proxima_reposicao", fimISO),
        supabase
          .from("agendamentos_clientes")
          .select("id, cliente_id, data_proxima_reposicao, status_agendamento, quantidade_total")
          .in("status_agendamento", ["Agendar", "Pendente"])
          .order("data_proxima_reposicao", { ascending: true })
          .limit(10),
        // Entregas efetivadas na semana (o agendamento volta para "Previsto" com nova data)
        supabase
          .from("historico_entregas")
          .select("id, cliente_id, quantidade, data")
          .eq("tipo", "entrega")
          .gte("data", `${inicioISO}T00:00:00`)
          .lte("data", `${fimISO}T23:59:59`),
      ]);

      if (clientesRes.error) throw clientesRes.error;
      if (semanaRes.error) throw semanaRes.error;
      if (pendentesRes.error) throw pendentesRes.error;
      if (entregasRes.error) throw entregasRes.error;

      const clientes = clientesRes.data;
      const total = clientes?.length ?? 0;
      const ativos = clientes?.filter((c) => c.ativo && c.status_cliente === "ATIVO").length ?? 0;

      const clienteMap = new Map((clientes || []).map((c) => [c.id, c.nome]));
      const mapAgend = (rows: any[] | null): RepAgendamentoLite[] =>
        (rows || []).map((a) => ({
          id: a.id,
          cliente_id: a.cliente_id,
          cliente_nome: clienteMap.get(a.cliente_id) || "Cliente",
          data_proxima_reposicao: a.data_proxima_reposicao,
          status_agendamento: a.status_agendamento,
          quantidade_total: a.quantidade_total,
        }));

      const agendamentosNaSemana = mapAgend(semanaRes.data);
      const entregasSemana = entregasRes.data || [];

      // "Agendado" = pedido confirmado no sistema
      const confirmadosSemana = agendamentosNaSemana.filter(
        (a) => a.status_agendamento === "Agendado"
      ).length;
      const entreguesSemana = entregasSemana.length;

      const unidadesAgendadas = agendamentosNaSemana.reduce(
        (sum, a) => sum + (a.quantidade_total || 0),
        0
      );
      const unidadesEntregues = entregasSemana.reduce(
        (sum: number, e: any) => sum + (e.quantidade || 0),
        0
      );
      const totalUnidadesSemana = unidadesAgendadas + unidadesEntregues;

      const totalPedidosSemana = agendamentosNaSemana.length + entreguesSemana;
      const taxaConfirmacaoSemana =
        totalPedidosSemana > 0
          ? Math.round(((confirmadosSemana + entreguesSemana) / totalPedidosSemana) * 100) / 100
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

      const pendentes = mapAgend(pendentesRes.data);

      setData({
        totalClientesAtivos: ativos,
        totalClientes: total,
        agendamentosSemanaAtual: totalPedidosSemana,
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
