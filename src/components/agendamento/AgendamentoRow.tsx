
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClienteStore } from "@/hooks/useClienteStore";
import AgendamentoActions from "./AgendamentoActions";

interface AgendamentoItem {
  cliente: { 
    id: number; 
    nome: string; 
    contatoNome?: string; 
    contatoTelefone?: string;
    quantidadePadrao?: number;
  };
  pedido?: any;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

interface AgendamentoRowProps {
  agendamento: AgendamentoItem;
  index: number;
  onEdit: (agendamento: AgendamentoItem) => void;
}

export default function AgendamentoRow({ agendamento, index, onEdit }: AgendamentoRowProps) {
  const navigate = useNavigate();
  const { selecionarCliente } = useClienteStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Previsto": return "bg-amber-500";
      case "Agendado": return "bg-green-500";
      case "Reagendar": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getTipoPedidoColor = (tipoPedido?: string) => {
    switch (tipoPedido) {
      case "Padrão": return "bg-green-100 text-green-800";
      case "Alterado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleRedirectToCliente = (e: React.MouseEvent) => {
    e.stopPropagation();
    selecionarCliente(agendamento.cliente.id.toString());
    navigate(`/clientes`);
  };

  return (
    <TableRow 
      key={`${agendamento.cliente.id}-${index}`}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onEdit(agendamento)}
    >
      <TableCell className="font-medium">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span>{agendamento.cliente.nome}</span>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-6 w-6 opacity-60 hover:opacity-100"
                onClick={handleRedirectToCliente}
                title="Ver informações do cliente"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            {!agendamento.isPedidoUnico && agendamento.cliente.contatoNome && (
              <div className="text-xs text-muted-foreground">
                {agendamento.cliente.contatoNome}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {format(agendamento.dataReposicao, 'dd/MM/yyyy')}
      </TableCell>
      <TableCell>
        <Badge className={`${getStatusColor(agendamento.statusAgendamento)} text-white`}>
          {agendamento.statusAgendamento}
        </Badge>
      </TableCell>
      <TableCell>
        {agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao || 0} un
      </TableCell>
      <TableCell>
        <Badge variant={agendamento.isPedidoUnico ? "destructive" : "default"}>
          {agendamento.isPedidoUnico ? "Pedido Único" : "PDV"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={getTipoPedidoColor(agendamento.pedido?.tipoPedido)}>
          {agendamento.pedido?.tipoPedido || "Padrão"}
        </Badge>
      </TableCell>
      <TableCell>
        <AgendamentoActions agendamento={agendamento} />
      </TableCell>
    </TableRow>
  );
}
