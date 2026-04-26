import { useEffect, useMemo, useState } from "react";
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
import { Plus, Search, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import ClienteDetailsView from "@/components/clientes/ClienteDetailsView";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";
import { Cliente } from "@/types";
import { transformDbRowToCliente } from "@/hooks/useClienteStore";

interface ClienteRow {
  id: string;
  nome: string;
  status_cliente: string;
  ativo: boolean;
  cnpj_cpf: string | null;
  contato_telefone: string | null;
  proxima_data_reposicao: string | null;
  categoria_estabelecimento_id: number | null;
}

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os status" },
  { value: "ATIVO", label: "Ativos" },
  { value: "STANDBY", label: "Standby" },
  { value: "A_ATIVAR", label: "A ativar" },
  { value: "REATIVAR", label: "Reativar" },
  { value: "INATIVO", label: "Inativos" },
];

function statusLabel(s: string) {
  switch (s) {
    case "ATIVO":
      return "Ativo";
    case "STANDBY":
      return "Standby";
    case "A_ATIVAR":
      return "A ativar";
    case "REATIVAR":
      return "Reativar";
    case "INATIVO":
      return "Inativo";
    default:
      return s;
  }
}

function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  if (s === "ATIVO") return "default";
  if (s === "INATIVO") return "destructive";
  return "secondary";
}

function formatDate(s: string | null) {
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export default function RepClientes() {
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [novoOpen, setNovoOpen] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  const carregar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clientes")
        .select(
          "id, nome, status_cliente, ativo, cnpj_cpf, contato_telefone, proxima_data_reposicao, categoria_estabelecimento_id"
        )
        .order("nome");
      if (error) throw error;
      setClientes((data as ClienteRow[]) || []);
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    return clientes.filter((c) => {
      if (filtroStatus !== "todos" && c.status_cliente !== filtroStatus) return false;
      if (busca) {
        const q = busca.toLowerCase();
        const nameMatch = c.nome.toLowerCase().includes(q);
        const cnpjMatch = (c.cnpj_cpf || "").replace(/\D/g, "").includes(q.replace(/\D/g, ""));
        if (!nameMatch && !cnpjMatch) return false;
      }
      return true;
    });
  }, [clientes, busca, filtroStatus]);

  const handleEditar = async (id: string) => {
    // Buscar registro completo para edição
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      console.error(error);
      return;
    }
    // Mapear snake_case → camelCase para o formulário
    setEditandoCliente(transformDbRowToCliente(data));
  };

  const abrirDetalhes = async (id: string) => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      console.error(error);
      return;
    }
    setClienteSelecionado(transformDbRowToCliente(data));
  };

  // Quando há cliente selecionado, exibe a visualização detalhada com abas
  if (clienteSelecionado) {
    return (
      <EditPermissionProvider value={{ canEdit: true }}>
        <ClienteDetailsView
          cliente={clienteSelecionado}
          onBack={() => {
            setClienteSelecionado(null);
            carregar();
          }}
        />
      </EditPermissionProvider>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Clientes</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Carregando…" : `${filtrados.length} de ${clientes.length} clientes`}
          </p>
        </div>
        <Button onClick={() => setNovoOpen(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" /> Novo cliente
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ/CPF…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="sm:w-56">
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
                  <th className="text-left p-3 w-[35%]">Nome</th>
                  <th className="text-left p-3 w-[15%]">Status</th>
                  <th className="text-left p-3 w-[20%]">Telefone</th>
                  <th className="text-left p-3 w-[20%]">Próxima reposição</th>
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
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t cursor-pointer transition-colors hover:bg-muted active:bg-muted/80"
                      onClick={() => abrirDetalhes(c.id)}
                    >
                      <td className="p-3 truncate font-medium">{c.nome}</td>
                      <td className="p-3">
                        <Badge variant={statusVariant(c.status_cliente)}>
                          {statusLabel(c.status_cliente)}
                        </Badge>
                      </td>
                      <td className="p-3 truncate text-muted-foreground">
                        {c.contato_telefone || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatDate(c.proxima_data_reposicao)}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => handleEditar(c.id)}>
                          <Pencil className="w-4 h-4" />
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

      {/* Novo cliente */}
      <ClienteFormDialog
        open={novoOpen}
        onOpenChange={(o) => {
          setNovoOpen(o);
          if (!o) carregar();
        }}
        onClienteUpdate={() => carregar()}
      />

      {/* Editar */}
      <ClienteFormDialog
        open={!!editandoCliente}
        onOpenChange={(o) => {
          if (!o) {
            setEditandoCliente(null);
            carregar();
          }
        }}
        cliente={editandoCliente}
        onClienteUpdate={() => carregar()}
      />
    </div>
  );
}