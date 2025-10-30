import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import PontoEquilibrio from "@/pages/gestao-financeira/PontoEquilibrio";

export default function PontoEquilibrioTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Ponto de Equilíbrio
        </h2>
        <p className="text-muted-foreground mt-1">Análise detalhada do break-even point</p>
      </div>

      {/* Content */}
      <PontoEquilibrio />
    </div>
  );
}
