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
  const pedidosSeparados = pedidos.filter(p => p.substatus_pedido === 'Separado');
  const pedidosDespachados = pedidos.filter(p => p.substatus_pedido === 'Despachado');
  
  const totalUnidades = pedidos.reduce((acc, p) => acc + (p.quantidade_total || 0), 0);
  const totalPedidos = pedidos.length;

  const getConfiguracao = () => {
    switch (tipo) {
      case "hoje":
        return {
          titulo: "Entregas de Hoje",
          icone: <Truck className="h-5 w-5" />,
          corDestaque: "text-green-600",
          bgDestaque: "bg-green-50"
        };
      case "pendentes":
        return {
          titulo: "Entregas Pendentes",
          icone: <Clock className="h-5 w-5" />,
          corDestaque: "text-yellow-600",
          bgDestaque: "bg-yellow-50"
        };
      case "antecipada":
        return {
          titulo: "Separação Antecipada",
          icone: <CheckCircle className="h-5 w-5" />,
          corDestaque: "text-blue-600",
          bgDestaque: "bg-blue-50"
        };
    }
  };

  const config = getConfiguracao();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {config.icone}
          {config.titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bloco de destaque com total */}
        <div className={`p-4 rounded-lg ${config.bgDestaque}`}>
          <p className="text-sm text-muted-foreground mb-1">Quantidade Total</p>
          <p className={`text-4xl font-bold ${config.corDestaque}`}>
            {totalUnidades}
          </p>
          <Badge variant="secondary" className="mt-2">
            {totalPedidos} {totalPedidos === 1 ? 'pedido' : 'pedidos'}
          </Badge>
        </div>

        {/* Grid com status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Separados</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {pedidosSeparados.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Despachados</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {pedidosDespachados.length}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
