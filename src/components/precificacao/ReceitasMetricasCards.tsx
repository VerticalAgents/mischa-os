
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Receitas",
      value: metricas.totalReceitas,
      description: "receitas cadastradas",
      icon: ChefHat,
      color: "text-blue-600"
    },
    {
      title: "Receitas Ativas",
      value: metricas.receitasAtivas,
      description: "com ingredientes",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Receitas Vazias",
      value: metricas.receitasVazias,
      description: "sem ingredientes",
      icon: AlertCircle,
      color: "text-yellow-600"
    },
    {
      title: "Custo Elevado",
      value: metricas.receitasCustoAlto,
      description: "acima de R$ 50",
      icon: DollarSign,
      color: "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
