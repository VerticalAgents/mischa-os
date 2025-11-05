import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, TrendingUp } from "lucide-react";
import { useDREDataFromIndicadores } from "@/hooks/useDREDataFromIndicadores";
import { useProjectionStore } from "@/hooks/useProjectionStore";
import { ScenarioTabs } from "@/components/projections/ScenarioTabs";
import { ComparisonView } from "@/components/projections/ComparisonView";
import { DREAuditoria } from "@/components/projections/DREAuditoria";
import { DREDebugTab } from "@/components/projections/DREDebugTab";
type ViewType = 'scenarios' | 'comparison' | 'audit' | 'debug';
export function DRETab() {
  const [activeView, setActiveView] = useState<ViewType>('scenarios');
  const [useRealPercentages, setUseRealPercentages] = useState(true);
  const {
    data: dreData,
    isLoading,
    error
  } = useDREDataFromIndicadores(useRealPercentages);
  const {
    setBaseDRE
  } = useProjectionStore();

  // Atualizar a base DRE quando os dados estiverem disponíveis
  useEffect(() => {
    if (dreData) {
      console.log('🔄 [DRETab] Atualizando DRE Base no store:', {
        totalRevenue: dreData.totalRevenue,
        hasDetailedBreakdown: !!dreData.detailedBreakdown,
        detailedBreakdown: dreData.detailedBreakdown
      });
      setBaseDRE(dreData);
    }
  }, [dreData, setBaseDRE]);

  // Loading state
  if (isLoading) {
    return <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Demonstração do Resultado do Exercício (DRE)
          </h2>
          <p className="text-muted-foreground mt-1 text-left">
            Análise financeira baseada em dados reais
          </p>
        </div>

        {/* Loading Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando dados da DRE...</p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  // Error state
  if (error) {
    return <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Demonstração do Resultado do Exercício (DRE)
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive">
                Erro ao carregar dados da DRE: {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Demonstração do Resultado do Exercício (DRE)
        </h2>
        <p className="text-muted-foreground mt-1 text-left">
          Análise financeira baseada em dados reais do mês passado
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Período de Análise
          </CardTitle>
          <CardDescription className="text-left">
            Os dados apresentados são baseados no período: <strong>Mês Passado</strong> (dados reais consolidados)
          </CardDescription>
        </CardHeader>
      </Card>

      {/* View Selector */}
      <div className="flex flex-wrap gap-2">
        <Button variant={activeView === 'scenarios' ? 'default' : 'outline'} onClick={() => setActiveView('scenarios')}>
          Cenários
        </Button>
        <Button variant={activeView === 'comparison' ? 'default' : 'outline'} onClick={() => setActiveView('comparison')}>
          Comparação
        </Button>
        <Button variant={activeView === 'audit' ? 'default' : 'outline'} onClick={() => setActiveView('audit')}>
          Auditoria DRE
        </Button>
        <Button variant={activeView === 'debug' ? 'default' : 'outline'} onClick={() => setActiveView('debug')}>
          Debug DRE
        </Button>
      </div>

      {/* Content based on active view */}
      {activeView === 'scenarios' && <ScenarioTabs useRealPercentages={useRealPercentages} onToggleRealPercentages={setUseRealPercentages} />}
      {activeView === 'comparison' && <ComparisonView />}
      {activeView === 'audit' && <DREAuditoria />}
      {activeView === 'debug' && <DREDebugTab />}
    </div>;
}