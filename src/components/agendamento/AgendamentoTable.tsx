
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AgendamentoRow from "./AgendamentoRow";
import { Cliente } from "@/hooks/useClientesSupabase";

interface AgendamentoItem {
  cliente: Cliente;
  pedido?: any;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

interface AgendamentoTableProps {
  agendamentos: AgendamentoItem[];
  onEditAgendamento: (agendamento: AgendamentoItem) => void;
}

export default function AgendamentoTable({ agendamentos, onEditAgendamento }: AgendamentoTableProps) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PDV / Cliente</TableHead>
            <TableHead>Data da Reposição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Tipo de Pedido</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agendamentos.map((agendamento, index) => (
            <AgendamentoRow
              key={`${agendamento.cliente.id}-${index}`}
              agendamento={agendamento}
              index={index}
              onEdit={onEditAgendamento}
            />
          ))}
        </TableBody>
      </Table>
      
      {agendamentos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum agendamento encontrado para esta categoria</p>
        </div>
      )}
    </>
  );
}
