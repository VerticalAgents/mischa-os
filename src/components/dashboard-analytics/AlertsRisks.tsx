
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react";
import { Cliente, Pedido, Alerta } from "@/types";

interface AlertsRisksProps {
  clientes: Cliente[];
  pedidos: Pedido[];
  registrosProducao: any[];
  planejamentoProducao: any[];
}

export default function AlertsRisks({ clientes, pedidos, registrosProducao, planejamentoProducao }: AlertsRisksProps) {
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  
  useEffect(() => {
    const generatedAlerts: Alerta[] = [];
    
    // Check for low stock clients
    clientes.forEach((cliente, index) => {
      if (cliente.statusCliente === 'Ativo' && cliente.giroMedioSemanal && cliente.giroMedioSemanal < 10) {
        generatedAlerts.push({
          id: index + 1,
          tipo: 'EstoqueAbaixoMinimo',
          mensagem: `Cliente ${cliente.nome} com giro semanal baixo (${cliente.giroMedioSemanal})`,
          dataAlerta: new Date(),
          lida: false,
          dados: { clienteId: cliente.id, giroSemanal: cliente.giroMedioSemanal }
        });
      }
    });
    
    // Check for clients without recent orders
    clientes.forEach((cliente, index) => {
      const lastOrder = pedidos
        .filter(pedido => pedido.cliente?.id === cliente.id)
        .sort((a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime())[0];
      
      if (cliente.statusCliente === 'Ativo' && (!lastOrder || (new Date().getTime() - new Date(lastOrder.dataPedido).getTime()) > 30 * 24 * 60 * 60 * 1000)) {
        generatedAlerts.push({
          id: generatedAlerts.length + 1,
          tipo: 'ProximasEntregas',
          mensagem: `Cliente ${cliente.nome} sem pedidos nos últimos 30 dias`,
          dataAlerta: new Date(),
          lida: false,
          dados: { clienteId: cliente.id }
        });
      }
    });
    
    // Check for overdue production
    if (planejamentoProducao.length > 0) {
      planejamentoProducao.forEach((producao, index) => {
        if (new Date(producao.dataProducao) < new Date() && producao.status !== 'Concluído') {
          generatedAlerts.push({
            id: generatedAlerts.length + 1,
            tipo: 'PedidoPronto',
            mensagem: `Produção de ${producao.produtoNome} atrasada desde ${new Date(producao.dataProducao).toLocaleDateString()}`,
            dataAlerta: new Date(),
            lida: false,
            dados: { producaoId: producao.id }
          });
        }
      });
    }
    
    setAlerts(generatedAlerts);
  }, [clientes, pedidos, registrosProducao, planejamentoProducao]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Alertas e Riscos</h2>
      {alerts.length === 0 ? (
        <p>Nenhum alerta ou risco detectado.</p>
      ) : (
        alerts.map((alert, index) => (
          <Alert key={index} variant={alert.tipo === 'PedidoPronto' ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{alert.mensagem}</AlertDescription>
          </Alert>
        ))
      )}
    </div>
  );
}
