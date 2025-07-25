
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowRight, Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import { Cliente } from "@/types";

interface GiroComparativoBlockProps {
  cliente: Cliente;
  mediaHistorica: number;
}

export default function GiroComparativoBlock({ cliente, mediaHistorica }: GiroComparativoBlockProps) {
  // Calcular giro semanal com base na quantidade padrão e periodicidade
  const giroSemanalCalculado = cliente.periodicidadePadrao > 0 
    ? Math.round((cliente.quantidadePadrao / cliente.periodicidadePadrao) * 7)
    : 0;

  // Calcular diferença absoluta e percentual
  const diferencaAbsoluta = mediaHistorica - giroSemanalCalculado;
  const diferencaPercentual = giroSemanalCalculado > 0 
    ? Math.round((diferencaAbsoluta / giroSemanalCalculado) * 100)
    : 0;

  // Determinar status baseado na diferença percentual
  const getStatus = () => {
    const absPercentual = Math.abs(diferencaPercentual);
    if (absPercentual <= 10) return { color: 'green', label: 'Bem ajustado' };
    if (absPercentual <= 25) return { color: 'yellow', label: 'Ajuste moderado' };
    return { color: 'red', label: 'Requer ajuste' };
  };

  const status = getStatus();

  // Renderizar ícone de tendência
  const renderTrendIcon = () => {
    if (Math.abs(diferencaPercentual) <= 5) {
      return <ArrowRight className="h-4 w-4 text-gray-500" />;
    }
    return diferencaAbsoluta > 0 
      ? <ArrowUp className="h-4 w-4 text-green-600" />
      : <ArrowDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Comparativo: Histórico vs Calculado
          </CardTitle>
          <Badge 
            variant={status.color === 'green' ? 'default' : 'secondary'}
            className={`${
              status.color === 'green' ? 'bg-green-100 text-green-800' :
              status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            {status.label}
          </Badge>
        </div>
        <CardDescription>
          Comparação entre o giro médio histórico e o giro calculado com base nos parâmetros configurados
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Giro Histórico */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Histórico Real</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{mediaHistorica}</div>
            <div className="text-xs text-blue-600">unidades/semana</div>
          </div>

          {/* Ícone de comparação */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              {renderTrendIcon()}
              <span className="text-sm font-medium text-gray-600">
                {diferencaAbsoluta === 0 ? 'Igual' : 
                 diferencaAbsoluta > 0 ? `+${diferencaAbsoluta}` : 
                 diferencaAbsoluta.toString()}
              </span>
              {diferencaPercentual !== 0 && (
                <span className="text-xs text-gray-500">
                  ({diferencaPercentual > 0 ? '+' : ''}{diferencaPercentual}%)
                </span>
              )}
            </div>
          </div>

          {/* Giro Calculado */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Calculado</span>
            </div>
            <div className="text-2xl font-bold text-gray-700">{giroSemanalCalculado}</div>
            <div className="text-xs text-gray-600">unidades/semana</div>
          </div>
        </div>

        {/* Detalhes do cálculo */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-gray-700 mb-2">Detalhes do Cálculo:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Quantidade Padrão:</span>
              <span className="font-medium ml-2">{cliente.quantidadePadrao} unidades</span>
            </div>
            <div>
              <span className="text-gray-600">Periodicidade:</span>
              <span className="font-medium ml-2">{cliente.periodicidadePadrao} dias</span>
            </div>
            <div>
              <span className="text-gray-600">Fórmula:</span>
              <span className="font-mono ml-2 text-xs">
                ({cliente.quantidadePadrao} ÷ {cliente.periodicidadePadrao}) × 7
              </span>
            </div>
          </div>
        </div>

        {/* Recomendações */}
        {Math.abs(diferencaPercentual) > 10 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-800">Recomendação:</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  {diferencaAbsoluta > 0 
                    ? `O histórico mostra ${diferencaAbsoluta} unidades/semana acima do calculado. Considere aumentar a quantidade padrão ou reduzir a periodicidade.`
                    : `O histórico mostra ${Math.abs(diferencaAbsoluta)} unidades/semana abaixo do calculado. Considere reduzir a quantidade padrão ou aumentar a periodicidade.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
