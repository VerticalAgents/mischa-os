
import React from "react";
import { Card } from "@/components/ui/card";
import { Package, Truck, Clock, CheckCircle } from "lucide-react";

interface ResumoStatusCardProps {
  tipo: "hoje" | "pendentes";
  pedidos: any[];
}

export const ResumoStatusCard = ({ tipo, pedidos }: ResumoStatusCardProps) => {
  if (tipo === "hoje") {
    const pedidosSeparados = pedidos.filter(p => p.substatus_pedido === 'Separado');
    const pedidosDespachados = pedidos.filter(p => p.substatus_pedido === 'Despachado');
    
    return (
      <Card className="p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Status dos Pedidos - Entregas de Hoje</h3>
          </div>
          <div className="text-sm text-blue-600">
            Total: {pedidos.length} pedidos
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Package className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{pedidosSeparados.length}</div>
              <div className="text-sm text-yellow-600">Separados</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-700">{pedidosDespachados.length}</div>
              <div className="text-sm text-green-600">Despachados</div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Para entregas pendentes
  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-800">Status dos Pedidos - Entregas Pendentes</h3>
        </div>
        <div className="text-sm text-orange-600">
          Total: {pedidos.length} pedidos
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 mt-4 bg-red-50 rounded-lg border border-red-200">
        <Clock className="h-8 w-8 text-red-600" />
        <div>
          <div className="text-2xl font-bold text-red-700">{pedidos.length}</div>
          <div className="text-sm text-red-600">Agendamentos Pendentes</div>
        </div>
      </div>
    </Card>
  );
};
