import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import BreadcrumbNavigation from '@/components/common/Breadcrumb';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { useSupabaseCustosFixos } from '@/hooks/useSupabaseCustosFixos';
import { useSupabaseCustosVariaveis } from '@/hooks/useSupabaseCustosVariaveis';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';
import { ScenarioTabs } from '@/components/projections/ScenarioTabs';
import { ComparisonView } from '@/components/projections/ComparisonView';
import { ProjectionsHeader } from '@/components/projections/ProjectionsHeader';
import { DREAuditoria } from '@/components/projections/DREAuditoria';
import { DREDebugTab } from '@/components/projections/DREDebugTab';

export default function Projections() {
  const { clientes } = useClienteStore();
  const { custosFixos } = useSupabaseCustosFixos();
  const { custosVariaveis } = useSupabaseCustosVariaveis();
  const { generateBaseDRE, baseDRE } = useProjectionStore();
  const { disponivel } = useFaturamentoPrevisto();
  const [activeView, setActiveView] = useState<'scenarios' | 'comparison' | 'audit' | 'debug'>('scenarios');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientes.length > 0 && disponivel) {
      // Generate base DRE with real costs data
      if (!baseDRE) {
        generateBaseDRE(clientes, custosFixos, custosVariaveis);
      }
      setIsLoading(false);
    }
  }, [clientes, custosFixos, custosVariaveis, generateBaseDRE, baseDRE, disponivel]);

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Projeções"
        description="Projeções financeiras, simulação de cenários e análise de desempenho"
      />
      
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
            <p className="mt-4 text-muted-foreground">Carregando dados para projeções...</p>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          {activeView === 'scenarios' && <ScenarioTabs />}
          {activeView === 'comparison' && <ComparisonView />}
          {activeView === 'audit' && <DREAuditoria />}
          {activeView === 'debug' && <DREDebugTab />}
        </div>
      )}
    </div>
  );
}
