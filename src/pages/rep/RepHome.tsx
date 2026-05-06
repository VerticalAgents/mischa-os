import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Plus, AlertCircle, Clock, Cookie } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRepDashboardData, RepAgendamentoLite } from "@/hooks/useRepDashboardData";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import { useConfirmationScore } from "@/hooks/useConfirmationScore";
import { AgendamentoItem } from "@/components/agendamento/types";

function formatDate(s: string | null) {
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

type Tone = "warning" | "danger";

const TONE_BADGE: Record<Tone, string> = {
  warning: "bg-yellow-100 text-yellow-900 border-yellow-300 hover:bg-yellow-100",
  danger: "bg-[#d1193a] text-white border-[#d1193a] hover:bg-[#d1193a]",
};

export default function RepHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, refetch } = useRepDashboardData();
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);

  const goToAgendamento = (id: string) => {
    navigate(`/rep/agendamentos?id=${id}`);
  };

  const greetingName = user?.email?.split("@")[0] || "representante";

  // Build minimal AgendamentoItem-shaped objects to feed useConfirmationScore
  const previstosForScore = useMemo<AgendamentoItem[]>(() => {
    return (data.previstosSemanaAtual || []).map((a) => ({
      id: a.id,
      cliente: { id: a.cliente_id, nome: a.cliente_nome } as any,
      dataReposicao: a.data_proxima_reposicao
        ? new Date(a.data_proxima_reposicao + "T00:00:00")
        : new Date(),
      statusAgendamento: "Previsto",
    } as any));
  }, [data.previstosSemanaAtual]);

  const { scores } = useConfirmationScore(previstosForScore);

  const previstosOrdenados = useMemo(() => {
    const list = [...(data.previstosSemanaAtual || [])];
    list.sort((a, b) => {
      const sa = scores.get(a.cliente_id)?.score ?? 70;
      const sb = scores.get(b.cliente_id)?.score ?? 70;
      if (sb !== sa) return sb - sa;
      return (a.data_proxima_reposicao || "").localeCompare(b.data_proxima_reposicao || "");
    });
    return list;
  }, [data.previstosSemanaAtual, scores]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {greetingName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao seu portal. Aqui você gerencia seus clientes e agendamentos.
        </p>
      </div>

      {/* KPIs + Atalhos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Meus PDVs ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "—" : data.totalClientesAtivos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {loading ? "—" : data.totalClientes} cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="w-full justify-start" onClick={() => setNovoClienteOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Cadastrar cliente
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/rep/clientes")}>
              <Users className="w-4 h-4 mr-2" /> Ver clientes
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/rep/agendamentos")}>
              <Calendar className="w-4 h-4 mr-2" /> Ver agendamentos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Previstos da semana — AMARELO */}
      <Card className="border-yellow-400/70 bg-yellow-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-yellow-900">
            <Clock className="w-5 h-5" /> Previstos da semana
          </CardTitle>
          <p className="text-xs text-yellow-900/70">
            Confirme o quanto antes para garantir a entrega.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Mini bloco: total de brownies previstos */}
          <div className="flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-100/70 px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-yellow-200 text-yellow-900">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold leading-none text-yellow-900">
                {loading ? "—" : data.totalBrowniesPrevistosSemana}
              </div>
              <div className="text-xs text-yellow-900/80 mt-1">
                brownies a confirmar nesta semana
              </div>
            </div>
          </div>

          <AgendamentoList
            items={previstosOrdenados}
            empty="Nenhum agendamento previsto para esta semana."
            loading={loading}
            onItemClick={goToAgendamento}
            tone="warning"
            provavelIds={new Set(
              Array.from(scores.entries())
                .filter(([, s]) => (s?.score ?? 0) >= 80)
                .map(([id]) => id)
            )}
          />
        </CardContent>
      </Card>

      {/* Pendentes — VERMELHO */}
      <Card className="border-[#d1193a]/60 bg-[#d1193a]/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-[#d1193a]">
            <AlertCircle className="w-5 h-5" /> Agendamentos pendentes
          </CardTitle>
          <p className="text-xs text-[#d1193a]/80">
            Retome esses clientes o quanto antes.
          </p>
        </CardHeader>
        <CardContent>
          <AgendamentoList
            items={data.agendamentosPendentes}
            empty="Nenhum cliente pendente. 🎉"
            loading={loading}
            onItemClick={goToAgendamento}
            tone="danger"
          />
        </CardContent>
      </Card>

      <ClienteFormDialog
        open={novoClienteOpen}
        onOpenChange={(o) => {
          setNovoClienteOpen(o);
          if (!o) refetch();
        }}
        onClienteUpdate={() => refetch()}
      />
    </div>
  );
}

function AgendamentoList({
  items,
  empty,
  loading,
  onItemClick,
  tone,
  provavelIds,
}: {
  items: RepAgendamentoLite[];
  empty: string;
  loading: boolean;
  onItemClick: (id: string) => void;
  tone: Tone;
  provavelIds?: Set<string>;
}) {
  if (loading) {
    return <div className="text-sm text-muted-foreground py-4">Carregando…</div>;
  }
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">{empty}</div>;
  }
  return (
    <div className="divide-y">
      {items.map((a) => (
        <button
          key={a.id}
          onClick={() => onItemClick(a.id)}
          className="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-muted/40 px-2 -mx-2 rounded-md transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{a.cliente_nome}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(a.data_proxima_reposicao)} • {a.quantidade_total} un.
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {provavelIds?.has(a.cliente_id) && (
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100 text-[10px] px-1.5 py-0"
              >
                Provável
              </Badge>
            )}
            <Badge variant="outline" className={TONE_BADGE[tone]}>
              {a.status_agendamento === "Agendar" ? "Pendente" : a.status_agendamento}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  );
}