import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import AgendamentoEditModal from "@/components/agendamento/AgendamentoEditModal";
import { AgendamentoItem } from "@/components/agendamento/types";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvo?: () => void;
}

export default function AtualizarAgendamentoDialog({ open, onOpenChange, onSalvo }: Props) {
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<AgendamentoItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setBusca("");
      if (agendamentos.length === 0) carregarTodosAgendamentos();
    }
  }, [open]);

  const resultados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return [];
    const qNum = q.replace(/[.\-\/]/g, "");
    return agendamentos
      .filter((a) => {
        const nome = a.cliente.nome.toLowerCase();
        const cnpj = (a.cliente.cnpjCpf || "").replace(/[.\-\/]/g, "").toLowerCase();
        return nome.includes(q) || (qNum.length > 2 && cnpj.includes(qNum));
      })
      .sort((a, b) => {
        const ta = a.dataReposicao ? a.dataReposicao.getTime() : Infinity;
        const tb = b.dataReposicao ? b.dataReposicao.getTime() : Infinity;
        return ta - tb;
      })
      .slice(0, 20);
  }, [agendamentos, busca]);

  const handleSelecionar = (a: AgendamentoItem) => {
    setSelecionado(a);
    setEditOpen(true);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Atualizar agendamento</DialogTitle>
            <DialogDescription>
              Digite o nome do cliente e selecione para editar o agendamento.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar cliente por nome ou CNPJ…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[45vh] overflow-y-auto -mx-1 px-1">
            {!busca.trim() ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Comece digitando para ver os clientes.
              </p>
            ) : resultados.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum agendamento encontrado.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {resultados.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => handleSelecionar(a)}
                      className="w-full text-left rounded-lg border p-3 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug break-words">
                            {a.cliente.nome}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 shrink-0" />
                            {a.dataReposicao ? format(a.dataReposicao, "dd/MM/yyyy") : "Sem data"}
                            {" • "}
                            {a.pedido?.totalPedidoUnidades ?? a.cliente.quantidadePadrao ?? 0} un
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {a.statusAgendamento}
                        </Badge>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <EditPermissionProvider value={{ canEdit: true }}>
        <AgendamentoEditModal
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) setSelecionado(null);
          }}
          agendamento={selecionado}
          onSalvar={() => {
            carregarTodosAgendamentos();
            onSalvo?.();
          }}
        />
      </EditPermissionProvider>
    </>
  );
}
