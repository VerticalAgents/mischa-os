import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import BreadcrumbNavigation from '@/components/common/Breadcrumb';
import { useDREData } from '@/hooks/useDREData';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { useClienteStore } from '@/hooks/useClienteStore';
import { usePedidoStore } from '@/hooks/usePedidoStore';
import OperationalSummary from '@/components/dashboard-analytics/OperationalSummary';
import ProductionIndicators from '@/components/dashboard-analytics/ProductionIndicators';
import FinancialAnalysis from '@/components/dashboard-analytics/FinancialAnalysis';
import CustomerBehavior from '@/components/dashboard-analytics/CustomerBehavior';
import AlertsRisks from '@/components/dashboard-analytics/AlertsRisks';
import AnaliseGiroPDV from '@/components/dashboard-analytics/AnaliseGiroPDV';
import ProducaoSimuladaTab from '@/components/dashboard-analytics/ProducaoSimuladaTab';

export default function Analytics() {
  const { data: baseDRE, isLoading, error } = useDREData();
  const { dashboardData } = useDashboardStore();
  const { clientes } = useClienteStore();
  const { pedidos } = usePedidoStore();
  const [activeTab, setActiveTab] = useState('operational');

  // Mock data for production since we don't have these stores yet
  const registrosProducao: any[] = [];
  const planejamentoProducao: any[] = [];

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Analytics Avançados"
        description="Análises detalhadas de desempenho operacional e financeiro"
      />

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('operational')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'operational' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Resumo Operacional
        </button>
        <button
          onClick={() => setActiveTab('production')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'production' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Indicadores de Produção
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'financial' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Análise Financeira
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'customer' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Comportamento do Cliente
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'alerts' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Alertas e Riscos
        </button>
        <button
          onClick={() => setActiveTab('giro')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'giro' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Análise de Giro PDV
        </button>
        <button
          onClick={() => setActiveTab('simulacao')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'simulacao' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Simulação de Produção
        </button>
      </div>

      {activeTab === 'operational' && <OperationalSummary dashboardData={dashboardData} baseDRE={baseDRE} clientes={clientes} />}
      {activeTab === 'production' && <ProductionIndicators registrosProducao={registrosProducao} planejamentoProducao={planejamentoProducao} />}
      {activeTab === 'financial' && <FinancialAnalysis baseDRE={baseDRE} dashboardData={dashboardData} />}
      {activeTab === 'customer' && <CustomerBehavior clientes={clientes} baseDRE={baseDRE} />}
      {activeTab === 'alerts' && <AlertsRisks clientes={clientes} pedidos={pedidos} registrosProducao={registrosProducao} planejamentoProducao={planejamentoProducao} />}
      {activeTab === 'giro' && <AnaliseGiroPDV clientes={clientes} baseDRE={baseDRE} />}
      {activeTab === 'simulacao' && <ProducaoSimuladaTab clientes={clientes} />}
    </div>
  );
}
