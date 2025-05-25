import { useState, useEffect } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useStatusAgendamentoStore, StatusConfirmacao } from "@/hooks/useStatusAgendamentoStore";
import { useAutomacaoStatus } from "@/hooks/useAutomacaoStatus";
import { addDays, format, isWeekend, isBefore, differenceInBusinessDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { MessageSquare, CheckCircle, XCircle, Clock, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Cliente, Pedido } from "@/types";
import ReagendamentoDialog from "./ReagendamentoDialog";
import FiltrosLocalizacao from "./FiltrosLocalizacao";
import ReclassificacaoStatus from "./ReclassificacaoStatus";
import AcoesEmLote from "./AcoesEmLote";
import ExportacaoButtons from "./ExportacaoButtons";
import StatusCriticoBadge from "./StatusCriticoBadge";

interface AgendamentoItem {
  cliente: { id: number; nome: string; contatoNome?: string; contatoTelefone?: string };
  pedido?: any;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

export default function ConfirmacaoReposicao() {
  const { clientes, atualizarCliente } = useClienteStore();
  const { getPedidosFiltrados, getPedidosFuturos, atualizarPedido } = usePedidoStore();
  const { statusConfirmacao } = useStatusAgendamentoStore();
  const { confirmarEntrega } = useAutomacaoStatus(); // Usar hook de automação
  const [clientesporStatus, setClientesPorStatus] = useState<{[key: number]: Cliente[]}>({});
  const [pedidosCliente, setPedidosCliente] = useState<{[key: number]: Pedido}>({});
  const [observacoes, setObservacoes] = useState<{[key: string]: string}>({});
  const [tabValue, setTabValue] = useState("hoje");
  const [filtros, setFiltros] = useState<{ rota?: string; cidade?: string }>({});

  // State for reagendamento dialog
  const [reagendamentoDialogOpen, setReagendamentoDialogOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  // Simulated function to get status - in a real app, this would come from the client data
  const getClienteStatusConfirmacao = (cliente: Cliente): number => {
    // Para fins de simulação, vamos distribuir os clientes entre os status
    if (!cliente.proximaDataReposicao) return 0;
    
    const hoje = new Date();
    const dataReposicao = new Date(cliente.proximaDataReposicao);
    const diferencaDias = differenceInBusinessDays(dataReposicao, hoje);
    
    // Lógica para simular status baseado na proximidade da data
    if (diferencaDias === 2) return 1; // Contato necessário hoje
    if (diferencaDias < 0) return 2; // Atrasado
    if (diferencaDias === 1) return 3; // Contatado, sem resposta
    if (diferencaDias > 5) return 7; // Confirmado
    
    // Distribuir alguns clientes pelos outros status para demonstração
    const randomStatus = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
    return Math.random() > 0.7 ? randomStatus : 7;
  };

  // Organize clients by confirmation status
  useEffect(() => {
    const pedidosFuturos = getPedidosFuturos();
    const clientesComPedidos: {[key: number]: Cliente} = {};
    const pedidosPorCliente: {[key: number]: Pedido} = {};
    
    // Map pedidos to clientes
    pedidosFuturos.forEach(pedido => {
      if (pedido.cliente) {
        clientesComPedidos[pedido.idCliente] = pedido.cliente;
        pedidosPorCliente[pedido.idCliente] = pedido;
      }
    });
    
    // Aplicar filtros de localização
    let clientesFiltrados = Object.values(clientesComPedidos);
    
    if (filtros.rota || filtros.cidade) {
      clientesFiltrados = clientesFiltrados.filter(cliente => {
        // Simulação de filtro por rota/cidade - em implementação real viria dos dados do cliente
        const rotaCliente = ["Rota Centro", "Rota Norte", "Rota Sul"][cliente.id % 3];
        const cidadeCliente = ["São Paulo", "Guarulhos", "Osasco"][cliente.id % 3];
        
        const rotaMatch = !filtros.rota || rotaCliente === filtros.rota;
        const cidadeMatch = !filtros.cidade || cidadeCliente === filtros.cidade;
        
        return rotaMatch && cidadeMatch;
      });
    }
    
    // Organize clients by status
    const clientesPorStatusTemp: {[key: number]: Cliente[]} = {};
    
    // Initialize all status arrays
    statusConfirmacao.forEach(status => {
      clientesPorStatusTemp[status.id] = [];
    });
    
    // Assign clients to status
    clientesFiltrados.forEach(cliente => {
      const statusId = getClienteStatusConfirmacao(cliente);
      if (statusId > 0 && clientesPorStatusTemp[statusId]) {
        clientesPorStatusTemp[statusId].push(cliente);
      }
    });
    
    setClientesPorStatus(clientesPorStatusTemp);
    setPedidosCliente(pedidosPorCliente);
  }, [clientes, getPedidosFuturos, statusConfirmacao, filtros]);

  // Function to handle WhatsApp message
  const handleWhatsAppClick = (cliente: Cliente) => {
    if (!cliente.contatoTelefone) {
      toast({
        title: "Número não disponível",
        description: "Este cliente não possui número de telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }
    
    // Format phone number for WhatsApp
    let phone = cliente.contatoTelefone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('55')) phone = '55' + phone;
    
    // Get the client's next replenishment date
    const nextDate = cliente.proximaDataReposicao 
      ? format(new Date(cliente.proximaDataReposicao), 'dd/MM/yyyy') 
      : 'data a definir';
    
    // Create message
    const message = encodeURIComponent(
      `Olá ${cliente.nome}, tudo bem? Gostaríamos de confirmar a entrega prevista para o dia ${nextDate}. Por favor, nos confirme a necessidade da reposição.`
    );
    
    // Open WhatsApp
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    // Update observations record
    const now = new Date();
    const obsText = observacoes[cliente.id] || '';
    const newObs = `${format(now, 'dd/MM HH:mm')} - Mensagem enviada via WhatsApp\n${obsText}`;
    
    setObservacoes({
      ...observacoes,
      [cliente.id]: newObs
    });
    
    toast({
      title: "WhatsApp aberto",
      description: `Mensagem preparada para ${cliente.nome}`,
    });
  };

  // Function to open rescheduling dialog
  const handleNoReplenishment = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setReagendamentoDialogOpen(true);
  };

  // Função atualizada para confirmar entrega com automação de status
  const handleConfirmarEntrega = (cliente: Cliente) => {
    // Usar o hook de automação para confirmar e atualizar status automaticamente
    confirmarEntrega(cliente.id);
    
    // Atualizar observações
    const now = new Date();
    const obsText = observacoes[cliente.id] || '';
    const newObs = `${format(now, 'dd/MM HH:mm')} - Entrega confirmada - Status atualizado para "Confirmado"\n${obsText}`;
    
    setObservacoes({
      ...observacoes,
      [cliente.id]: newObs
    });
    
    toast({
      title: "Entrega confirmada",
      description: `${cliente.nome} confirmado e status atualizado automaticamente`,
    });
  };

  // Function to handle rescheduling confirmation
  const handleReagendamentoConfirm = (cliente: Cliente, novaData: Date) => {
    // 1. Update the client's next replenishment date
    const clienteAtualizado = { ...cliente, proximaDataReposicao: novaData };
    atualizarCliente(cliente.id, clienteAtualizado);
    
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

  // Preparar dados para exportação
  const prepararDadosExportacao = (statusId: number) => {
    const clientesStatus = clientesporStatus[statusId] || [];
    return clientesStatus.map(cliente => ({
      ...cliente,
      statusConfirmacao: statusConfirmacao.find(s => s.id === statusId)?.nome || "Não definido",
      dataReposicao: cliente.proximaDataReposicao ? new Date(cliente.proximaDataReposicao) : new Date(),
      tipoPedido: pedidosCliente[cliente.id]?.tipoPedido || "Padrão",
      observacoes: observacoes[cliente.id] || ""
    }));
  };

  // Render client list for a specific status
  const renderClientList = (statusId: number) => {
    const clientesWithStatus = clientesporStatus[statusId] || [];
    const status = statusConfirmacao.find(s => s.id === statusId);
    
    if (clientesWithStatus.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum cliente nesta categoria</p>
        </div>
      );
    }
    
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
            clientes={prepararDadosExportacao(statusId)}
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
              const pedido = pedidosCliente[cliente.id];
              const dataReposicao = cliente.proximaDataReposicao ? new Date(cliente.proximaDataReposicao) : new Date();
              
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
                    {cliente.proximaDataReposicao ? 
                      format(new Date(cliente.proximaDataReposicao), 'dd/MM/yyyy') : 
                      'Não definida'}
                  </TableCell>
                  <TableCell>
                    {cliente.contatoNome || 'N/A'}
                    <div className="text-xs text-muted-foreground">
                      {cliente.contatoTelefone || 'Sem telefone'}
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
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center gap-1"
                        onClick={() => handleWhatsAppClick(cliente)}
                      >
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <span>WhatsApp</span>
                      </Button>
                      
                      {/* Botão de confirmar entrega com automação */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center gap-1"
                        onClick={() => handleConfirmarEntrega(cliente)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Confirmar Entrega</span>
                      </Button>
                      
                      <ReclassificacaoStatus
                        cliente={cliente}
                        statusAtual={status?.nome || "Não definido"}
                        onStatusChange={(novoStatus, observacao) => handleStatusChange(cliente, novoStatus, observacao)}
                      />
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center gap-1 text-muted-foreground"
                        onClick={() => handleNoReplenishment(cliente)}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Não será reposto</span>
                      </Button>
                      
                      {statusId === 1 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full flex items-center gap-1"
                          onClick={() => moveClientToStatus(cliente, 3)}
                        >
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span>Aguardando resposta</span>
                        </Button>
                      )}
                      
                      {(statusId === 3 || statusId === 4) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full flex items-center gap-1"
                          onClick={() => moveClientToStatus(cliente, 7)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Confirmado</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Get counts for each status
  const getStatusCount = (statusId: number) => {
    return clientesporStatus[statusId]?.length || 0;
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
              clientes={Object.values(clientesporStatus).flat().map(cliente => ({
                ...cliente,
                statusConfirmacao: "Todos",
                dataReposicao: cliente.proximaDataReposicao ? new Date(cliente.proximaDataReposicao) : new Date(),
                tipoPedido: pedidosCliente[cliente.id]?.tipoPedido || "Padrão",
                observacoes: observacoes[cliente.id] || ""
              }))}
              filtroAtivo="Todos"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros de localização */}
          <FiltrosLocalizacao onFiltroChange={setFiltros} />
          
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
                    
                    {renderClientList(status.id)}
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
                    
                    {renderClientList(status.id)}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
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
