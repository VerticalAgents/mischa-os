import { useState, useEffect } from "react";
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react";
import { Cliente, Pedido } from "@/types";

interface AlertsRisksProps {
  clientes: Cliente[];
  pedidos: Pedido[];
  registrosProducao: any[];
  planejamentoProducao: any[];
}

export default function AlertsRisks({ clientes, pedidos, registrosProducao, planejamentoProducao }: AlertsRisksProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  useEffect(() => {
    const generatedAlerts: Alert[] = [];
    
    // Check for low stock clients
    clientes.forEach((cliente, index) => {
      if (cliente.statusCliente === 'Ativo' && cliente.giroMedioSemanal && cliente.giroMedioSemanal < 10) {
        generatedAlerts.push({
          id: index + 1,
          type: 'warning',
          title: 'Giro baixo',
          message: `Cliente ${cliente.nome} com giro semanal baixo (${cliente.giroMedioSemanal})`,
          timestamp: new Date(),
          severity: 'medium'
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
          type: 'warning',
          title: 'Sem pedidos recentes',
          message: `Cliente ${cliente.nome} sem pedidos nos últimos 30 dias`,
          timestamp: new Date(),
          severity: 'medium'
        });
      }
    });
    
    // Check for overdue production
    if (planejamentoProducao.length > 0) {
      planejamentoProducao.forEach((producao, index) => {
        if (new Date(producao.dataProducao) < new Date() && producao.status !== 'Concluído') {
          generatedAlerts.push({
            id: generatedAlerts.length + 1,
            type: 'error',
            title: 'Produção Atrasada',
            message: `Produção de ${producao.produtoNome} atrasada desde ${new Date(producao.dataProducao).toLocaleDateString()}`,
            timestamp: new Date(),
            severity: 'high'
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
          <Alert key={index} variant={alert.type}>
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{alert.message}</p>
          </Alert>
        ))
      )}
    </div>
  );
}
