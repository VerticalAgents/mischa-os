
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { Truck, Package, CheckCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DespachoProps {
  tipoFiltro: 'hoje' | 'atrasadas';
}

export const Despacho = ({ tipoFiltro }: DespachoProps) => {
  const { 
    getPedidosParaDespacho, 
    getPedidosAtrasados,
    confirmarDespacho,
    confirmarEntrega,
    confirmarRetorno,
    confirmarDespachoEmMassa,
    confirmarEntregaEmMassa,
    confirmarRetornoEmMassa,
    desfazerSeparacao,
    isLoading 
  } = useExpedicaoStore();
  
  // Usar hook de sincronização
  useExpedicaoSync();
  
  // Obter pedidos baseado no tipo de filtro
  const pedidos = tipoFiltro === 'hoje' ? getPedidosParaDespacho() : getPedidosAtrasados();
  
  const [pedidosSelecionados, setPedidosSelecionados] = useState<string[]>([]);

  // Filtrar apenas pedidos com substatus válido para despacho
  const pedidosFiltrados = pedidos.filter(p => 
    p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado'
  );

  const toggleSelecao = (pedidoId: string) => {
    setPedidosSelecionados(prev => 
      prev.includes(pedidoId) 
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const selecionarTodos = () => {
    if (pedidosSelecionados.length === pedidosFiltrados.length) {
      setPedidosSelecionados([]);
    } else {
      setPedidosSelecionados(pedidosFiltrados.map(p => p.id));
    }
  };

  const handleDespachoEmMassa = async () => {
    const pedidosParaDespachar = pedidosFiltrados.filter(p => 
      pedidosSelecionados.includes(p.id) && p.substatus_pedido === 'Separado'
    );
    
    if (pedidosParaDespachar.length > 0) {
      await confirmarDespachoEmMassa(pedidosParaDespachar);
      setPedidosSelecionados([]);
    }
  };

  const handleEntregaEmMassa = async () => {
    const pedidosParaEntregar = pedidosFiltrados.filter(p => 
      pedidosSelecionados.includes(p.id)
    );
    
    if (pedidosParaEntregar.length > 0) {
      await confirmarEntregaEmMassa(pedidosParaEntregar);
      setPedidosSelecionados([]);
    }
  };

  const handleRetornoEmMassa = async () => {
    const pedidosParaRetorno = pedidosFiltrados.filter(p => 
      pedidosSelecionados.includes(p.id)
    );
    
    if (pedidosParaRetorno.length > 0) {
      await confirmarRetornoEmMassa(pedidosParaRetorno);
      setPedidosSelecionados([]);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando pedidos...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {tipoFiltro === 'hoje' ? 'Despacho de Pedidos - Hoje' : 'Despacho de Pedidos - Atrasados'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {pedidosFiltrados.length} pedidos prontos para despacho
          </p>
        </div>

        {pedidosFiltrados.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selecionarTodos}
            >
              {pedidosSelecionados.length === pedidosFiltrados.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
            
            {pedidosSelecionados.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDespachoEmMassa}
                  className="text-blue-600 border-blue-200"
                  disabled={!pedidosFiltrados.some(p => 
                    pedidosSelecionados.includes(p.id) && p.substatus_pedido === 'Separado'
                  )}
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Despachar Selecionados
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEntregaEmMassa}
                  className="text-green-600 border-green-200"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Entregar Selecionados
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetornoEmMassa}
                  className="text-orange-600 border-orange-200"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retorno Selecionados
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
          <p>Não há pedidos para despacho {tipoFiltro === 'hoje' ? 'hoje' : 'atrasados'}.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={pedidosSelecionados.length === pedidosFiltrados.length && pedidosFiltrados.length > 0}
                  onChange={selecionarTodos}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Data Entrega</TableHead>
              <TableHead>PDV</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidosFiltrados.map((pedido) => (
              <TableRow 
                key={pedido.id}
                className={pedidosSelecionados.includes(pedido.id) ? "bg-blue-50" : ""}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={pedidosSelecionados.includes(pedido.id)}
                    onChange={() => toggleSelecao(pedido.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>{formatDate(new Date(pedido.data_prevista_entrega))}</TableCell>
                <TableCell className="font-medium">{pedido.cliente_nome}</TableCell>
                <TableCell>{pedido.cliente_endereco || 'Não informado'}</TableCell>
                <TableCell>{pedido.cliente_telefone || 'Não informado'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={pedido.substatus_pedido === 'Despachado' ? 'default' : 'secondary'}
                    className={
                      pedido.substatus_pedido === 'Despachado' 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {pedido.substatus_pedido === 'Despachado' ? 'Despachado' : 'Separado'}
                  </Badge>
                </TableCell>
                <TableCell>{pedido.quantidade_total} unidades</TableCell>
                <TableCell>
                  <Badge variant={pedido.tipo_pedido === "Padrão" ? "default" : "destructive"}>
                    {pedido.tipo_pedido}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {pedido.substatus_pedido === 'Separado' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmarDespacho(pedido.id)}
                        className="text-blue-600 border-blue-200"
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmarEntrega(pedido.id)}
                      className="text-green-600 border-green-200"
                      title="Confirmar Entrega"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmarRetorno(pedido.id)}
                      className="text-orange-600 border-orange-200"
                      title="Confirmar Retorno"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => desfazerSeparacao(pedido.id)}
                      className="text-gray-600 border-gray-200"
                      title="Retornar à Separação"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};
