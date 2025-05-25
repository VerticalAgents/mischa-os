
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Cliente } from "@/hooks/useClientesSupabase";
import { Pedido, TipoPedido } from "@/types";
import { StatusConfirmacao } from "@/hooks/useStatusAgendamentoStore";
import ConfirmacaoActions from "./ConfirmacaoActions";
import StatusCriticoBadge from "./StatusCriticoBadge";
import AcoesEmLote from "./AcoesEmLote";
import ExportacaoButtons from "./ExportacaoButtons";

interface ClienteExportacao extends Cliente {
  statusConfirmacao: string;
  dataReposicao: Date;
  tipoPedido: TipoPedido;
  observacoes: string;
}

interface ClienteTableProps {
  statusId: number;
  status: StatusConfirmacao;
  clientesWithStatus: Cliente[];
  pedidosCliente: {[key: string]: Pedido};
  observacoes: {[key: string]: string};
  setObservacoes: (obs: {[key: string]: string}) => void;
  onNoReplenishment: (cliente: Cliente) => void;
  onStatusChange: (cliente: Cliente, novoStatus: string, observacao?: string) => void;
  moveClientToStatus: (cliente: Cliente, newStatusId: number) => void;
  handleAcaoEmLote: (clientesAfetados: Cliente[], novoStatus: string) => void;
}

export default function ClienteTable({
  statusId,
  status,
  clientesWithStatus,
  pedidosCliente,
  observacoes,
  setObservacoes,
  onNoReplenishment,
  onStatusChange,
  moveClientToStatus,
  handleAcaoEmLote
}: ClienteTableProps) {
  
  if (clientesWithStatus.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum cliente nesta categoria</p>
      </div>
    );
  }

  // Preparar dados para exportação
  const prepararDadosExportacao = (): ClienteExportacao[] => {
    return clientesWithStatus.map(cliente => ({
      ...cliente,
      statusConfirmacao: status?.nome || "Não definido",
      dataReposicao: cliente.proxima_data_reposicao ? new Date(cliente.proxima_data_reposicao) : new Date(),
      tipoPedido: (pedidosCliente[cliente.id]?.tipoPedido || "Padrão") as TipoPedido,
      observacoes: observacoes[cliente.id] || ""
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header com ações em lote e exportação */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {/* Ações em lote */}
          {status?.acaoRequerida && (
            <>
              {statusId === 1 && (
                <AcoesEmLote
                  clientes={clientesWithStatus}
                  tipoAcao="marcar-contatados"
                  onAcaoExecutada={handleAcaoEmLote}
                />
              )}
              {statusId === 4 && (
                <AcoesEmLote
                  clientes={clientesWithStatus}
                  tipoAcao="segundo-contato"
                  onAcaoExecutada={handleAcaoEmLote}
                />
              )}
            </>
          )}
        </div>
        
        {/* Botão de exportação */}
        <ExportacaoButtons 
          clientes={prepararDadosExportacao()}
          filtroAtivo={status?.nome || "Lista"}
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PDV</TableHead>
            <TableHead>Data Prevista</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientesWithStatus.map((cliente) => {
            const dataReposicao = cliente.proxima_data_reposicao ? new Date(cliente.proxima_data_reposicao) : new Date();
            
            return (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{cliente.nome}</span>
                    <StatusCriticoBadge 
                      status={status?.nome || ""}
                      dataReposicao={dataReposicao}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {cliente.proxima_data_reposicao ? 
                    format(new Date(cliente.proxima_data_reposicao), 'dd/MM/yyyy') : 
                    'Não definida'}
                </TableCell>
                <TableCell>
                  {cliente.contato_nome || 'N/A'}
                  <div className="text-xs text-muted-foreground">
                    {cliente.contato_telefone || 'Sem telefone'}
                  </div>
                </TableCell>
                <TableCell>
                  <Textarea
                    value={observacoes[cliente.id] || ''}
                    onChange={(e) => setObservacoes({
                      ...observacoes,
                      [cliente.id]: e.target.value
                    })}
                    placeholder="Adicionar observações..."
                    className="min-h-[80px] text-xs"
                  />
                </TableCell>
                <TableCell>
                  <ConfirmacaoActions
                    cliente={cliente}
                    statusNome={status?.nome || "Não definido"}
                    statusId={statusId}
                    observacoes={observacoes}
                    setObservacoes={setObservacoes}
                    onNoReplenishment={onNoReplenishment}
                    onStatusChange={onStatusChange}
                    moveClientToStatus={moveClientToStatus}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
