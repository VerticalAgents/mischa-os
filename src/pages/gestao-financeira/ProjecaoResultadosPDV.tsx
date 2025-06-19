
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";

export default function ProjecaoResultadosPDV() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projeção de Resultados por PDV"
        description="Análise de rentabilidade e projeções por ponto de venda"
      />
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-xl">
            <Construction className="h-6 w-6 text-orange-500" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-2">Funcionalidades planejadas:</p>
            <ul className="text-left space-y-1">
              <li>• Projeção de vendas por PDV</li>
              <li>• Análise de rentabilidade por categoria</li>
              <li>• Comparativo de performance</li>
              <li>• Alertas de oportunidade</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
