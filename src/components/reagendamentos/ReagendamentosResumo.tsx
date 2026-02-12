import { CalendarClock, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReagendamentosResumoProps {
  total: number;
  adiamentos: number;
  adiantamentos: number;
  mediaSemanas: number;
  topClientes: { nome: string; count: number }[];
}

export default function ReagendamentosResumo({ total, adiamentos, adiantamentos, mediaSemanas, topClientes }: ReagendamentosResumoProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Reagendamentos</CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">média de {mediaSemanas.toFixed(1)} semanas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Adiamentos</CardTitle>
          <TrendingUp className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{adiamentos}</div>
          <p className="text-xs text-muted-foreground">movidos para semana posterior</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Adiantamentos</CardTitle>
          <TrendingDown className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{adiantamentos}</div>
          <p className="text-xs text-muted-foreground">movidos para semana anterior</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes que Mais Reagendam</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {topClientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dado ainda</p>
          ) : (
            <div className="space-y-1">
              {topClientes.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.nome}</span>
                  <span className="font-medium text-muted-foreground">{c.count}x</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
