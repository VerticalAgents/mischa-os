
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ProductionSummaryProps {
  getTotalUnidadesAgendadas: () => number;
  getTotalFormasNecessarias: () => number;
  getTotalLotesNecessarios?: () => number;
}

export default function ProductionSummary({
  getTotalUnidadesAgendadas,
  getTotalFormasNecessarias,
  getTotalLotesNecessarios = () => 0 // Default implementation if not provided
}: ProductionSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da Produção</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium block text-muted-foreground">Total de unidades:</span>
            <span className="text-2xl font-semibold">{getTotalUnidadesAgendadas()}</span>
          </div>
          <div>
            <span className="text-sm font-medium block text-muted-foreground">Total de formas:</span>
            <span className="text-2xl font-semibold">{getTotalFormasNecessarias()}</span>
          </div>
          <Alert className="mt-4">
            <AlertTitle>Próxima produção</AlertTitle>
            <AlertDescription>
              Você precisa agendar {getTotalFormasNecessarias()} {getTotalFormasNecessarias() === 1 ? 'forma' : 'formas'} para atender a demanda semanal.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
