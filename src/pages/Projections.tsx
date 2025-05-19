
import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useClienteStore } from '@/hooks/cliente';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { ScenarioTabs } from '@/components/projections/ScenarioTabs';
import { ComparisonView } from '@/components/projections/ComparisonView';
import { ProjectionsHeader } from '@/components/projections/ProjectionsHeader';

export default function Projections() {
  const { clientes } = useClienteStore();
  const { generateBaseDRE, baseDRE } = useProjectionStore();
  const [activeView, setActiveView] = useState<'scenarios' | 'comparison'>('scenarios');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientes.length > 0) {
      // Generate base DRE if it doesn't exist
      if (!baseDRE) {
        generateBaseDRE(clientes);
      }
      setIsLoading(false);
    }
  }, [clientes, generateBaseDRE, baseDRE]);

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Projeções"
        description="Projeções financeiras, simulação de cenários e análise de desempenho"
      />
      
      <ProjectionsHeader 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando dados para projeções...</p>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          {activeView === 'scenarios' ? (
            <ScenarioTabs />
          ) : (
            <ComparisonView />
          )}
        </div>
      )}
    </div>
  );
}
