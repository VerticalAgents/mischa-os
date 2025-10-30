import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { useDREData } from '@/hooks/useDREData';
import { useFaturamentoMedioPDV } from '@/hooks/useFaturamentoMedioPDV';
import { ScenarioTabs } from '@/components/projections/ScenarioTabs';
import { ComparisonView } from '@/components/projections/ComparisonView';
import { ProjectionsHeader } from '@/components/projections/ProjectionsHeader';
import { DREAuditoria } from '@/components/projections/DREAuditoria';
import { DREDebugTab } from '@/components/projections/DREDebugTab';

export default function ProjecoesTab() {
  const { setBaseDRE, setFaturamentoMedioPDV } = useProjectionStore();
  const { data: dreData, isLoading, error } = useDREData();
  const { faturamentoMedioRevenda } = useFaturamentoMedioPDV();
  const [activeView, setActiveView] = useState<'scenarios' | 'comparison' | 'audit' | 'debug'>('scenarios');

  useEffect(() => {
    if (dreData) {
      console.log('📊 [Projections] Atualizando DRE Base com dados da auditoria:', dreData);
      setBaseDRE(dreData);
    }
  }, [dreData, setBaseDRE]);

  useEffect(() => {
    if (faturamentoMedioRevenda > 0) {
      console.log('💰 [Projections] Atualizando faturamento médio por PDV no store:', faturamentoMedioRevenda.toFixed(2));
      setFaturamentoMedioPDV(faturamentoMedioRevenda);
    }
  }, [faturamentoMedioRevenda, setFaturamentoMedioPDV]);

  return (
    <div className="space-y-6">
      {/* Info Card sobre Faturamento Médio */}
      {faturamentoMedioRevenda > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Faturamento Médio por PDV (Revenda Padrão): <span className="font-bold">R$ {faturamentoMedioRevenda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </p>
              <p className="text-xs text-blue-700">
                Este valor é sincronizado com a aba "Projeção por PDV" → aba "Análise por Categoria"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* View Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveView('scenarios')}
          className={`px-4 py-2 rounded-lg ${
            activeView === 'scenarios' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Cenários
        </button>
        <button
          onClick={() => setActiveView('comparison')}
          className={`px-4 py-2 rounded-lg ${
            activeView === 'comparison' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Comparação
        </button>
        <button
          onClick={() => setActiveView('audit')}
          className={`px-4 py-2 rounded-lg ${
            activeView === 'audit' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Auditoria DRE
        </button>
        <button
          onClick={() => setActiveView('debug')}
          className={`px-4 py-2 rounded-lg ${
            activeView === 'debug' 
              ? 'bg-amber-600 text-white' 
              : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
          }`}
        >
          🐛 Debug DRE
        </button>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando projeções...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar dados</h3>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeView === 'scenarios' && (
            <>
              <ProjectionsHeader activeView={activeView} setActiveView={setActiveView} />
              <ScenarioTabs />
            </>
          )}
          
          {activeView === 'comparison' && (
            <>
              <ProjectionsHeader activeView={activeView} setActiveView={setActiveView} />
              <ComparisonView />
            </>
          )}
          
          {activeView === 'audit' && <DREAuditoria />}
          {activeView === 'debug' && <DREDebugTab />}
        </>
      )}
    </div>
  );
}
