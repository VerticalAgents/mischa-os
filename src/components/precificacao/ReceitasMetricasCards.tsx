
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat, CheckCircle, AlertCircle, DollarSign } from "lucide-react";

interface ReceitasMetricasCardsProps {
  metricas: {
    totalReceitas: number;
    receitasAtivas: number;
    receitasVazias: number;
    receitasCustoAlto: number;
  };
  loading?: boolean;
}

export function ReceitasMetricasCards({ metricas, loading }: ReceitasMetricasCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-1" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">{metricas.totalReceitas}</div>
        <div className="text-sm text-muted-foreground">Total de Receitas</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{metricas.receitasAtivas}</div>
        <div className="text-sm text-muted-foreground">Ativas</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">{metricas.receitasVazias}</div>
        <div className="text-sm text-muted-foreground">Vazias</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{metricas.receitasCustoAlto}</div>
        <div className="text-sm text-muted-foreground">Custo Alto</div>
      </div>
    </div>
  );
}
