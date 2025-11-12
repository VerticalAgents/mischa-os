import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { TabelaCartoes } from "@/components/parcelamentos/TabelaCartoes";
import { CartaoFormDialog } from "@/components/parcelamentos/CartaoFormDialog";

export default function CartoesTab() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Cartões de Crédito</CardTitle>
          </div>
          <CardDescription>
            Gerencie os cartões de crédito utilizados para parcelamentos
          </CardDescription>
        </div>
        <CartaoFormDialog />
      </CardHeader>
      <CardContent>
        <TabelaCartoes />
      </CardContent>
    </Card>
  );
}
