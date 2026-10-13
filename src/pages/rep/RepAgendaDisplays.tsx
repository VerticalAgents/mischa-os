import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AgendamentoDashboard from "@/components/agendamento/AgendamentoDashboard";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";
import { ClienteDeDisplays, listarClientesDeDisplays } from "@/services/pedidos/pedidoDisplays";

/**
 * A agenda de quem vende em displays: a semana com os previstos e os confirmados,
 * no molde da agenda de sempre. Aqui só se olha: abrir um cliente leva ao
 * formulário de displays, na tela de Pedidos.
 */
export default function RepAgendaDisplays() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteDeDisplays[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    listarClientesDeDisplays()
      .then(setClientes)
      .catch((e) => console.error("Erro ao carregar clientes:", e));
  }, []);

  const abrirPedido = (clienteId: string) => navigate(`/rep/pedidos?cliente=${clienteId}`);

  const achados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return clientes.filter((c) => c.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [busca, clientes]);

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
                  onClick={() => abrirPedido(c.id)}
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
          onEditarAgendamento={(agendamento) => abrirPedido(agendamento.cliente.id)}
        />
      </EditPermissionProvider>
    </div>
  );
}
