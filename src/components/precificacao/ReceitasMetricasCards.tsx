
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{metricas.totalReceitas}</div>
          <p className="text-xs text-muted-foreground">Total de Receitas</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{metricas.receitasAtivas}</div>
          <p className="text-xs text-muted-foreground">Receitas Ativas</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{metricas.receitasVazias}</div>
          <p className="text-xs text-muted-foreground">Receitas Vazias</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-red-600">{metricas.receitasCustoAlto}</div>
          <p className="text-xs text-muted-foreground">Custo Alto</p>
        </CardContent>
      </Card>
    </div>
  );
}
