
import { useState } from "react";
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar as CalendarIcon, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9B87F5', '#FF6384', '#36A2EB', '#FFCE56'];

export default function Relatorios() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  const pedidoStore = usePedidoStore();
  const clienteStore = useClienteStore();
  const produtoStore = useProdutoStore();
  
  const pedidos = pedidoStore.getPedidosFiltrados();
  const clientes = clienteStore.getClientesFiltrados();
  const produtos = produtoStore.getAll();
  
  // Filter orders by date range
  const filteredPedidos = pedidos.filter(pedido => {
    if (!pedido.dataEfetivaEntrega) return false;
    const pedidoDate = new Date(pedido.dataEfetivaEntrega);
    return pedidoDate >= startDate && pedidoDate <= endDate;
  });
  
  const pedidosConcluidos = filteredPedidos.filter(p => p.statusPedido === "Entregue");
  
  // Calculate statistics for dashboard
  const totalVendas = pedidosConcluidos.reduce((sum, pedido) => sum + (pedido.valorTotal || 0), 0);
  const totalUnidades = pedidosConcluidos.reduce((sum, pedido) => 
    sum + pedido.itensPedido.reduce((itemSum, item) => itemSum + (item.quantidadeEntregue || 0), 0), 0);
  
  // Data for charts
  const vendasPorCliente = pedidosConcluidos.reduce((acc, pedido) => {
    const cliente = clientes.find(c => c.id === pedido.idCliente)?.nome || "Desconhecido";
    acc[cliente] = (acc[cliente] || 0) + (pedido.valorTotal || 0);
    return acc;
  }, {} as Record<string, number>);
  
  const vendasPorClienteData = Object.entries(vendasPorCliente).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  })).sort((a, b) => b.value - a.value).slice(0, 10);
  
  const vendasPorProduto = pedidosConcluidos.reduce((acc, pedido) => {
    pedido.itensPedido.forEach(item => {
      const sabor = item.nomeSabor || "Desconhecido";
      acc[sabor] = (acc[sabor] || 0) + (item.quantidadeEntregue || 0);
    });
    return acc;
  }, {} as Record<string, number>);
  
  const vendasPorProdutoData = Object.entries(vendasPorProduto).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);
  
  // Function to export orders to Excel
  const exportToExcel = () => {
    // In a real application, you would use a library like ExcelJS or XLSX to generate the Excel file
    // For this example, we'll just simulate the export with CSV
    const headers = [
      "Cliente",
      "Data Entrega",
      "Sabores",
      "Qtd Total",
      "Status",
      "Forma de Pagamento",
      "Vencimento",
      "Valor Total"
    ];
    
    const rows = pedidosConcluidos.map(pedido => {
      const cliente = clientes.find(c => c.id === pedido.idCliente)?.nome || "Desconhecido";
      const sabores = pedido.itensPedido.map(item => 
        `${item.nomeSabor}: ${item.quantidadeEntregue || item.quantidadeSabor}`).join(" | ");
      const qtdTotal = pedido.itensPedido.reduce((sum, item) => 
        sum + (item.quantidadeEntregue || item.quantidadeSabor), 0);
      const dataFormatada = pedido.dataEfetivaEntrega 
        ? format(new Date(pedido.dataEfetivaEntrega), "dd/MM/yyyy") 
        : "-";
      
      return [
        cliente,
        dataFormatada,
        sabores,
        qtdTotal.toString(),
        pedido.statusPedido,
        pedido.formaPagamento || "-",
        pedido.dataVencimento ? format(new Date(pedido.dataVencimento), "dd/MM/yyyy") : "-",
        (pedido.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_${format(startDate, "dd-MM-yyyy")}_a_${format(endDate, "dd-MM-yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportação Iniciada",
      description: "Os dados estão sendo exportados para Excel"
    });
  };
  
  return (
    <>
      <PageHeader 
        title="Relatórios"
        description="Visualize dados e exporte relatórios"
      />
      
      <div className="mb-6 mt-8 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal w-[240px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>De: {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date);
                      setStartDateOpen(false);
                      if (date > endDate) {
                        setEndDate(date);
                      }
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center space-x-2">
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal w-[240px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Até: {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date);
                      setEndDateOpen(false);
                      if (date < startDate) {
                        setStartDate(date);
                      }
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(startOfMonth(new Date()));
                setEndDate(endOfMonth(new Date()));
              }}
            >
              Este Mês
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const prevMonth = subMonths(new Date(), 1);
                setStartDate(startOfMonth(prevMonth));
                setEndDate(endOfMonth(prevMonth));
              }}
            >
              Mês Anterior
            </Button>
          </div>
        </div>
        
        <Button 
          variant="default"
          onClick={exportToExcel}
          disabled={pedidosConcluidos.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar Pedidos
        </Button>
      </div>
      
      <div className="mt-4">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-[400px] mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pedidosConcluidos.length} pedidos no período
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Unidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalUnidades} unidades
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Object.keys(vendasPorProduto).length} sabores diferentes
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pedidosConcluidos.length > 0 
                      ? (totalVendas / pedidosConcluidos.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : "R$ 0,00"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    por pedido
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Vendas por Cliente</CardTitle>
                  <CardDescription>Top 10 clientes por valor de vendas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {vendasPorClienteData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={vendasPorClienteData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip formatter={(value) => `R$ ${value}`} />
                          <Legend />
                          <Bar dataKey="value" fill="#9B87F5" name="Valor (R$)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Nenhum dado disponível no período</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Vendas por Sabor</CardTitle>
                  <CardDescription>Distribuição de vendas por sabor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {vendasPorProdutoData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={vendasPorProdutoData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {vendasPorProdutoData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} unidades`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Nenhum dado disponível no período</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="pedidos">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Concluídos</CardTitle>
                <CardDescription>
                  Listagem de todos os pedidos concluídos no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead>Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidosConcluidos.length > 0 ? (
                        pedidosConcluidos.map(pedido => {
                          const cliente = clientes.find(c => c.id === pedido.idCliente);
                          const totalQuantidade = pedido.itensPedido.reduce(
                            (sum, item) => sum + (item.quantidadeEntregue || item.quantidadeSabor), 0
                          );
                          
                          return (
                            <TableRow key={pedido.id}>
                              <TableCell>
                                {pedido.dataEfetivaEntrega ? 
                                  format(new Date(pedido.dataEfetivaEntrega), "dd/MM/yyyy") : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{cliente?.nome || "Desconhecido"}</div>
                                <div className="text-sm text-muted-foreground">
                                  {cliente?.nomeEstabelecimento || "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[300px] truncate">
                                  {pedido.itensPedido
                                    .map(item => `${item.nomeSabor}: ${item.quantidadeEntregue || item.quantidadeSabor}`)
                                    .join(", ")}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{totalQuantidade} un</TableCell>
                              <TableCell className="text-right">
                                {(pedido.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </TableCell>
                              <TableCell>{pedido.formaPagamento || "-"}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Nenhum pedido concluído no período selecionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline"
                    onClick={exportToExcel}
                    disabled={pedidosConcluidos.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar para Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
