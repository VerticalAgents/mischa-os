
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { usePedidoConverter } from "./hooks/usePedidoConverter";
import { DebugInfo } from "./components/DebugInfo";
import PedidoCard from "./PedidoCard";
import { toast } from "sonner";
import { Truck, Package } from "lucide-react";

interface DespachoProps {
  tipoFiltro: "hoje" | "atrasadas";
}

export const Despacho = ({ tipoFiltro }: DespachoProps) => {
  const {
    pedidos,
    isLoading,
    confirmarDespacho,
    confirmarEntrega,
    confirmarRetorno,
    confirmarDespachoEmMassa,
    confirmarEntregaEmMassa,
    confirmarRetornoEmMassa,
    getPedidosParaDespacho,
    getPedidosAtrasados,
    carregarPedidos
  } = useExpedicaoStore();

  const { converterPedidoParaCard } = usePedidoConverter();

  // Usar hook de sincronização
  useExpedicaoSync();

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // Obter pedidos filtrados baseado no tipo
  const pedidosFiltrados = tipoFiltro === "hoje" 
    ? getPedidosParaDespacho() 
    : getPedidosAtrasados();

  const handleDespachoEmMassa = async () => {
    if (pedidosFiltrados.length === 0) {
      toast.error("Não há pedidos para despachar.");
      return;
    }
    
    await confirmarDespachoEmMassa(pedidosFiltrados);
  };

  const handleEntregaEmMassa = async () => {
    if (pedidosFiltrados.length === 0) {
      toast.error("Não há pedidos para entregar.");
      return;
    }
    
    await confirmarEntregaEmMassa(pedidosFiltrados);
  };

  const handleRetornoEmMassa = async () => {
    if (pedidosFiltrados.length === 0) {
      toast.error("Não há pedidos para marcar como retorno.");
      return;
    }
    
    await confirmarRetornoEmMassa(pedidosFiltrados);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando pedidos...</div>
          </div>
        </Card>
      </div>
    );
  }

  const titulo = tipoFiltro === "hoje" ? "Entregas de Hoje" : "Entregas Atrasadas (Ontem)";
  const icone = tipoFiltro === "hoje" ? <Truck className="h-5 w-5" /> : <Package className="h-5 w-5" />;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {icone}
            {titulo}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleDespachoEmMassa} 
              size="sm" 
              variant="outline"
              className="flex items-center gap-1"
            >
              <Truck className="h-4 w-4" /> Despachar Todos
            </Button>
            <Button 
              onClick={handleEntregaEmMassa} 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
            >
              <Package className="h-4 w-4 mr-1" /> Entregar Todos
            </Button>
            <Button 
              onClick={handleRetornoEmMassa} 
              size="sm" 
              variant="destructive"
            >
              Retorno em Massa
            </Button>
          </div>
        </div>
        
        {/* Debug Info Component */}
        <DebugInfo tipo="despacho" dadosAtivos={pedidosFiltrados} />
        
        {pedidosFiltrados.length > 0 ? (
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido) => (
              <PedidoCard 
                key={pedido.id}
                pedido={converterPedidoParaCard(pedido)}
                onMarcarSeparado={() => {}} // Não usado no despacho
                onEditarAgendamento={() => {}} // Não usado no despacho
                showDespachoActions={true}
                onConfirmarDespacho={() => confirmarDespacho(String(pedido.id))}
                onConfirmarEntrega={(observacao) => confirmarEntrega(String(pedido.id), observacao)}
                onConfirmarRetorno={(observacao) => confirmarRetorno(String(pedido.id), observacao)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {tipoFiltro === "hoje" 
              ? "Não há pedidos agendados para entrega hoje."
              : "Não há pedidos atrasados pendentes."
            }
          </div>
        )}
      </Card>
    </div>
  );
};
