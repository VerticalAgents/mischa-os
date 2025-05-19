
import { useState, useEffect } from "react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useStatusAgendamentoStore, StatusConfirmacao } from "@/hooks/useStatusAgendamentoStore";
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
import { MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Cliente, Pedido } from "@/types";

export default function ConfirmacaoReposicao() {
  const { clientes } = useClienteStore();
  const { getPedidosFiltrados, getPedidosFuturos } = usePedidoStore();
  const { statusConfirmacao } = useStatusAgendamentoStore();
  const [clientesporStatus, setClientesPorStatus] = useState<{[key: number]: Cliente[]}>({});
  const [pedidosCliente, setPedidosCliente] = useState<{[key: number]: Pedido}>({});
  const [observacoes, setObservacoes] = useState<{[key: number]: string}>({});
  const [tabValue, setTabValue] = useState("hoje");

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
    
    // Organize clients by status
    const clientesPorStatusTemp: {[key: number]: Cliente[]} = {};
    
    // Initialize all status arrays
    statusConfirmacao.forEach(status => {
      clientesPorStatusTemp[status.id] = [];
    });
    
    // Assign clients to status
    Object.values(clientesComPedidos).forEach(cliente => {
      const statusId = getClienteStatusConfirmacao(cliente);
      if (statusId > 0 && clientesPorStatusTemp[statusId]) {
        clientesPorStatusTemp[statusId].push(cliente);
      }
    });
    
    setClientesPorStatus(clientesPorStatusTemp);
    setPedidosCliente(pedidosPorCliente);
  }, [clientes, getPedidosFuturos, statusConfirmacao]);

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
      `Olá ${cliente.contatoNome || cliente.nome}, gostaria de confirmar a reposição para ${nextDate}. Podemos manter essa data?`
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

  // Function to handle marking as 'will not replenish'
  const handleNoReplenishment = (cliente: Cliente) => {
    // In a real app, this would integrate with the client and pedido stores
    toast({
      title: "Status atualizado",
      description: `${cliente.nome} marcado para reagendamento`,
    });
    
    // Update observations
    const now = new Date();
    const obsText = observacoes[cliente.id] || '';
    const newObs = `${format(now, 'dd/MM HH:mm')} - Cliente não será reposto, marcado para reagendamento\n${obsText}`;
    
    setObservacoes({
      ...observacoes,
      [cliente.id]: newObs
    });
  };

  // Function to move client to another status
  const moveClientToStatus = (cliente: Cliente, newStatusId: number) => {
    // This would update the client's status in a real application
    toast({
      title: "Status atualizado",
      description: `${cliente.nome} movido para ${statusConfirmacao.find(s => s.id === newStatusId)?.nome}`,
    });
  };

  // Render client list for a specific status
  const renderClientList = (statusId: number) => {
    const clientesWithStatus = clientesporStatus[statusId] || [];
    
    if (clientesWithStatus.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum cliente nesta categoria</p>
        </div>
      );
    }
    
    return (
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
            
            return (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nome}</TableCell>
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
          <CardTitle>Confirmação de Reposição</CardTitle>
          <CardDescription>
            Gerencie o contato com PDVs para confirmar reposições agendadas
          </CardDescription>
        </CardHeader>
        <CardContent>
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
    </div>
  );
}
