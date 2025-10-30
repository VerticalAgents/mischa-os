import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import ProjecaoResultadosPDV from "@/pages/gestao-financeira/ProjecaoResultadosPDV";

export default function ProjecaoPDVTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Projeção por PDV
        </h2>
        <p className="text-muted-foreground mt-1">Análise de rentabilidade por ponto de venda</p>
      </div>

      {/* Content */}
      <ProjecaoResultadosPDV />
    </div>
  );
}
