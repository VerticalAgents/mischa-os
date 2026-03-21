import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCards } from "@/components/parcelamentos/SummaryCards";
import { NovoParcelamentoDialog } from "@/components/parcelamentos/NovoParcelamentoDialog";
import { TabelaParcelamentos } from "@/components/parcelamentos/TabelaParcelamentos";
import { useEditPermission } from "@/contexts/EditPermissionContext";

export function ParcelamentosTab() {
  const { canEdit } = useEditPermission();

  return (
    <div className="space-y-6">
      <SummaryCards />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Parcelamentos</CardTitle>
          {canEdit && <NovoParcelamentoDialog />}
        </CardHeader>
        <CardContent>
          <TabelaParcelamentos />
        </CardContent>
      </Card>
    </div>
  );
}
