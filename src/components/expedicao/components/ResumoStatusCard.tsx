
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, CheckCircle } from "lucide-react";

interface PedidoExpedicao {
  id: string;
  cliente_nome: string;
  substatus_pedido?: string;
  quantidade_total: number;
  data_prevista_entrega: Date;
}

interface ResumoStatusCardProps {
  tipo: "hoje" | "pendentes" | "antecipada";
  pedidos: PedidoExpedicao[];
}

export const ResumoStatusCard = ({ tipo, pedidos }: ResumoStatusCardProps) => {
  if (tipo === "hoje") {
    const pedidosSeparados = pedidos.filter(p => p.substatus_pedido === 'Separado');
    const pedidosDespachados = pedidos.filter(p => p.substatus_pedido === 'Despachado');
    
    return (
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-800 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Resumo - Entregas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Separados</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {pedidosSeparados.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Despachados</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {pedidosDespachados.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tipo === "pendentes") {
    return (
      <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Resumo - Entregas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">Total de Agendamentos</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {pedidos.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tipo === "antecipada") {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Resumo - Separação Antecipada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Separados com Antecedência</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {pedidos.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
