import { useEffect, useState } from 'react';
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
    <div>
      {faturamentoMedioRevenda > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Faturamento Médio por PDV (Revenda Padrão):</strong> R$ {faturamentoMedioRevenda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Este valor é sincronizado com a aba "Projeção por PDV" → aba "Análise por Categoria"
          </p>
        </div>
      )}
      
      <div className="flex gap-4 mb-6">
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
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando projeções...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar dados</h3>
          <p className="text-red-600">{error}</p>
        </div>
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
