
import React, { useState } from 'react';
import { usePedidoStore } from '@/hooks/usePedidoStore';
import { useProdutoStore } from '@/hooks/useProdutoStore';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pedido, StatusPedido } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';

const Relatorios = () => {
  const pedidoStore = usePedidoStore();
  const produtoStore = useProdutoStore();
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | 'Todos'>('Todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'7dias' | '30dias' | 'todos'>('7dias');
  const [termoBusca, setTermoBusca] = useState('');
  
  // Get all produtos to calculate values
  const produtos = produtoStore.produtos;
  
  // Calculate produto price map for quick lookup
  const produtoPrecoMap = produtos.reduce((acc, produto) => {
    acc[produto.id] = produto.custoUnitario || 0;
    return acc;
  }, {} as Record<number, number>);
  
  // Calculate pedido value on the fly
  const calcularValorPedido = (pedido: Pedido): number => {
    return pedido.itensPedido.reduce((total, item) => {
      // Get the corresponding sabor
      const saborId = item.idSabor;
      // Find produto with matching sabor or default to 0
      const precoUnitario = produtoPrecoMap[saborId] || 0;
      return total + (precoUnitario * item.quantidadeSabor);
    }, 0);
  };

  // Filter pedidos by date
  let dataLimite = new Date();
  if (filtroPeriodo === '7dias') {
    dataLimite.setDate(dataLimite.getDate() - 7);
  } else if (filtroPeriodo === '30dias') {
    dataLimite.setDate(dataLimite.getDate() - 30);
  } else {
    dataLimite = new Date(0); // Start of epoch time for 'todos'
  }

  // Filter pedidos by status, date and search term
  const pedidosFiltrados = pedidoStore.pedidos
    .filter(pedido => 
      (filtroStatus === 'Todos' || pedido.statusPedido === filtroStatus) &&
      new Date(pedido.dataPedido) >= dataLimite &&
      (termoBusca === '' || 
       pedido.cliente?.nome.toLowerCase().includes(termoBusca.toLowerCase()))
    );

  // Calculate totals
  const totalPedidos = pedidosFiltrados.length;
  const totalUnidades = pedidosFiltrados.reduce((sum, pedido) => 
    sum + pedido.totalPedidoUnidades, 0);
  // Calculate total value using our function instead of accessing valorTotal
  const totalValor = pedidosFiltrados.reduce((sum, pedido) => 
    sum + calcularValorPedido(pedido), 0);

  return (
    <div className="container py-10 max-w-7xl">
      <PageHeader 
        title="Relatórios" 
        description="Visualize e exporte dados de pedidos, clientes e produtos" 
      />

      <div className="flex flex-col space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4">
            <div>
              <Input
                placeholder="Buscar por cliente..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>

            <div>
              <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as StatusPedido | 'Todos')}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Status</SelectItem>
                  <SelectItem value="Previsto">Previsto</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="Em Separação">Em Separação</SelectItem>
                  <SelectItem value="Despachado">Despachado</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filtroPeriodo} onValueChange={(value) => setFiltroPeriodo(value as '7dias' | '30dias' | 'todos')}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline">Exportar Relatório</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPedidos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Unidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnidades}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(totalValor)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos</CardTitle>
            <CardDescription>
              Lista de pedidos filtrados por período e status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Pedido</TableHead>
                  <TableHead>Data Entrega</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosFiltrados.map((pedido) => {
                  // Calculate the value for this specific pedido
                  const valorPedido = calcularValorPedido(pedido);
                  
                  return (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.id}</TableCell>
                      <TableCell>{pedido.cliente?.nome || '-'}</TableCell>
                      <TableCell>{format(new Date(pedido.dataPedido), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>
                        {pedido.dataEfetivaEntrega 
                          ? format(new Date(pedido.dataEfetivaEntrega), 'dd/MM/yyyy', { locale: ptBR })
                          : format(new Date(pedido.dataPrevistaEntrega), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                      </TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(valorPedido)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pedidosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Nenhum pedido encontrado com os filtros selecionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
