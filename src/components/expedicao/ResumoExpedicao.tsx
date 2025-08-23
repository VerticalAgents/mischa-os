
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { ResumoQuantidadeProdutos } from "./components/ResumoQuantidadeProdutos";
import { CalculosModal } from "./components/CalculosModal";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calculator } from "lucide-react";

const ResumoExpedicao = () => {
  const { 
    pedidos, 
    isLoading, 
    carregarPedidos 
  } = useExpedicaoStore();

  const [calculosModalAberto, setCalculosModalAberto] = useState(false);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // Filtrar pedidos para separação (Agendado e não separados ainda)
  const pedidosParaSeparacao = pedidos.filter(pedido => 
    !pedido.substatus_pedido || 
    pedido.substatus_pedido === 'Agendado'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Resumo da Expedição</h2>
          <p className="text-muted-foreground">
            Visão geral dos pedidos e quantidades para separação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setCalculosModalAberto(true)} 
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Calculator className="h-4 w-4" />
            Cálculos Detalhados
          </Button>
          <Button 
            onClick={() => carregarPedidos()} 
            size="sm"
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Resumo de Quantidades de Produtos */}
      <ResumoQuantidadeProdutos pedidos={pedidosParaSeparacao} />

      {/* Modal de Cálculos */}
      <CalculosModal
        open={calculosModalAberto}
        onOpenChange={setCalculosModalAberto}
      />
    </div>
  );
};

export default ResumoExpedicao;
