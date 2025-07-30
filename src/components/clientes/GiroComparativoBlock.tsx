
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Cliente } from "@/types";

interface GiroComparativoBlockProps {
  cliente: Cliente;
  mediaHistorica: number;
  giroMedioGeral?: number;
}

export default function GiroComparativoBlock({ 
  cliente, 
  mediaHistorica, 
  giroMedioGeral = 150 
}: GiroComparativoBlockProps) {
  // Calcular percentual comparativo com giro geral
  const percentualVsGeral = Math.round((mediaHistorica / giroMedioGeral) * 100);
  const isAcimaGeral = percentualVsGeral >= 100;
  
  // Status baseado na performance
  const getStatusColor = () => {
    if (percentualVsGeral >= 120) return "bg-green-500";
    if (percentualVsGeral >= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (percentualVsGeral >= 120) return "Excelente";
    if (percentualVsGeral >= 100) return "Acima da média";
    if (percentualVsGeral >= 80) return "Próximo à média";
    return "Abaixo da média";
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isAcimaGeral ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
          Comparativo de Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Giro do Cliente</p>
            <p className="text-2xl font-bold">{mediaHistorica} <span className="text-sm font-normal">un/sem</span></p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Giro Médio Geral</p>
            <p className="text-2xl font-bold">{giroMedioGeral} <span className="text-sm font-normal">un/sem</span></p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Performance</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{percentualVsGeral}%</p>
              <Badge 
                variant="outline" 
                className="flex items-center gap-1"
              >
                <span 
                  className={`w-2 h-2 rounded-full ${getStatusColor()}`}
                />
                {getStatusText()}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Este cliente está <strong>{isAcimaGeral ? 'acima' : 'abaixo'}</strong> da média geral de giro, 
            com uma diferença de <strong>{Math.abs(percentualVsGeral - 100)}%</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
