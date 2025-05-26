
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const HistoricoEntregas = () => {
  const [filtroHistorico, setFiltroHistorico] = useState<string>("todos");
  
  const { pedidos } = useExpedicaoStore();
  
  // Usar hook de sincronização
  const { carregarPedidos } = useExpedicaoSync();

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);
  
  // Filtrar pedidos conforme requisitos: apenas os com substatus Entregue ou Retorno
  const pedidosHistorico = pedidos.filter(pedido => 
    pedido.substatus_pedido === "Entregue" || 
    pedido.substatus_pedido === "Retorno"
  );
  
  // Filtrar com base na tab selecionada
  const pedidosFiltrados = pedidosHistorico.filter(pedido => {
    if (filtroHistorico === "entregues") {
      return pedido.substatus_pedido === "Entregue";
    } else if (filtroHistorico === "retornos") {
      return pedido.substatus_pedido === "Retorno";
    } else {
      return true; // "todos"
    }
  });
  
  // Ordenar por data (do mais recente para o mais antigo)
  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Histórico de Entregas</h2>
        <p className="text-sm text-muted-foreground">
          Visualize o histórico de entregas e retornos ordenados do mais recente para o mais antigo.
        </p>
      </div>

      <Tabs 
        defaultValue="todos" 
        value={filtroHistorico}
        onValueChange={setFiltroHistorico}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos ({pedidosOrdenados.length})</TabsTrigger>
          <TabsTrigger value="entregues" className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-600" /> Entregas Confirmadas ({pedidosHistorico.filter(p => p.substatus_pedido === "Entregue").length})
          </TabsTrigger>
          <TabsTrigger value="retornos" className="flex items-center gap-1">
            <X className="h-4 w-4 text-red-600" /> Retornos ({pedidosHistorico.filter(p => p.substatus_pedido === "Retorno").length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos">
          <HistoricoTable pedidos={pedidosOrdenados} />
        </TabsContent>
        
        <TabsContent value="entregues">
          <HistoricoTable pedidos={pedidosOrdenados} />
        </TabsContent>
        
        <TabsContent value="retornos">
          <HistoricoTable pedidos={pedidosOrdenados} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

// Componente de tabela separado para reutilização
const HistoricoTable = ({ pedidos }: { pedidos: any[] }) => {
  if (pedidos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Não há registros no histórico com os filtros selecionados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data da Operação</TableHead>
          <TableHead>PDV</TableHead>
          <TableHead>Status Final</TableHead>
          <TableHead>Quantidade</TableHead>
          <TableHead>Tipo Pedido</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((pedido) => {
          return (
            <TableRow key={pedido.id}>
              <TableCell>{formatDate(new Date(pedido.created_at))}</TableCell>
              <TableCell>{pedido.cliente_nome}</TableCell>
              <TableCell>
                {pedido.substatus_pedido === "Entregue" ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Check className="h-4 w-4" /> Entregue
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <X className="h-4 w-4" /> Retorno
                  </span>
                )}
              </TableCell>
              <TableCell>{pedido.quantidade_total} unidades</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  pedido.tipo_pedido === "Padrão" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {pedido.tipo_pedido}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
