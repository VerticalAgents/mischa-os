
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Cliente } from "@/hooks/useClientesSupabase";
import { Pedido, TipoPedido } from "@/types";
import { StatusConfirmacao } from "@/hooks/useStatusAgendamentoStore";
import ClienteTable from "./ClienteTable";

interface ClienteExportacao extends Cliente {
  statusConfirmacao: string;
  dataReposicao: Date;
  tipoPedido: TipoPedido;
  observacoes: string;
}

interface StatusTabsProps {
  tabValue: string;
  setTabValue: (value: string) => void;
  statusRequiringAction: StatusConfirmacao[];
  statusWithoutAction: StatusConfirmacao[];
  clientesPorStatus: {[key: number]: Cliente[]};
  pedidosCliente: {[key: string]: Pedido};
  observacoes: {[key: string]: string};
  setObservacoes: (obs: {[key: string]: string}) => void;
  onNoReplenishment: (cliente: Cliente) => void;
  onStatusChange: (cliente: Cliente, novoStatus: string, observacao?: string) => void;
  moveClientToStatus: (cliente: Cliente, newStatusId: number) => void;
  handleAcaoEmLote: (clientesAfetados: Cliente[], novoStatus: string) => void;
}

export default function StatusTabs({
  tabValue,
  setTabValue,
  statusRequiringAction,
  statusWithoutAction,
  clientesPorStatus,
  pedidosCliente,
  observacoes,
  setObservacoes,
  onNoReplenishment,
  onStatusChange,
  moveClientToStatus,
  handleAcaoEmLote
}: StatusTabsProps) {
  
  // Get counts for each status
  const getStatusCount = (statusId: number) => {
    return clientesPorStatus[statusId]?.length || 0;
  };

  return (
    <Tabs defaultValue="hoje" value={tabValue} onValueChange={setTabValue} className="w-full">
      <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
        <TabsTrigger value="hoje">Necessitam Ação</TabsTrigger>
        <TabsTrigger value="pendentes">Em Acompanhamento</TabsTrigger>
      </TabsList>
      
      <TabsContent value="hoje">
        <div className="space-y-8">
          {statusRequiringAction.map(status => (
            <div key={status.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Badge style={{ backgroundColor: status.cor }} className="text-white">
                    {status.nome}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({getStatusCount(status.id)} cliente{getStatusCount(status.id) !== 1 ? 's' : ''})
                  </span>
                </h3>
              </div>
              
              <ClienteTable
                statusId={status.id}
                status={status}
                clientesWithStatus={clientesPorStatus[status.id] || []}
                pedidosCliente={pedidosCliente}
                observacoes={observacoes}
                setObservacoes={setObservacoes}
                onNoReplenishment={onNoReplenishment}
                onStatusChange={onStatusChange}
                moveClientToStatus={moveClientToStatus}
                handleAcaoEmLote={handleAcaoEmLote}
              />
            </div>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="pendentes">
        <div className="space-y-8">
          {statusWithoutAction.map(status => (
            <div key={status.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Badge style={{ backgroundColor: status.cor }} className="text-white">
                    {status.nome}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({getStatusCount(status.id)} cliente{getStatusCount(status.id) !== 1 ? 's' : ''})
                  </span>
                </h3>
              </div>
              
              <ClienteTable
                statusId={status.id}
                status={status}
                clientesWithStatus={clientesPorStatus[status.id] || []}
                pedidosCliente={pedidosCliente}
                observacoes={observacoes}
                setObservacoes={setObservacoes}
                onNoReplenishment={onNoReplenishment}
                onStatusChange={onStatusChange}
                moveClientToStatus={moveClientToStatus}
                handleAcaoEmLote={handleAcaoEmLote}
              />
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
