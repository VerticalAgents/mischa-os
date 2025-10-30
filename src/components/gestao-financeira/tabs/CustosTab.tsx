import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import Custos from "@/pages/financeiro/Custos";

export default function CustosTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Controle de Custos
        </h2>
        <p className="text-muted-foreground mt-1">Gerencie custos fixos e variáveis da operação</p>
      </div>

      {/* Content dentro de Card */}
      <Card>
        <CardContent className="pt-6">
          <Custos />
        </CardContent>
      </Card>
    </div>
  );
}
