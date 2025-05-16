
import { useState } from "react";
import { format, isWeekend, getDay, addDays, parseISO } from "date-fns";
import { CalendarClock, CheckCircle, RefreshCw, Plus } from "lucide-react";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { Pedido, ItemPedido } from "@/types";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Agendamento() {
  const { pedidos, getPedidosFiltrados, confirmarEntrega, criarNovoPedido, atualizarPedido, atualizarItensPedido, adicionarPedido } = usePedidoStore();
  const { clientes, getClientePorId } = useClienteStore();
  const { sabores } = useSaborStore();
  const [tabValue, setTabValue] = useState("previstos");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entregaDialogOpen, setEntregaDialogOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [hasTrocas, setHasTrocas] = useState(false);
  const [hasQuantidadesAlteradas, setHasQuantidadesAlteradas] = useState(false);
  const [itensTroca, setItensTroca] = useState<{idSabor: number, quantidade: number}[]>([]);
  const [itensEntrega, setItensEntrega] = useState<{idSabor: number, quantidade: number}[]>([]);
  const [observacoes, setObservacoes] = useState("");
  
  // Estados para pedidos únicos
  const [pedidoUnicoDialogOpen, setPedidoUnicoDialogOpen] = useState(false);
  const [novoPedidoUnico, setNovoPedidoUnico] = useState({
    nome: "",
    telefone: "",
    dataEntrega: new Date(new Date().setDate(new Date().getDate() + 2)),
    observacoes: "",
    itens: [] as {idSabor: number, quantidade: number}[]
  });
  
  // Calculate day of the week
  const getDayOfWeek = (date: Date): string => {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return days[date.getDay()];
  };
  
  // Suggestion for next delivery date based on PDV periodicity
  const calcularProximaDataReposicao = (pedido: Pedido): Date | null => {
    if (!pedido.cliente) return null;
    
    // Start with current date or last delivery date
    let dataBase = pedido.dataEfetivaEntrega || new Date();
    let proximaData = new Date(dataBase);
    
    // Add the periodicity in days
    proximaData.setDate(proximaData.getDate() + pedido.cliente.periodicidadePadrao);
    
    // Check if it falls on weekend or Monday/Tuesday
    while (isWeekend(proximaData) || getDay(proximaData) === 1 || getDay(proximaData) === 2) {
      // If weekend or Monday/Tuesday, move to next Wednesday
      while (getDay(proximaData) !== 3) {
        proximaData.setDate(proximaData.getDate() + 1);
      }
    }
    
    return proximaData;
  };
  
  const handleConfirmarEntrega = (pedido: Pedido) => {
    if (!pedido) return;
    
    setPedidoSelecionado(pedido);
    
    // Initialize items for delivery
    const itensIniciais = pedido.itensPedido.map(item => ({
      idSabor: item.idSabor,
      quantidade: item.quantidadeSabor
    }));
    
    setItensEntrega(itensIniciais);
    setItensTroca([]);
    setHasTrocas(false);
    setHasQuantidadesAlteradas(false);
    setObservacoes("");
    setEntregaDialogOpen(true);
  };

  const handleSalvarConfirmacaoEntrega = () => {
    if (!pedidoSelecionado) return;
    
    // Prepare items for delivery
    const itensEntregues = itensEntrega.map(item => ({
      idSabor: item.idSabor,
      quantidadeEntregue: item.quantidade
    }));
    
    // Add observation about exchanges if any
    let obsFinais = observacoes;
    if (hasTrocas && itensTroca.length > 0) {
      const trocasTexto = itensTroca
        .map(item => {
          const sabor = sabores.find(s => s.id === item.idSabor);
          return `${sabor?.nome}: ${item.quantidade}`;
        })
        .join(", ");
      
      obsFinais += `\nTrocas: ${trocasTexto}`;
    }
    
    // Update the order
    confirmarEntrega(pedidoSelecionado.id, new Date(), itensEntregues);
    if (obsFinais.trim()) {
      atualizarPedido(pedidoSelecionado.id, { observacoes: obsFinais });
    }
    
    setEntregaDialogOpen(false);
  };
  
  const handleGerarNovoPedido = (pedido: Pedido) => {
    if (!pedido || !pedido.cliente) return;
    
    setPedidoSelecionado(pedido);
    setDialogOpen(true);
  };
  
  const handleConfirmarNovoPedido = () => {
    if (!pedidoSelecionado || !pedidoSelecionado.cliente) return;
    
    // Calculate next date
    const proximaData = calcularProximaDataReposicao(pedidoSelecionado);
    if (!proximaData) {
      toast({
        title: "Erro",
        description: "Não foi possível calcular a próxima data de entrega",
        variant: "destructive"
      });
      return;
    }
    
    // Create new order with "Previsto" status
    const novoPedido = criarNovoPedido(pedidoSelecionado.idCliente);
    
    // Fixed code: Check if novoPedido exists before accessing its properties
    if (novoPedido) {
      atualizarPedido(novoPedido.id, {
        statusPedido: "Agendado",
        dataPrevistaEntrega: proximaData,
        tipoPedido: "Padrão"
      });
      
      toast({
        title: "Pedido previsto criado",
        description: `Nova entrega para ${pedidoSelecionado.cliente.nome} agendada para ${format(proximaData, "dd/MM/yyyy")} (${getDayOfWeek(proximaData)})`,
      });
    }
    
    setDialogOpen(false);
  };
  
  // Filter orders based on tab
  const getPedidosPorStatus = (status: "Previsto" | "Agendado" | "Entregue") => {
    const filtrados = getPedidosFiltrados();
    
    if (status === "Previsto") {
      return filtrados.filter(pedido => 
        pedido.statusPedido === "Agendado" && 
        !pedido.dataEfetivaEntrega
      );
    } else if (status === "Agendado") {
      return filtrados.filter(pedido => 
        (pedido.statusPedido === "Agendado" || pedido.statusPedido === "Despachado") &&
        !pedido.dataEfetivaEntrega
      );
    } else {
      return filtrados.filter(pedido => 
        pedido.statusPedido === "Entregue"
      );
    }
  };
  
  // Get unique orders (orders without a PDV client)
  const getPedidosUnicos = () => {
    return pedidos.filter(pedido => 
      !pedido.cliente && // No associated client
      (pedido.statusPedido === "Agendado" || pedido.statusPedido === "Despachado") &&
      !pedido.dataEfetivaEntrega
    );
  };
  
  // Additional filter by selected date if any
  const filtrarPedidosPorData = (pedidos: Pedido[]) => {
    if (!selectedDate) return pedidos;
    
    return pedidos.filter(pedido => {
      const dataPedido = new Date(pedido.dataPrevistaEntrega);
      return dataPedido.setHours(0,0,0,0) === selectedDate.setHours(0,0,0,0);
    });
  };

  // Handle adding a new unique order
  const handleAdicionarPedidoUnico = () => {
    // Reset the form
    setNovoPedidoUnico({
      nome: "",
      telefone: "",
      dataEntrega: addDays(new Date(), 2),
      observacoes: "",
      itens: sabores.filter(s => s.ativo).map(sabor => ({ idSabor: sabor.id, quantidade: 0 }))
    });
    
    // Open dialog
    setPedidoUnicoDialogOpen(true);
  };

  // Handle saving a unique order
  const handleSalvarPedidoUnico = () => {
    // Validate form
    if (!novoPedidoUnico.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    // Filter only items with quantity > 0
    const itensValidos = novoPedidoUnico.itens.filter(item => item.quantidade > 0);
    
    if (itensValidos.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate total units
    const totalUnidades = itensValidos.reduce((sum, item) => sum + item.quantidade, 0);
    
    // Create the order
    const pedido: Omit<Pedido, 'id' | 'dataPedido'> = {
      idCliente: 0, // No client ID for unique orders
      dataPrevistaEntrega: novoPedidoUnico.dataEntrega,
      totalPedidoUnidades: totalUnidades,
      tipoPedido: "Alterado",
      statusPedido: "Agendado",
      observacoes: `PEDIDO ÚNICO\nNome: ${novoPedidoUnico.nome}\nTelefone: ${novoPedidoUnico.telefone}\n${novoPedidoUnico.observacoes}`,
      itensPedido: []
    };
    
    // Add the order
    const novoPedido = adicionarPedido(pedido);
    
    // Add items to the order
    if (novoPedido) {
      const itensFormatados = itensValidos.map(item => ({
        idSabor: item.idSabor,
        quantidadeSabor: item.quantidade
      }));
      
      atualizarItensPedido(novoPedido.id, itensFormatados);
      
      toast({
        title: "Pedido único criado",
        description: `Pedido único para ${novoPedidoUnico.nome} agendado para ${format(novoPedidoUnico.dataEntrega, "dd/MM/yyyy")}`,
      });
    }
    
    // Close dialog
    setPedidoUnicoDialogOpen(false);
  };

  // Handle quantity change for unique order items
  const handleQuantidadeChange = (idSabor: number, quantidade: number) => {
    setNovoPedidoUnico(prev => ({
      ...prev,
      itens: prev.itens.map(item => 
        item.idSabor === idSabor ? { ...item, quantidade } : item
      )
    }));
  };

  // Get pedidos based on current tab
  const pedidosPrevistos = filtrarPedidosPorData(getPedidosPorStatus("Previsto"));
  const pedidosAgendados = filtrarPedidosPorData(getPedidosPorStatus("Agendado"));
  const pedidosConcluidos = filtrarPedidosPorData(getPedidosPorStatus("Entregue"));
  const pedidosUnicos = filtrarPedidosPorData(getPedidosUnicos());

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Agendamento" 
        description="Controle de reposições nos pontos de venda"
      >
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "dd/MM/yyyy")
                ) : (
                  "Selecionar Data"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="default" onClick={handleAdicionarPedidoUnico} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Pedido Único
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="previstos" value={tabValue} onValueChange={setTabValue} className="w-full mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="previstos">Previstos</TabsTrigger>
          <TabsTrigger value="agendados">Agendados</TabsTrigger>
          <TabsTrigger value="unicos">Pedidos Únicos</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
        </TabsList>
        
        {/* Tab para pedidos previstos */}
        <TabsContent value="previstos" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pedidosPrevistos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PDV</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia da Semana</TableHead>
                      <TableHead>Qtd. Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosPrevistos.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium">{pedido.cliente?.nome || `Cliente #${pedido.idCliente}`}</TableCell>
                        <TableCell>{format(new Date(pedido.dataPrevistaEntrega), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{getDayOfWeek(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                        <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedDate 
                    ? `Nenhuma entrega prevista para ${format(selectedDate, "dd/MM/yyyy")}`
                    : "Nenhuma entrega prevista encontrada"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab para pedidos agendados */}
        <TabsContent value="agendados" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pedidosAgendados.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PDV</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia da Semana</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Qtd. Total</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosAgendados.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium">{pedido.cliente?.nome || `Cliente #${pedido.idCliente}`}</TableCell>
                        <TableCell>{format(new Date(pedido.dataPrevistaEntrega), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{getDayOfWeek(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                        <TableCell>
                          <Badge variant={pedido.statusPedido === "Agendado" ? "outline" : "default"}>
                            {pedido.statusPedido}
                          </Badge>
                        </TableCell>
                        <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => handleConfirmarEntrega(pedido)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirmar Entrega
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedDate 
                    ? `Nenhum agendamento para ${format(selectedDate, "dd/MM/yyyy")}`
                    : "Nenhum agendamento encontrado"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab para pedidos únicos */}
        <TabsContent value="unicos" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pedidosUnicos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data Entrega</TableHead>
                      <TableHead>Dia da Semana</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Qtd. Total</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosUnicos.map((pedido) => {
                      // Extract client name from observations
                      const nomeMatch = pedido.observacoes?.match(/Nome: (.*?)(?:\n|$)/);
                      const nome = nomeMatch ? nomeMatch[1] : "Cliente sem nome";
                      
                      return (
                        <TableRow key={pedido.id}>
                          <TableCell className="font-medium">{nome}</TableCell>
                          <TableCell>{format(new Date(pedido.dataPrevistaEntrega), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{getDayOfWeek(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                          <TableCell>
                            <Badge variant={pedido.statusPedido === "Agendado" ? "outline" : "default"}>
                              {pedido.statusPedido}
                            </Badge>
                          </TableCell>
                          <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => handleConfirmarEntrega(pedido)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirmar Entrega
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedDate 
                    ? `Nenhum pedido único para ${format(selectedDate, "dd/MM/yyyy")}`
                    : "Nenhum pedido único encontrado"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab para pedidos concluídos */}
        <TabsContent value="concluidos" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pedidosConcluidos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PDV</TableHead>
                      <TableHead>Data Prevista</TableHead>
                      <TableHead>Data Efetiva</TableHead>
                      <TableHead>Qtd. Entregue</TableHead>
                      <TableHead>Próxima Entrega</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosConcluidos.map((pedido) => {
                      const proximaData = calcularProximaDataReposicao(pedido);
                      
                      // Extract client name for unique orders
                      let clienteDisplay = pedido.cliente?.nome;
                      if (!clienteDisplay && pedido.observacoes?.includes("PEDIDO ÚNICO")) {
                        const nomeMatch = pedido.observacoes?.match(/Nome: (.*?)(?:\n|$)/);
                        clienteDisplay = nomeMatch ? nomeMatch[1] : "Cliente único";
                      } else if (!clienteDisplay) {
                        clienteDisplay = `Cliente #${pedido.idCliente}`;
                      }
                      
                      return (
                        <TableRow key={pedido.id}>
                          <TableCell className="font-medium">{clienteDisplay}</TableCell>
                          <TableCell>{format(new Date(pedido.dataPrevistaEntrega), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            {pedido.dataEfetivaEntrega 
                              ? format(new Date(pedido.dataEfetivaEntrega), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {pedido.itensPedido.reduce((total, item) => total + (item.quantidadeEntregue || 0), 0)}
                          </TableCell>
                          <TableCell>
                            {proximaData && pedido.cliente // Only show for regular PDV clients, not for unique orders
                              ? `${format(proximaData, "dd/MM/yyyy")} (${getDayOfWeek(proximaData)})`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {pedido.cliente && ( // Only show for regular PDV clients
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => handleGerarNovoPedido(pedido)}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Agendar Próxima
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedDate 
                    ? `Nenhuma entrega concluída em ${format(selectedDate, "dd/MM/yyyy")}`
                    : "Nenhuma entrega concluída encontrada"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para confirmar nova previsão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Próxima Entrega</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Confirmar agendamento de próxima entrega para o PDV: <strong>{pedidoSelecionado?.cliente?.nome}</strong>?</p>
            
            {pedidoSelecionado && (
              <div className="mt-4">
                <p>
                  <span className="font-medium">Data sugerida:</span> {calcularProximaDataReposicao(pedidoSelecionado) ? 
                    format(calcularProximaDataReposicao(pedidoSelecionado)!, "dd/MM/yyyy") : "-"}
                </p>
                <p>
                  <span className="font-medium">Dia da semana:</span> {calcularProximaDataReposicao(pedidoSelecionado) ? 
                    getDayOfWeek(calcularProximaDataReposicao(pedidoSelecionado)!) : "-"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarNovoPedido}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar entrega */}
      <Dialog open={entregaDialogOpen} onOpenChange={setEntregaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Entrega</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              {pedidoSelecionado?.cliente ? (
                <p className="font-medium mb-2">PDV: {pedidoSelecionado?.cliente?.nome}</p>
              ) : (
                <p className="font-medium mb-2">
                  Cliente: {pedidoSelecionado?.observacoes?.match(/Nome: (.*?)(?:\n|$)/)?.[1] || "Cliente único"}
                </p>
              )}
              <p>Data prevista: {pedidoSelecionado ? format(new Date(pedidoSelecionado.dataPrevistaEntrega), "dd/MM/yyyy") : "-"}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Toggle pressed={hasTrocas} onPressedChange={setHasTrocas}>Houve trocas</Toggle>
              <Toggle pressed={hasQuantidadesAlteradas} onPressedChange={setHasQuantidadesAlteradas}>Quantidades alteradas</Toggle>
            </div>
            
            {/* Quantidades alteradas */}
            {hasQuantidadesAlteradas && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-medium">Quantidades entregues:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {pedidoSelecionado?.itensPedido.map((item) => {
                    const sabor = sabores.find(s => s.id === item.idSabor);
                    const itemEntrega = itensEntrega.find(i => i.idSabor === item.idSabor);
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Label className="w-32">{sabor?.nome}:</Label>
                        <Input 
                          type="number" 
                          min="0"
                          value={itemEntrega?.quantidade || 0}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setItensEntrega(prev => 
                              prev.map(i => 
                                i.idSabor === item.idSabor 
                                  ? {...i, quantidade: newValue} 
                                  : i
                              )
                            );
                          }}
                          className="w-24"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Trocas */}
            {hasTrocas && (
              <div className="space-y-2 border p-4 rounded-md">
                <h4 className="font-medium">Produtos trocados (vencidos):</h4>
                <div className="grid grid-cols-2 gap-4">
                  {pedidoSelecionado?.itensPedido.map((item) => {
                    const sabor = sabores.find(s => s.id === item.idSabor);
                    const itemTroca = itensTroca.find(i => i.idSabor === item.idSabor);
                    
                    return (
                      <div key={`troca-${item.id}`} className="flex items-center space-x-2">
                        <Label className="w-32">{sabor?.nome}:</Label>
                        <Input 
                          type="number" 
                          min="0"
                          value={itemTroca?.quantidade || 0}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            const existingItem = itensTroca.find(i => i.idSabor === item.idSabor);
                            
                            if (existingItem) {
                              setItensTroca(prev => 
                                prev.map(i => 
                                  i.idSabor === item.idSabor 
                                    ? {...i, quantidade: newValue} 
                                    : i
                                )
                              );
                            } else {
                              setItensTroca(prev => [
                                ...prev,
                                { idSabor: item.idSabor, quantidade: newValue }
                              ]);
                            }
                          }}
                          className="w-24"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="observacoes">Observações:</Label>
              <Textarea 
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntregaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvarConfirmacaoEntrega}>Confirmar Entrega</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para criar pedido único */}
      <Dialog open={pedidoUnicoDialogOpen} onOpenChange={setPedidoUnicoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Pedido Único</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Cliente:</Label>
                <Input 
                  id="nome"
                  value={novoPedidoUnico.nome}
                  onChange={(e) => setNovoPedidoUnico(prev => ({ ...prev, nome: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone:</Label>
                <Input 
                  id="telefone"
                  value={novoPedidoUnico.telefone}
                  onChange={(e) => setNovoPedidoUnico(prev => ({ ...prev, telefone: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="dataEntrega">Data de Entrega:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dataEntrega"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !novoPedidoUnico.dataEntrega && "text-muted-foreground"
                    )}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {novoPedidoUnico.dataEntrega ? (
                      format(novoPedidoUnico.dataEntrega, "dd/MM/yyyy")
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={novoPedidoUnico.dataEntrega}
                    onSelect={(date) => date && setNovoPedidoUnico(prev => ({ ...prev, dataEntrega: date }))}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="itens" className="mb-2 block">Itens do Pedido:</Label>
              <div className="border rounded-md p-4">
                <div className="grid grid-cols-2 gap-4">
                  {sabores.filter(s => s.ativo).map(sabor => (
                    <div key={sabor.id} className="flex items-center space-x-2">
                      <Label className="w-32">{sabor.nome}:</Label>
                      <Input 
                        type="number" 
                        min="0"
                        value={novoPedidoUnico.itens.find(i => i.idSabor === sabor.id)?.quantidade || 0}
                        onChange={(e) => handleQuantidadeChange(sabor.id, parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="observacoesUnico">Observações:</Label>
              <Textarea 
                id="observacoesUnico"
                value={novoPedidoUnico.observacoes}
                onChange={(e) => setNovoPedidoUnico(prev => ({ ...prev, observacoes: e.target.value }))}
                className="mt-1"
                placeholder="Instruções especiais, informações de pagamento, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPedidoUnicoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvarPedidoUnico}>Salvar Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
