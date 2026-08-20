import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Plus,
  CheckCircle2,
  Truck,
  Clock,
  AlertCircle,
  Cookie,
  ArrowRight,
  TrendingUp,
  Package,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRepDashboardData } from "@/hooks/useRepDashboardData";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import AtualizarAgendamentoDialog from "@/components/rep/AtualizarAgendamentoDialog";
import { useInadimplencia } from "@/hooks/useInadimplencia";
import { cn } from "@/lib/utils";

const STATUS_META = {
  previsto: { label: "Previstos", color: "bg-amber-500", text: "text-amber-700" },
  confirmado: { label: "Confirmados", color: "bg-blue-500", text: "text-blue-700" },
  entregue: { label: "Entregues", color: "bg-emerald-500", text: "text-emerald-700" },
};

export default function RepHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, refetch } = useRepDashboardData();
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [atualizarAgendamentoOpen, setAtualizarAgendamentoOpen] = useState(false);
  const { clientes: inadimplencia, loading: loadingInadimplencia } = useInadimplencia();


  const greetingName = user?.email?.split("@")[0] || "representante";

  const resumoInadimplencia = useMemo(() => {
    if (!inadimplencia) return { clientes: 0, valor: 0 };
    const comAtraso = inadimplencia.filter((c) => c.qtdAtrasados > 0);
    return {
      clientes: comAtraso.length,
      valor: comAtraso.reduce((sum, c) => sum + c.valorAtrasado, 0),
    };
  }, [inadimplencia]);

  const { previstoPct, confirmadoPct, entreguePct } = useMemo(() => {
    const total = data.agendamentosSemanaAtual || 0;
    if (total === 0) return { previstoPct: 0, confirmadoPct: 0, entreguePct: 0 };
    return {
      previstoPct: Math.round((data.previstosSemanaAtual.length / total) * 100),
      confirmadoPct: Math.round((data.confirmadosSemanaAtual / total) * 100),
      entreguePct: Math.round((data.entreguesSemanaAtual / total) * 100),
    };
  }, [data]);

  const KPIs = useMemo(
    () => [
      {
        label: "PDVs ativos",
        value: data.totalClientesAtivos,
        total: data.totalClientes,
        icon: Users,
        color: "text-purple-600",
        bg: "bg-purple-100",
        suffix: "ativos",
      },
      {
        label: "Agend. semana",
        value: data.agendamentosSemanaAtual,
        icon: Calendar,
        color: "text-slate-600",
        bg: "bg-slate-100",
        suffix: "pedidos",
      },
      {
        label: "Unidades semana",
        value: data.totalUnidadesSemanaAtual,
        icon: Package,
        color: "text-amber-600",
        bg: "bg-amber-100",
        suffix: "un",
      },
      {
        label: "Taxa confirm.",
        value: Math.round(data.taxaConfirmacaoSemana * 100),
        icon: TrendingUp,
        color: "text-emerald-600",
        bg: "bg-emerald-100",
        suffix: "%",
      },
      {
        label: "Confirmados",
        value: data.confirmadosSemanaAtual,
        icon: CheckCircle2,
        color: "text-blue-600",
        bg: "bg-blue-100",
        suffix: "ped",
      },
      {
        label: "Entregues",
        value: data.entreguesSemanaAtual,
        icon: Truck,
        color: "text-emerald-600",
        bg: "bg-emerald-100",
        suffix: "ped",
      },
      {
        label: "Previstos",
        value: data.previstosSemanaAtual.length,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-100",
        suffix: "ped",
      },
      {
        label: "Pendentes",
        value: data.agendamentosPendentes.length,
        icon: AlertCircle,
        color: "text-[#d1193a]",
        bg: "bg-red-100",
        suffix: "ped",
        alert: data.agendamentosPendentes.length > 0,
      },
    ],
    [data]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Olá, {greetingName} 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Resumo geral da semana • <span className="font-medium">{data.semanaAtualLabel}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPIs.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              className={cn(
                "overflow-hidden transition-all hover:border-border hover:shadow-sm",
                kpi.alert && "border-[#d1193a]/40 bg-red-50/40"
              )}
            >
              <div className={cn("h-1", kpi.bg.replace("bg-", "bg-").replace("text-", ""))} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground leading-snug break-words">{kpi.label}</p>
                    <div className="text-2xl sm:text-3xl font-bold mt-1">
                      {loading ? "—" : kpi.value}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug break-words">
                      {kpi.total ? `${kpi.total} cadastrados` : kpi.suffix}
                    </p>
                  </div>
                  <div className={cn("p-2 rounded-lg shrink-0", kpi.bg)}>
                    <Icon className={cn("w-4 h-4", kpi.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Inadimplência */}
        <Card
          className={cn(
            "overflow-hidden col-span-2 md:col-span-4",
            resumoInadimplencia.clientes > 0
              ? "border-red-400/60 bg-red-50/40"
              : "border-border"
          )}
        >
          <div className="h-1 bg-red-500" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-red-100 shrink-0">
                  <AlertCircle className="w-4 h-4 text-[#d1193a]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clientes inadimplentes</p>
                  <div className="text-2xl sm:text-3xl font-bold mt-1">
                    {loadingInadimplencia ? "—" : resumoInadimplencia.clientes}
                  </div>
                </div>
              </div>
              <div className="text-right min-w-0">
                <p className="text-xs text-muted-foreground">Total em atraso</p>
                <div className="text-lg sm:text-xl font-bold text-[#d1193a] mt-1">
                  {loadingInadimplencia
                    ? "—"
                    : resumoInadimplencia.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição da semana */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cookie className="w-4 h-4 text-amber-500" />
            Distribuição dos agendamentos da semana
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Total de <span className="font-medium">{loading ? "—" : data.agendamentosSemanaAtual} pedidos</span>
            {loading ? "" : ` • ${data.totalUnidadesSemanaAtual.toLocaleString("pt-BR")} unidades previstas`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground py-2">Carregando…</div>
          ) : data.agendamentosSemanaAtual === 0 ? (
            <div className="text-sm text-muted-foreground py-2">Nenhum agendamento para esta semana.</div>
          ) : (
            <>
              <div className="h-4 w-full rounded-full overflow-hidden flex">
                {previstoPct > 0 && (
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${previstoPct}%` }}
                    title={`Previstos: ${previstoPct}%`}
                  />
                )}
                {confirmadoPct > 0 && (
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${confirmadoPct}%` }}
                    title={`Confirmados: ${confirmadoPct}%`}
                  />
                )}
                {entreguePct > 0 && (
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${entreguePct}%` }}
                    title={`Entregues: ${entreguePct}%`}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { ...STATUS_META.previsto, value: data.previstosSemanaAtual.length, pct: previstoPct },
                  { ...STATUS_META.confirmado, value: data.confirmadosSemanaAtual, pct: confirmadoPct },
                  { ...STATUS_META.entregue, value: data.entreguesSemanaAtual, pct: entreguePct },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", item.color)} />
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                    <span className="text-muted-foreground">({item_pct(item.pct)})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Aviso de previstos */}
      {!loading && data.previstosSemanaAtual.length > 0 && (
        <Card className="border-amber-400/70 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-200 text-amber-900">
                <Cookie className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {data.totalBrowniesPrevistosSemana.toLocaleString("pt-BR")} unidades a confirmar
                </p>
                <p className="text-xs text-amber-900/70">
                  {data.previstosSemanaAtual.length} pedidos previstos para esta semana
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
              onClick={() => navigate("/rep/agendamentos")}
            >
              Ver <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Atalhos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button className="w-full justify-center h-auto py-3 text-xs sm:text-sm whitespace-normal" onClick={() => setNovoClienteOpen(true)}>
          <Plus className="w-4 h-4 mr-2 shrink-0" /> Cadastrar cliente
        </Button>
        <Button variant="outline" className="w-full justify-center h-auto py-3 text-xs sm:text-sm whitespace-normal" onClick={() => navigate("/rep/clientes")}>
          <Users className="w-4 h-4 mr-2 shrink-0" /> Ver clientes
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-center h-auto py-3 text-xs sm:text-sm whitespace-normal col-span-2 md:col-span-1"
          onClick={() => setAtualizarAgendamentoOpen(true)}
        >
          <CalendarClock className="w-4 h-4 mr-2 shrink-0" /> Atualizar agendamento
        </Button>
        <Button variant="outline" className="w-full justify-center h-auto py-3 text-xs sm:text-sm whitespace-normal" onClick={() => navigate("/rep/agendamentos")}>
          <Calendar className="w-4 h-4 mr-2 shrink-0" /> Agendamentos
        </Button>
        <Button variant="outline" className="w-full justify-center h-auto py-3 text-xs sm:text-sm whitespace-normal" onClick={() => navigate("/rep/inadimplencia")}>
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> Inadimplência
        </Button>
      </div>

      <AtualizarAgendamentoDialog
        open={atualizarAgendamentoOpen}
        onOpenChange={setAtualizarAgendamentoOpen}
        onSalvo={() => refetch()}
      />

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

function item_pct(pct: number): string {
  return `${pct}%`;
}
