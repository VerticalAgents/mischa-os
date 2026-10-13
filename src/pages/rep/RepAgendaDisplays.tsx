import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AgendamentoDashboard from "@/components/agendamento/AgendamentoDashboard";
import FormularioPedidoDisplays from "@/components/rep/pedidos/FormularioPedidoDisplays";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import {
  ClienteDeDisplays,
  PedidoDoCliente,
  listarClientesDeDisplays,
  listarPedidos,
} from "@/services/pedidos/pedidoDisplays";

interface PedidoAberto {
  cliente: ClienteDeDisplays;
  pedido?: PedidoDoCliente;
}

/**
 * A agenda de quem vende em displays: a semana com os previstos e os confirmados,
 * no molde da agenda de sempre. Editar um cliente abre o formulário de displays num
 * modal, sem sair da agenda; pedido já separado abre só com o aviso.
 */
export default function RepAgendaDisplays() {
  const { carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const [clientes, setClientes] = useState<ClienteDeDisplays[]>([]);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<PedidoAberto | null>(null);

  useEffect(() => {
    listarClientesDeDisplays()
      .then(setClientes)
      .catch((e) => console.error("Erro ao carregar clientes:", e));
  }, []);

  const abrirPedido = async (cliente: ClienteDeDisplays) => {
    try {
      // Lê o pedido na hora: a fábrica pode ter separado desde que a agenda foi carregada.
      const [pedido] = await listarPedidos([cliente.id]);
      setAberto({ cliente, pedido });
      setBusca("");
    } catch (e) {
      console.error("Erro ao abrir o pedido:", e);
      toast.error("Não consegui abrir o pedido deste cliente.");
    }
  };

  const achados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return clientes.filter((c) => c.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [busca, clientes]);

  const status = aberto?.pedido?.status;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Agendamentos</h1>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11"
            placeholder="Digite o nome do cliente para abrir o pedido"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        {busca.trim() !== "" &&
          (achados.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">Nenhum cliente com esse nome.</p>
          ) : (
            <div className="space-y-1">
              {achados.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => abrirPedido(c)}
                  className="w-full text-left rounded-lg border bg-card px-4 py-3 min-h-11 font-medium hover:bg-accent transition-colors"
                >
                  {c.nome}
                </button>
              ))}
            </div>
          ))}
      </div>

      <EditPermissionProvider value={{ canEdit: true }}>
        <AgendamentoDashboard
          hideExportPDF
          repMode
          onEditarAgendamento={(agendamento) =>
            abrirPedido({ id: agendamento.cliente.id, nome: agendamento.cliente.nome })
          }
        />
      </EditPermissionProvider>

      <Dialog open={!!aberto} onOpenChange={(v) => !v && setAberto(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{aberto?.cliente.nome}</DialogTitle>
            <DialogDescription>
              {status === "Agendado" ? "Alterar pedido" : status === "Previsto" ? "Confirmar pedido" : "Novo pedido"}
            </DialogDescription>
          </DialogHeader>
          {aberto && (
            <FormularioPedidoDisplays
              key={aberto.cliente.id}
              cliente={aberto.cliente}
              pedidoAtual={aberto.pedido}
              aoSalvar={async () => {
                setAberto(null);
                await carregarTodosAgendamentos();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
