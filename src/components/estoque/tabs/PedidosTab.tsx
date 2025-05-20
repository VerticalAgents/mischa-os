
import { useState } from "react";
import { useInsumosStore } from "@/hooks/useInsumosStore";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, FileText, Check, Package, Truck, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PedidoCompra } from "@/types/insumos";

export default function PedidosTab() {
  const {
    pedidosCompra,
    insumos,
    fornecedores,
    atualizarStatusPedido,
    receberPedido,
  } = useInsumosStore();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PedidoCompra["status"] | "Todos">("Todos");
  const [selectedPedido, setSelectedPedido] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Filtered pedidos
  const filteredPedidos = pedidosCompra.filter(pedido => {
    // Apply search term filter
    const fornecedor = fornecedores.find(f => f.id === pedido.fornecedorId);
    const searchCheck = 
      pedido.id.toString().includes(searchTerm) || 
      (fornecedor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    // Apply status filter
    const statusCheck = statusFilter === "Todos" || pedido.status === statusFilter;
    
    return searchCheck && statusCheck;
  });

  // Handlers
  const handleOpenDetail = (pedidoId: number) => {
    setSelectedPedido(pedidoId);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateStatus = (pedidoId: number, status: PedidoCompra["status"]) => {
    atualizarStatusPedido(pedidoId, status);
  };

  const handleReceivePedido = (pedidoId: number) => {
    if (confirm("Deseja marcar este pedido como recebido? Isso atualizará automaticamente o estoque de todos os itens.")) {
      receberPedido(pedidoId);
      setIsDetailDialogOpen(false);
    }
  };

  // Helper functions
  const getInsumoById = (id: number) => {
    return insumos.find(i => i.id === id);
  };

  const getFornecedorById = (id: number) => {
    return fornecedores.find(f => f.id === id);
  };
  
  const getStatusColor = (status: PedidoCompra["status"]) => {
    switch (status) {
      case "Pendente":
        return "bg-yellow-100 text-yellow-800";
      case "Enviado":
        return "bg-blue-100 text-blue-800";
      case "Recebido":
        return "bg-green-100 text-green-800";
      case "Cancelado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusCard = (statusPredicate: PedidoCompra["status"], icon: any, title: string) => {
    const count = pedidosCompra.filter(p => p.status === statusPredicate).length;
    const valor = pedidosCompra
      .filter(p => p.status === statusPredicate)
      .reduce((acc, p) => acc + p.valorTotal, 0);
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground">
            R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>
    );
  };

  // Render functions
  const renderDetailDialog = () => {
    if (!selectedPedido) return null;
    
    const pedido = pedidosCompra.find(p => p.id === selectedPedido);
    if (!pedido) return null;
    
    const fornecedor = getFornecedorById(pedido.fornecedorId);
    
    return (
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{pedido.id}</DialogTitle>
            <DialogDescription>
              Visualize as informações completas deste pedido de compra
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fornecedor</p>
                <p className="font-medium">{fornecedor?.nome || "Fornecedor não encontrado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(pedido.status)}>
                  {pedido.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium">{format(new Date(pedido.dataCriacao), "dd/MM/yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                <p className="font-medium">{format(new Date(pedido.dataEntregaPrevista), "dd/MM/yyyy")}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Itens do Pedido</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Preço Unitário</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedido.itens.map(item => {
                    const insumo = getInsumoById(item.insumoId);
                    const total = item.quantidade * item.precoUnitario;
                    
                    return (
                      <TableRow key={item.insumoId}>
                        <TableCell>
                          {insumo?.nome || "Insumo não encontrado"}
                          <span className="text-xs text-muted-foreground block">
                            {insumo?.unidadeMedida}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">
                          R$ {item.precoUnitario.toLocaleString('pt-BR', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {total.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total do Pedido</TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {pedido.valorTotal.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {pedido.observacoes && (
              <div>
                <h3 className="font-medium mb-2">Observações</h3>
                <p className="text-sm">{pedido.observacoes}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="space-x-2">
            {pedido.status === "Pendente" && (
              <Button 
                variant="outline" 
                onClick={() => handleUpdateStatus(pedido.id, "Enviado")}
              >
                <Truck className="h-4 w-4 mr-2" />
                Marcar como Enviado
              </Button>
            )}
            {(pedido.status === "Pendente" || pedido.status === "Enviado") && (
              <Button 
                onClick={() => handleReceivePedido(pedido.id)}
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar como Recebido
              </Button>
            )}
            {(pedido.status === "Pendente") && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm("Tem certeza que deseja cancelar este pedido?")) {
                    handleUpdateStatus(pedido.id, "Cancelado");
                    setIsDetailDialogOpen(false);
                  }
                }}
              >
                Cancelar Pedido
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Pedidos de Compra</h2>
          <p className="text-muted-foreground">
            Gerencie os pedidos para fornecedores
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {getStatusCard("Pendente", <AlertTriangle className="h-4 w-4 text-yellow-500" />, "Pendentes de Envio")}
        {getStatusCard("Enviado", <Truck className="h-4 w-4 text-blue-500" />, "Em Trânsito")}
        {getStatusCard("Recebido", <Package className="h-4 w-4 text-green-500" />, "Recebidos")}
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={statusFilter === "Todos" ? "default" : "outline"}
            onClick={() => setStatusFilter("Todos")}
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "Pendente" ? "default" : "outline"}
            onClick={() => setStatusFilter("Pendente")}
          >
            Pendentes
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "Enviado" ? "default" : "outline"}
            onClick={() => setStatusFilter("Enviado")}
          >
            Enviados
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "Recebido" ? "default" : "outline"}
            onClick={() => setStatusFilter("Recebido")}
          >
            Recebidos
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "Cancelado" ? "default" : "outline"}
            onClick={() => setStatusFilter("Cancelado")}
          >
            Cancelados
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            Gerenciamento de pedidos de compra para insumos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido #</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data do Pedido</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPedidos.map(pedido => {
                  const fornecedor = getFornecedorById(pedido.fornecedorId);
                  return (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-medium">{pedido.id}</TableCell>
                      <TableCell>{fornecedor?.nome || "Fornecedor não encontrado"}</TableCell>
                      <TableCell>{format(new Date(pedido.dataCriacao), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(new Date(pedido.dataEntregaPrevista), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(pedido.status)}>
                          {pedido.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {pedido.valorTotal.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(pedido.id)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {pedido.status === "Pendente" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(pedido.id, "Enviado")}
                            >
                              Enviado
                            </Button>
                          )}
                          {(pedido.status === "Pendente" || pedido.status === "Enviado") && (
                            <Button
                              size="sm"
                              onClick={() => handleReceivePedido(pedido.id)}
                            >
                              Recebido
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
      
      {renderDetailDialog()}
    </div>
  );
}
