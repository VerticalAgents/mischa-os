
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
  const { confirmarEntrega } = useAutomacaoStatus();
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
    if (!cliente.contatoTelefone && !cliente.telefone) {
      toast({
        title: "Número não disponível",
        description: "Este cliente não possui número de telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }
    
    // Format phone number for WhatsApp
    const telefone = cliente.contatoTelefone || cliente.telefone || '';
    let phone = telefone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('55')) phone = '55' + phone;
    
    const message = encodeURIComponent(`Olá! Gostaria de confirmar o agendamento da sua próxima reposição.`);
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Function to handle status change
  const handleStatusChange = (cliente: Cliente, novoStatus: number) => {
    // Simulate status update
    toast({
      title: "Status atualizado",
      description: `Status do cliente ${cliente.nome} atualizado com sucesso.`,
    });
  };

  // Function to handle observation change
  const handleObservationChange = (clienteId: number, observacao: string) => {
    setObservacoes(prev => ({
      ...prev,
      [clienteId]: observacao
    }));
  };

  // Function to save observation
  const handleSaveObservation = (clienteId: number) => {
    const observacao = observacoes[clienteId];
    if (observacao) {
      // Update client with observation
      atualizarCliente(clienteId, {
        proximaDataReposicao: format(new Date(), 'yyyy-MM-dd'),
        observacoes: observacao
      });
      
      toast({
        title: "Observação salva",
        description: "Observação salva com sucesso.",
      });
    }
  };

  // Function to handle reagendamento
  const handleReagendar = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setReagendamentoDialogOpen(true);
  };

  const handleReagendamentoConfirm = (novaData: Date) => {
    if (clienteSelecionado) {
      atualizarCliente(clienteSelecionado.id, {
        proximaDataReposicao: format(novaData, 'yyyy-MM-dd')
      });
      
      toast({
        title: "Reagendamento realizado",
        description: `Reagendamento para ${clienteSelecionado.nome} realizado com sucesso.`,
      });
    }
    setReagendamentoDialogOpen(false);
    setClienteSelecionado(null);
  };

  // Render status tabs
  const renderStatusTabs = () => {
    return (
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList className="grid w-full grid-cols-8">
          {statusConfirmacao.map((status) => (
            <TabsTrigger key={status.id} value={status.id.toString()}>
              <div className="flex items-center gap-2">
                <status.icon className="h-4 w-4" />
                <span className="hidden md:inline">{status.nome}</span>
                <Badge variant="secondary" className="ml-1">
                  {clientesporStatus[status.id]?.length || 0}
                </Badge>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {statusConfirmacao.map((status) => (
          <TabsContent key={status.id} value={status.id.toString()}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <status.icon className="h-5 w-5" />
                  {status.nome}
                </CardTitle>
                <CardDescription>{status.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Data Próxima Reposição</TableHead>
                      <TableHead>Quantidade Padrão</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesporStatus[status.id]?.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cliente.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              {cliente.cnpjCpf}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{cliente.contatoNome || '-'}</div>
                            <div className="text-sm text-muted-foreground">
                              {cliente.contatoTelefone || cliente.telefone || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cliente.proximaDataReposicao 
                            ? format(new Date(cliente.proximaDataReposicao), 'dd/MM/yyyy')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {cliente.quantidadePadrao}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={observacoes[cliente.id] || ''}
                            onChange={(e) => handleObservationChange(cliente.id, e.target.value)}
                            placeholder="Adicionar observação..."
                            className="min-h-[60px] max-w-[200px]"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWhatsAppClick(cliente)}
                              className="h-8 w-8 p-0"
                              title="Enviar WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReagendar(cliente)}
                              className="h-8 w-8 p-0"
                              title="Reagendar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveObservation(cliente.id)}
                              className="h-8 w-8 p-0"
                              title="Salvar observação"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Nenhum cliente neste status
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Confirmação de Reposição</CardTitle>
          <CardDescription>
            Gerencie a confirmação de pedidos por status de contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FiltrosLocalizacao onFiltroChange={setFiltros} />
        </CardContent>
      </Card>

      {renderStatusTabs()}

      <ReagendamentoDialog
        open={reagendamentoDialogOpen}
        onOpenChange={setReagendamentoDialogOpen}
        cliente={clienteSelecionado}
        onConfirm={handleReagendamentoConfirm}
      />
    </div>
  );
}
