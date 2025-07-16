
import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import BreadcrumbNavigation from '@/components/common/Breadcrumb';
import OperationalSummary from '@/components/dashboard-analytics/OperationalSummary';
import ProductionIndicators from '@/components/dashboard-analytics/ProductionIndicators';
import CustomerBehavior from '@/components/dashboard-analytics/CustomerBehavior';
import FinancialAnalysis from '@/components/dashboard-analytics/FinancialAnalysis';
import AlertsRisks from '@/components/dashboard-analytics/AlertsRisks';
import ProducaoSimuladaTab from '@/components/dashboard-analytics/ProducaoSimuladaTab';
import AnaliseGiroPDV from '@/components/dashboard-analytics/AnaliseGiroPDV';
import { useDREData } from '@/hooks/useDREData';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const { dreData, dreCalculationResult } = useDREData();

  const tabs = [
    { id: 'overview', label: 'Visão Geral', component: OperationalSummary },
    { id: 'production', label: 'Produção', component: ProductionIndicators },
    { id: 'customers', label: 'Comportamento', component: CustomerBehavior },
    { id: 'financial', label: 'Análise Financeira', component: FinancialAnalysis },
    { id: 'alerts', label: 'Alertas & Riscos', component: AlertsRisks },
    { id: 'producao-simulada', label: 'Produção Simulada', component: ProducaoSimuladaTab },
    { id: 'giro-pdv', label: 'Análise Giro PDV', component: AnaliseGiroPDV }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OperationalSummary;

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Analytics"
        description="Análise detalhada de performance, produção e comportamento dos clientes"
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}
