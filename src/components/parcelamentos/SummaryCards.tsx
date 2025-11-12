import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, AlertCircle, Calendar, TrendingUp } from "lucide-react";
import { useResumoParcelamentos } from "@/hooks/useResumoParcelamentos";

export function SummaryCards() {
  const { resumo, isLoading } = useResumoParcelamentos();

  if (isLoading || !resumo) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Parcelamentos Ativos
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{resumo.total_parcelamentos_ativos}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total em aberto
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Valor Total Pendente
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(resumo.valor_total_pendente)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Soma de todas as parcelas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vencendo este Mês
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{resumo.parcelas_vencendo_mes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(resumo.valor_vencendo_mes)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Parcelas Atrasadas
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{resumo.parcelas_atrasadas}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(resumo.valor_atrasado)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
