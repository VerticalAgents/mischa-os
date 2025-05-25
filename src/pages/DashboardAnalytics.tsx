
import { useEffect, useState } from "react";
import { ArrowRight, Download } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useProjectionStore } from "@/hooks/useProjectionStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import { useDashboardStore } from "@/hooks/useDashboardStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";

// Tab components
import OperationalSummary from "@/components/dashboard-analytics/OperationalSummary";
import FinancialAnalysis from "@/components/dashboard-analytics/FinancialAnalysis";
import CustomerBehavior from "@/components/dashboard-analytics/CustomerBehavior";
import ProductionIndicators from "@/components/dashboard-analytics/ProductionIndicators";
import AlertsRisks from "@/components/dashboard-analytics/AlertsRisks";
import ProducaoSimuladaTab from "@/components/dashboard-analytics/ProducaoSimuladaTab";

// PDF Export
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export default function DashboardAnalytics() {
  const [activeTab, setActiveTab] = useState("operational-summary");
  const { clientes } = useClienteStore();
  const { pedidos } = usePedidoStore();
  const { baseDRE } = useProjectionStore();
  const planejamentoProducaoStore = usePlanejamentoProducaoStore();
  const { atualizarDashboard, dashboardData } = useDashboardStore();

  // Update dashboard data when the component mounts or data changes
  useEffect(() => {
    atualizarDashboard(clientes, pedidos);
  }, [atualizarDashboard, clientes, pedidos]);

  // Get mock production data
  const registrosProducao: any[] = [];
  const planejamentoProducao: any[] = [];

  // Export dashboard as PDF
  const exportToPDF = async () => {
    toast.info("Preparando PDF para download...");
    
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      
      if (!dashboardElement) {
        toast.error("Não foi possível encontrar o conteúdo do dashboard");
        return;
      }
      
      const canvas = await html2canvas(dashboardElement, { 
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions based on canvas
      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(16);
      pdf.text("Dashboard Mischa's Bakery", 105, 15, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
      
      // Add image
      pdf.addImage(imgData, 'PNG', 0, 30, imgWidth, imgHeight);
      
      // Save PDF
      pdf.save("dashboard_mischa.pdf");
      
      toast.success("Dashboard exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Ocorreu um erro ao exportar o dashboard");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageHeader 
          title="Dashboard & Analytics" 
          description="Visão consolidada de métricas e indicadores" 
        />
        <Button variant="outline" onClick={exportToPDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>
      
      <div id="dashboard-content">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6 overflow-x-auto">
            <TabsTrigger value="operational-summary">Resumo Operacional</TabsTrigger>
            <TabsTrigger value="financial-analysis">Análise Financeira</TabsTrigger>
            <TabsTrigger value="customer-behavior">Comportamento dos Clientes</TabsTrigger>
            <TabsTrigger value="production-indicators">Indicadores de Produção</TabsTrigger>
            <TabsTrigger value="producao-simulada">Produção Simulada (Mensal)</TabsTrigger>
            <TabsTrigger value="alerts-risks">Alertas e Riscos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="operational-summary" className="mt-0">
            <OperationalSummary 
              dashboardData={dashboardData} 
              baseDRE={baseDRE} 
              clientes={clientes}
            />
          </TabsContent>
          
          <TabsContent value="financial-analysis" className="mt-0">
            <FinancialAnalysis
              baseDRE={baseDRE}
              dashboardData={dashboardData}
            />
          </TabsContent>
          
          <TabsContent value="customer-behavior" className="mt-0">
            <CustomerBehavior
              clientes={clientes}
              baseDRE={baseDRE}
            />
          </TabsContent>
          
          <TabsContent value="production-indicators" className="mt-0">
            <ProductionIndicators
              registrosProducao={registrosProducao}
              planejamentoProducao={planejamentoProducao}
            />
          </TabsContent>
          
          <TabsContent value="producao-simulada" className="mt-0">
            <ProducaoSimuladaTab clientes={clientes} />
          </TabsContent>
          
          <TabsContent value="alerts-risks" className="mt-0">
            <AlertsRisks
              clientes={clientes}
              pedidos={pedidos}
              registrosProducao={registrosProducao}
              planejamentoProducao={planejamentoProducao}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
