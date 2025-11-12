import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCards } from "@/components/parcelamentos/SummaryCards";
import { NovoParcelamentoDialog } from "@/components/parcelamentos/NovoParcelamentoDialog";
import { TabelaParcelamentos } from "@/components/parcelamentos/TabelaParcelamentos";

export function ParcelamentosTab() {
  return (
    <div className="space-y-6">
      <SummaryCards />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Parcelamentos</CardTitle>
          <NovoParcelamentoDialog />
        </CardHeader>
        <CardContent>
          <TabelaParcelamentos />
        </CardContent>
      </Card>
    </div>
  );
}
