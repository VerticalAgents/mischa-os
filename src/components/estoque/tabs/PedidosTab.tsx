
import { useState } from "react";
import { useInsumosStore } from "@/hooks/useInsumosStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { PedidoCompra } from "@/types/insumos";
import { 
  FileDown, 
  Search, 
  CheckCircle, 
  Clock, 
  ShoppingBag,
  PackageCheck,
  FileText,
  Eye
} from "lucide-react";

export default function PedidosTab() {
  const { 
    pedidosCompra, 
    fornecedores, 
    insumos, 
    atualizarStatusPedido, 
    receberPedido 
  } = useInsumosStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PedidoCompra['status'] | 'Todos'>('Todos');
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<number | null>(null);
  
  // Filtragem de pedidos
  const pedidosFiltrados = pedidosCompra
    .filter(pedido => {
      const fornecedor = fornecedores.find(f => f.id === pedido.fornecedorId);
      return fornecedor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
             String(pedido.id).includes(searchTerm);
    })
    .filter(pedido => statusFilter === 'Todos' || pedido.status === statusFilter)
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
  
  // Contadores para os cards
  const totalPedidos = pedidosCompra.length;
  const pedidosRecebidos = pedidosCompra.filter(p => p.status === 'Recebido').length;
  const pedidosPendentes = pedidosCompra.filter(p => p.status === 'Pendente' || p.status === 'Enviado').length;
  
  // Handlers
  const abrirDetalhes = (pedido: PedidoCompra) => {
    setPedidoSelecionado(pedido.id);
    setIsDetalhesOpen(true);
  };
  
  const confirmarRecebimento = (pedidoId: number) => {
    if (confirm('Tem certeza que deseja confirmar o recebimento deste pedido? Esta ação atualizará o estoque.')) {
      receberPedido(pedidoId);
      setPedidoSelecionado(null);
      setIsDetalhesOpen(false);
    }
  };
  
  const atualizarStatus = (pedidoId: number, novoStatus: PedidoCompra['status']) => {
    atualizarStatusPedido(pedidoId, novoStatus);
  };
  
  const exportarPedidosCSV = () => {
    const headers = [
      "ID", "Fornecedor", "Data Criação", "Previsão Entrega", 
      "Valor Total", "Status", "Origem", "Observações"
    ];
    
    const linhas = pedidosFiltrados.map(pedido => [
      pedido.id,
      fornecedores.find(f => f.id === pedido.fornecedorId)?.nome || "Fornecedor não encontrado",
      format(new Date(pedido.dataCriacao), "dd/MM/yyyy"),
      format(new Date(pedido.dataEntregaPrevista), "dd/MM/yyyy"),
      pedido.valorTotal.toFixed(2),
      pedido.status,
      pedido.cotacaoId ? `Cotação #${pedido.cotacaoId}` : "Manual",
      pedido.observacoes || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...linhas.map(linha => linha.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_compra_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Pedidos de Compra</h2>
          <p className="text-muted-foreground">Acompanhe os pedidos de compra e controle o recebimento de mercadorias</p>
        </div>
        <Button onClick={exportarPedidosCSV} variant="outline">
          <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPedidos}</div>
            <p className="text-xs text-muted-foreground">pedidos no sistema</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pedidos em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{pedidosPendentes}</div>
            <p className="text-xs text-muted-foreground">aguardando recebimento</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{pedidosRecebidos}</div>
            <p className="text-xs text-muted-foreground">concluídos e estoque atualizado</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por fornecedor ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm"
            variant={statusFilter === 'Todos' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Todos')}
          >
            Todos
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === 'Pendente' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Pendente')}
          >
            <Clock className="mr-1 h-4 w-4" /> Pendentes
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === 'Enviado' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Enviado')}
          >
            <ShoppingBag className="mr-1 h-4 w-4" /> Enviados
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === 'Recebido' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Recebido')}
          >
            <CheckCircle className="mr-1 h-4 w-4" /> Recebidos
          </Button>
        </div>
      </div>
      
      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos de Compra</CardTitle>
          <CardDescription>
            Controle os pedidos enviados aos fornecedores e atualize o estoque ao receber
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Previsão Entrega</TableHead>
                <TableHead className="text-right">Valor Total (R$)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                pedidosFiltrados.map((pedido) => {
                  const fornecedor = fornecedores.find(f => f.id === pedido.fornecedorId);
                  
                  const statusBadge = () => {
                    switch (pedido.status) {
                      case 'Pendente':
                        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Pendente</Badge>;
                      case 'Enviado':
                        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Enviado</Badge>;
                      case 'Recebido':
                        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Recebido</Badge>;
                      case 'Cancelado':
                        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
                      default:
                        return <Badge>{pedido.status}</Badge>;
                    }
                  };
                  
                  return (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.id}</TableCell>
                      <TableCell>{fornecedor?.nome || 'Fornecedor não encontrado'}</TableCell>
                      <TableCell>{format(new Date(pedido.dataCriacao), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{format(new Date(pedido.dataEntregaPrevista), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">
                        {pedido.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                      <TableCell className="text-center">{statusBadge()}</TableCell>
                      <TableCell>
                        {pedido.cotacaoId ? (
                          <Badge variant="outline">Cotação #{pedido.cotacaoId}</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100">Manual</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline" onClick={() => abrirDetalhes(pedido)}>
                            <Eye className="h-4 w-4 mr-1" /> Detalhes
                          </Button>
                          
                          {pedido.status === 'Pendente' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => atualizarStatus(pedido.id, 'Enviado')}
                            >
                              <ShoppingBag className="h-4 w-4 mr-1" /> Enviado
                            </Button>
                          )}
                          
                          {(pedido.status === 'Enviado' || pedido.status === 'Pendente') && (
                            <Button 
                              size="sm"
                              onClick={() => confirmarRecebimento(pedido.id)}
                            >
                              <PackageCheck className="h-4 w-4 mr-1" /> Recebido
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Dialog para detalhes do pedido */}
      <Dialog open={isDetalhesOpen} onOpenChange={setIsDetalhesOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {pedidoSelecionado && (
            <>
              {(() => {
                const pedido = pedidosCompra.find(p => p.id === pedidoSelecionado);
                if (!pedido) return null;
                
                const fornecedor = fornecedores.find(f => f.id === pedido.fornecedorId);
                
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span>Pedido de Compra #{pedido.id}</span>
                        <Badge
                          className={
                            pedido.status === 'Pendente'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : pedido.status === 'Enviado'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : pedido.status === 'Recebido'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {pedido.status}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription>
                        <div className="flex flex-col sm:flex-row sm:justify-between text-sm mt-2">
                          <div>
                            <p><strong>Fornecedor:</strong> {fornecedor?.nome || 'Fornecedor não encontrado'}</p>
                            <p><strong>Criado em:</strong> {format(new Date(pedido.dataCriacao), 'dd/MM/yyyy')}</p>
                          </div>
                          <div className="mt-2 sm:mt-0 sm:text-right">
                            <p><strong>Previsão de entrega:</strong> {format(new Date(pedido.dataEntregaPrevista), 'dd/MM/yyyy')}</p>
                            {pedido.cotacaoId && (
                              <p><strong>Origem:</strong> Cotação #{pedido.cotacaoId}</p>
                            )}
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">Itens do Pedido</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Insumo</TableHead>
                            <TableHead className="text-center">Quantidade</TableHead>
                            <TableHead className="text-right">Preço Un. (R$)</TableHead>
                            <TableHead className="text-right">Subtotal (R$)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pedido.itens.map((item, index) => {
                            const insumo = insumos.find(i => i.id === item.insumoId);
                            const subtotal = item.quantidade * item.precoUnitario;
                            
                            return (
                              <TableRow key={index}>
                                <TableCell>{insumo?.nome || 'Insumo não encontrado'}</TableCell>
                                <TableCell className="text-center">
                                  {item.quantidade} {insumo?.unidadeMedida || ''}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.precoUnitario.toLocaleString('pt-BR', {minimumFractionDigits: 4, maximumFractionDigits: 4})}
                                </TableCell>
                                <TableCell className="text-right">
                                  {subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow>
                            <TableCell colSpan={2}></TableCell>
                            <TableCell className="text-right font-medium">Total:</TableCell>
                            <TableCell className="text-right font-medium">
                              {pedido.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    {pedido.observacoes && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-1">Observações</h3>
                        <p className="text-sm text-muted-foreground">{pedido.observacoes}</p>
                      </div>
                    )}
                    
                    <DialogFooter className="mt-6">
                      <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={() => {
                          // Aqui poderia ter uma função para gerar PDF do pedido
                          alert("Funcionalidade de imprimir em desenvolvimento");
                        }}>
                          <FileText className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                        
                        <div>
                          <Button variant="outline" onClick={() => setIsDetalhesOpen(false)} className="mr-2">
                            Fechar
                          </Button>
                          
                          {(pedido.status === 'Enviado' || pedido.status === 'Pendente') && (
                            <Button onClick={() => confirmarRecebimento(pedido.id)}>
                              <PackageCheck className="mr-2 h-4 w-4" /> Confirmar Recebimento
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogFooter>
                  </>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
