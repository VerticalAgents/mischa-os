import { useEffect } from "react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { DataTableViewOptions } from "./data-table/data-table-view-options";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SeparacaoPedidoActions } from "./SeparacaoPedidoActions";
import { PrintingActions } from "./PrintingActions";
import { DebugInfo } from "./DebugInfo";
import { ResumoQuantidadesSeparacao } from "./ResumoQuantidadesSeparacao";

export function SeparacaoPedidos() {
  const { 
    pedidos, 
    isLoading, 
    carregarPedidos, 
    confirmarSeparacao, 
    desfazerSeparacao, 
    marcarTodosSeparados,
    getPedidosParaSeparacao 
  } = useExpedicaoStore();
  
  useEffect(() => {
    if (pedidos.length === 0 && !isLoading) {
      carregarPedidos();
    }
  }, [pedidos, isLoading, carregarPedidos]);

  const pedidosParaSeparacao = getPedidosParaSeparacao();

  const columns: ColumnDef<typeof pedidos[0]>[] = [
    {
      accessorKey: "cliente_nome",
      header: "Cliente",
    },
    {
      accessorKey: "quantidade_total",
      header: "Quantidade",
    },
    {
      accessorKey: "data_prevista_entrega",
      header: "Data Entrega",
      cell: ({ row }) => {
        const date = new Date(row.getValue("data_prevista_entrega"));
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <SeparacaoPedidoActions 
          pedido={row.original} 
          onConfirmarSeparacao={confirmarSeparacao}
          onDesfazerSeparacao={desfazerSeparacao}
        />
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Separação de Pedidos</h2>
          <p className="text-muted-foreground">
            Pedidos que precisam ser separados para entrega hoje
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <PrintingActions />
          {pedidosParaSeparacao.length > 0 && (
            <Button
              onClick={() => marcarTodosSeparados(pedidosParaSeparacao)}
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Todos Separados
            </Button>
          )}
        </div>
      </div>

      <ResumoQuantidadesSeparacao pedidos={pedidosParaSeparacao} />

      <DebugInfo pedidos={pedidosParaSeparacao} />

      <DataTableViewOptions tableName="separacao-pedidos-colunas" />
      <DataTable 
        columns={columns} 
        data={pedidosParaSeparacao} 
        isLoading={isLoading} 
      />
    </div>
  );
}
