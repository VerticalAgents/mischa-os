import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Edit, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import AgendamentoEditModal from "@/components/agendamento/AgendamentoEditModal";
import { AgendamentoItem } from "@/components/agendamento/types";

const PERIODO_OPTIONS = [
  { value: "hoje", label: "Hoje" },
  { value: "7", label: "Próximos 7 dias" },
  { value: "30", label: "Próximos 30 dias" },
  { value: "todos", label: "Todos" },
];

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os status" },
  { value: "Previsto", label: "Previsto" },
  { value: "Agendado", label: "Agendado" },
  { value: "Agendar", label: "Agendar" },
];

function statusVariant(s: string): "default" | "secondary" | "outline" {
  if (s === "Agendado") return "default";
  if (s === "Previsto") return "secondary";
  return "outline";
}

export default function RepAgendamentos() {
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { clientes, carregarClientes } = useClienteStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("30");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AgendamentoItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([carregarTodosAgendamentos(), carregarClientes()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-abrir modal se id veio na URL
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && agendamentos.length > 0) {
      const found = agendamentos.find((a) => a.id === id);
      if (found) {
        setSelected(found);
        setOpen(true);
      }
      // Limpa o param da URL para não reabrir
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [agendamentos, searchParams, setSearchParams]);

  const filtrados = useMemo(() => {
    let list = [...agendamentos];

    if (filtroStatus !== "todos") {
      list = list.filter((a) => a.statusAgendamento === filtroStatus);
    }

    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter((a) => a.cliente.nome.toLowerCase().includes(q));
    }

    if (periodo !== "todos") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const limit = new Date(today);
      if (periodo === "hoje") {
        limit.setHours(23, 59, 59, 999);
      } else {
        limit.setDate(limit.getDate() + parseInt(periodo));
      }
      list = list.filter((a) => {
        const d = new Date(a.dataReposicao);
        d.setHours(0, 0, 0, 0);
        return d >= today && d <= limit;
      });
    }

    list.sort((a, b) => a.dataReposicao.getTime() - b.dataReposicao.getTime());
    return list;
  }, [agendamentos, busca, periodo, filtroStatus]);

  const handleEditar = (a: AgendamentoItem) => {
    setSelected(a);
    setOpen(true);
  };

  const handleSalvar = () => {
    carregarTodosAgendamentos();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
        <p className="text-muted-foreground mt-1">
          {loading
            ? "Carregando…"
            : `${filtrados.length} agendamento(s)`}
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md overflow-hidden">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3 w-[20%]">Data</th>
                  <th className="text-left p-3 w-[40%]">Cliente</th>
                  <th className="text-left p-3 w-[15%]">Qtd.</th>
                  <th className="text-left p-3 w-[15%]">Status</th>
                  <th className="text-right p-3 w-[10%]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Nenhum agendamento no período.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((a) => (
                    <tr key={a.id ?? a.cliente.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 truncate text-muted-foreground">
                        {format(a.dataReposicao, "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="p-3 truncate font-medium">{a.cliente.nome}</td>
                        <td className="p-3">{a.pedido?.totalPedidoUnidades ?? "-"}</td>
                      <td className="p-3">
                        <Badge variant={statusVariant(a.statusAgendamento)}>
                          {a.statusAgendamento}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleEditar(a)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AgendamentoEditModal
        open={open}
        onOpenChange={setOpen}
        agendamento={selected}
        onSalvar={handleSalvar}
      />
    </div>
  );
}