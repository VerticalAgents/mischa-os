
import { useState } from "react";
import { format, isWeekend, addDays, getDay } from "date-fns";
import { CalendarClock, CheckCircle } from "lucide-react";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { Pedido } from "@/types";
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

export default function Agendamento() {
  const { pedidos, getPedidosFiltrados, confirmarEntrega } = usePedidoStore();
  const { clientes, getClientePorId } = useClienteStore();
  const [tabValue, setTabValue] = useState("agendados");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
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
    
    // For this example, we're setting all items to delivered with the same quantity as ordered
    const itensEntregues = pedido.itensPedido.map(item => ({
      idSabor: item.idSabor,
      quantidadeEntregue: item.quantidadeSabor
    }));
    
    // Confirm delivery
    confirmarEntrega(pedido.id, new Date(), itensEntregues);
    
    // Calculate next suggested date
    const proximaData = calcularProximaDataReposicao(pedido);
    
    if (proximaData) {
      toast({
        title: "Entrega confirmada",
        description: `Próxima reposição sugerida: ${format(proximaData, 'dd/MM/yyyy')} (${getDayOfWeek(proximaData)})`,
      });
    }
  };
  
  // Filter orders based on tab
  const pedidosFiltrados = getPedidosFiltrados().filter(pedido => {
    if (tabValue === "agendados") {
      return pedido.statusPedido === "Agendado" || pedido.statusPedido === "Despachado";
    }
    return pedido.statusPedido === "Entregue";
  });
  
  // Additional filter by selected date if any
  const pedidosPorData = selectedDate 
    ? pedidosFiltrados.filter(pedido => {
        const dataPedido = new Date(pedido.dataPrevistaEntrega);
        return dataPedido.setHours(0,0,0,0) === selectedDate.setHours(0,0,0,0);
      })
    : pedidosFiltrados;

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Agendamento" 
        description="Controle de reposições nos pontos de venda"
        action={{
          label: "Filtrar por Data",
          onClick: () => {},
          variant: "outline"
        }}
      >
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
      </PageHeader>

      <Tabs defaultValue="agendados" value={tabValue} onValueChange={setTabValue} className="w-full mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="agendados">Agendados</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="agendados" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pedidosPorData.length > 0 ? (
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
                    {pedidosPorData.map((pedido) => (
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
                            Confirmar
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
        
        <TabsContent value="concluidos" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pedidosPorData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PDV</TableHead>
                      <TableHead>Data Prevista</TableHead>
                      <TableHead>Data Efetiva</TableHead>
                      <TableHead>Qtd. Entregue</TableHead>
                      <TableHead>Próxima Entrega</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosPorData.map((pedido) => {
                      const proximaData = calcularProximaDataReposicao(pedido);
                      
                      return (
                        <TableRow key={pedido.id}>
                          <TableCell className="font-medium">{pedido.cliente?.nome || `Cliente #${pedido.idCliente}`}</TableCell>
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
                            {proximaData 
                              ? `${format(proximaData, "dd/MM/yyyy")} (${getDayOfWeek(proximaData)})`
                              : "-"}
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
    </div>
  );
}
