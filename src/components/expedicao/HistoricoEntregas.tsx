
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const HistoricoEntregas = () => {
  const [filtroHistorico, setFiltroHistorico] = useState<string>("todos");
  
  // Obter pedidos do store
  const pedidos = usePedidoStore(state => state.pedidos);
  
  // Filtrar pedidos conforme requisitos: apenas os com status Entregue ou Retorno
  const pedidosHistorico = pedidos.filter(pedido => 
    pedido.substatusPedido === "Entregue" || 
    pedido.substatusPedido === "Retorno"
  );
  
  // Filtrar com base na tab selecionada
  const pedidosFiltrados = pedidosHistorico.filter(pedido => {
    if (filtroHistorico === "entregues") {
      return pedido.substatusPedido === "Entregue";
    } else if (filtroHistorico === "retornos") {
      return pedido.substatusPedido === "Retorno";
    } else {
      return true; // "todos"
    }
  });
  
  // Ordenar por data (do mais recente para o mais antigo)
  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => {
    const dataA = a.dataEfetivaEntrega ? new Date(a.dataEfetivaEntrega) : new Date(a.dataPrevistaEntrega);
    const dataB = b.dataEfetivaEntrega ? new Date(b.dataEfetivaEntrega) : new Date(b.dataPrevistaEntrega);
    return dataB.getTime() - dataA.getTime();
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
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="entregues" className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-600" /> Entregas Confirmadas
          </TabsTrigger>
          <TabsTrigger value="retornos" className="flex items-center gap-1">
            <X className="h-4 w-4 text-red-600" /> Retornos
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
          <TableHead>Data da Entrega</TableHead>
          <TableHead>PDV</TableHead>
          <TableHead>Status Final</TableHead>
          <TableHead>Turno</TableHead>
          <TableHead>Observações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((pedido) => {
          const dataExibicao = pedido.dataEfetivaEntrega 
            ? formatDate(new Date(pedido.dataEfetivaEntrega)) 
            : formatDate(new Date(pedido.dataPrevistaEntrega));
            
          return (
            <TableRow key={pedido.id}>
              <TableCell>{dataExibicao}</TableCell>
              <TableCell>{pedido.cliente?.nome || "Pedido Único"}</TableCell>
              <TableCell>
                {pedido.substatusPedido === "Entregue" ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Check className="h-4 w-4" /> Entregue
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <X className="h-4 w-4" /> Retorno
                  </span>
                )}
              </TableCell>
              <TableCell>{pedido.turno || "—"}</TableCell>
              <TableCell>
                {pedido.observacoes ? (
                  <div className="max-w-[250px] truncate">{pedido.observacoes}</div>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
