import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Plus, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRepDashboardData, RepAgendamentoLite } from "@/hooks/useRepDashboardData";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";

function formatDate(s: string | null) {
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Confirmado":
      return "default";
    case "Previsto":
      return "secondary";
    case "Agendar":
      return "outline";
    default:
      return "outline";
  }
}

export default function RepHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, refetch } = useRepDashboardData();
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);

  const goToAgendamento = (id: string) => {
    navigate(`/rep/agendamentos?id=${id}`);
  };

  const greetingName = user?.email?.split("@")[0] || "representante";

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
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => setNovoClienteOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Cadastrar cliente
            </Button>
            <Button variant="outline" onClick={() => navigate("/rep/clientes")}>
              <Users className="w-4 h-4 mr-2" /> Ver clientes
            </Button>
            <Button variant="outline" onClick={() => navigate("/rep/agendamentos")}>
              <Calendar className="w-4 h-4 mr-2" /> Ver agendamentos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Próximos 7 dias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" /> Próximos 7 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AgendamentoList
            items={data.proximos7Dias}
            empty="Nenhum agendamento previsto para os próximos 7 dias."
            loading={loading}
            onItemClick={goToAgendamento}
          />
        </CardContent>
      </Card>

      {/* Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="w-5 h-5" /> Pendentes de confirmação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AgendamentoList
            items={data.pendentesConfirmacao}
            empty="Nenhuma pendência."
            loading={loading}
            onItemClick={goToAgendamento}
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
}: {
  items: RepAgendamentoLite[];
  empty: string;
  loading: boolean;
  onItemClick: (id: string) => void;
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
          <Badge variant={statusVariant(a.status_agendamento)}>{a.status_agendamento}</Badge>
        </button>
      ))}
    </div>
  );
}