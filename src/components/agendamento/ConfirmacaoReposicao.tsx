
import { useState } from "react";
import { useClientesSupabase } from "@/hooks/useClientesSupabase";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { TipoPedido } from "@/types";
import ReagendamentoDialog from "./ReagendamentoDialog";
import FiltrosLocalizacao from "./FiltrosLocalizacao";
import ExportacaoButtons from "./ExportacaoButtons";
import StatusTabs from "./StatusTabs";
import { useClienteStatusConfirmacao } from "@/hooks/useClienteStatusConfirmacao";
import { Cliente } from "@/hooks/useClientesSupabase";

// Type for exportation data that matches what ExportacaoButtons expects
interface ClienteExportacao extends Cliente {
  statusConfirmacao: string;
  dataReposicao: Date;
  tipoPedido: TipoPedido;
  observacoes: string;
}

export default function ConfirmacaoReposicao() {
  const { updateCliente } = useClientesSupabase();
  const { atualizarPedido } = usePedidoStore();
  const [observacoes, setObservacoes] = useState<{[key: string]: string}>({});
  const [tabValue, setTabValue] = useState("hoje");
  const [filtros, setFiltros] = useState<{ rota?: string; cidade?: string }>({});

  // Use the custom hook for status management
  const { clientesPorStatus, pedidosCliente, statusConfirmacao } = useClienteStatusConfirmacao(filtros);

  // State for reagendamento dialog
  const [reagendamentoDialogOpen, setReagendamentoDialogOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  // Function to open rescheduling dialog
  const handleNoReplenishment = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setReagendamentoDialogOpen(true);
  };

  // Function to handle rescheduling confirmation
  const handleReagendamentoConfirm = async (cliente: Cliente, novaData: Date) => {
    try {
      // 1. Update the client's next replenishment date
      await updateCliente(cliente.id, { proxima_data_reposicao: novaData.toISOString().split('T')[0] });
      
      // 2. Update the order's expected delivery date if it exists
      const pedido = pedidosCliente[cliente.id];
      if (pedido) {
        atualizarPedido(pedido.id, { dataPrevistaEntrega: novaData });
      }
      
      // 3. Update observations
      const now = new Date();
      const obsText = observacoes[cliente.id] || '';
      const newObs = `${format(now, 'dd/MM HH:mm')} - Cliente reagendado para ${format(novaData, 'dd/MM/yyyy')}\n${obsText}`;
      
      setObservacoes({
        ...observacoes,
        [cliente.id]: newObs
      });
      
      // 4. Close the dialog
      setReagendamentoDialogOpen(false);
      setClienteSelecionado(null);
      
      // 5. Show success toast
      toast({
        title: "Reagendamento realizado",
        description: `${cliente.nome} reagendado para ${format(novaData, 'dd/MM/yyyy')}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reagendar cliente",
        variant: "destructive"
      });
    }
  };

  // Function to handle status change
  const handleStatusChange = (cliente: Cliente, novoStatus: string, observacao?: string) => {
    // Update client status in real implementation
    const now = new Date();
    const obsText = observacoes[cliente.id] || '';
    const newObs = `${format(now, 'dd/MM HH:mm')} - Status alterado para "${novoStatus}"${observacao ? ` - ${observacao}` : ''}\n${obsText}`;
    
    setObservacoes({
      ...observacoes,
      [cliente.id]: newObs
    });
  };

  // Function to handle bulk actions
  const handleAcaoEmLote = (clientesAfetados: Cliente[], novoStatus: string) => {
    const now = new Date();
    const novosObservacoes = { ...observacoes };
    
    clientesAfetados.forEach(cliente => {
      const obsText = novosObservacoes[cliente.id] || '';
      const newObs = `${format(now, 'dd/MM HH:mm')} - Ação em lote: "${novoStatus}"\n${obsText}`;
      novosObservacoes[cliente.id] = newObs;
    });
    
    setObservacoes(novosObservacoes);
  };

  // Function to move client to another status
  const moveClientToStatus = (cliente: Cliente, newStatusId: number) => {
    const statusNome = statusConfirmacao.find(s => s.id === newStatusId)?.nome;
    
    toast({
      title: "Status atualizado",
      description: `${cliente.nome} movido para ${statusNome}`,
    });
  };

  // Get action required statuses
  const statusRequiringAction = statusConfirmacao.filter(s => s.acaoRequerida);
  const statusWithoutAction = statusConfirmacao.filter(s => !s.acaoRequerida);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Confirmação de Reposição</CardTitle>
              <CardDescription>
                Gerencie o contato com PDVs para confirmar reposições agendadas
              </CardDescription>
            </div>
            {/* Botão de exportação geral no header */}
            <ExportacaoButtons 
              clientes={Object.values(clientesPorStatus).flat().map(cliente => ({
                ...cliente,
                statusConfirmacao: "Todos",
                dataReposicao: cliente.proxima_data_reposicao ? new Date(cliente.proxima_data_reposicao) : new Date(),
                tipoPedido: (pedidosCliente[cliente.id]?.tipoPedido || "Padrão") as TipoPedido,
                observacoes: observacoes[cliente.id] || ""
              }))}
              filtroAtivo="Todos"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros de localização */}
          <FiltrosLocalizacao onFiltroChange={setFiltros} />
          
          <StatusTabs
            tabValue={tabValue}
            setTabValue={setTabValue}
            statusRequiringAction={statusRequiringAction}
            statusWithoutAction={statusWithoutAction}
            clientesPorStatus={clientesPorStatus}
            pedidosCliente={pedidosCliente}
            observacoes={observacoes}
            setObservacoes={setObservacoes}
            onNoReplenishment={handleNoReplenishment}
            onStatusChange={handleStatusChange}
            moveClientToStatus={moveClientToStatus}
            handleAcaoEmLote={handleAcaoEmLote}
          />
        </CardContent>
      </Card>
      
      {/* Reagendamento Dialog */}
      {clienteSelecionado && (
        <ReagendamentoDialog
          cliente={clienteSelecionado}
          isOpen={reagendamentoDialogOpen}
          onClose={() => {
            setReagendamentoDialogOpen(false);
            setClienteSelecionado(null);
          }}
          onConfirm={handleReagendamentoConfirm}
        />
      )}
    </div>
  );
}
