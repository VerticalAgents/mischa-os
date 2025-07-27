
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useThemeStore } from "@/lib/theme";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import DashboardAnalytics from "@/pages/DashboardAnalytics";
import Analytics from "@/pages/Analytics";
import AnaliseGiro from "@/pages/AnaliseGiro";
import Clientes from "@/pages/Clientes";
import Agendamento from "@/pages/Agendamento";
import Expedicao from "@/pages/Expedicao";
import Estoque from "@/pages/Estoque";
import EstoqueInsumos from "@/pages/EstoqueInsumos";
import PCP from "@/pages/PCP";
import Precificacao from "@/pages/Precificacao";
import GestaoComercial from "@/pages/GestaoComercial";
import GestaoFinanceira from "@/pages/GestaoFinanceira";
import Configuracoes from "@/pages/Configuracoes";
import Projections from "@/pages/Projections";
import Relatorios from "@/pages/Relatorios";
import NotFound from "@/pages/NotFound";
import EnhancedAuthPage from "@/pages/auth/EnhancedAuthPage";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { AuthenticationMonitor } from "@/components/security/AuthenticationMonitor";

// Gestão Comercial sub-pages
import FunilLeads from "@/pages/gestao-comercial/FunilLeads";
import MetasProspeccao from "@/pages/gestao-comercial/MetasProspeccao";
import Distribuidores from "@/pages/gestao-comercial/Distribuidores";
import Parceiros from "@/pages/gestao-comercial/Parceiros";
import DashboardComercial from "@/pages/gestao-comercial/DashboardComercial";

// Gestão Financeira sub-pages
import Custos from "@/pages/financeiro/Custos";
import PontoEquilibrio from "@/pages/gestao-financeira/PontoEquilibrio";
import ProjecaoResultadosPDV from "@/pages/gestao-financeira/ProjecaoResultadosPDV";

// Agentes IA
import AgentesIA from "@/pages/AgentesIA";
import AgenteIAPage from "@/pages/AgenteIAPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<EnhancedAuthPage />} />
              <Route path="/auth" element={<EnhancedAuthPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/home" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/dashboard-analytics" element={<DashboardAnalytics />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/analise-giro" element={<AnaliseGiro />} />
                      <Route path="/clientes" element={<Clientes />} />
                      <Route path="/agendamento" element={<Agendamento />} />
                      <Route path="/expedicao" element={<Expedicao />} />
                      <Route path="/estoque" element={<Estoque />} />
                      <Route path="/estoque-insumos" element={<EstoqueInsumos />} />
                      <Route path="/pcp" element={<PCP />} />
                      <Route path="/precificacao" element={<Precificacao />} />
                      <Route path="/gestao-comercial" element={<GestaoComercial />} />
                      <Route path="/gestao-comercial/dashboard" element={<GestaoComercial />} />
                      <Route path="/gestao-comercial/metas" element={<GestaoComercial />} />
                      <Route path="/gestao-comercial/funil-leads" element={<FunilLeads />} />
                      <Route path="/gestao-comercial/distribuidores" element={<Distribuidores />} />
                      <Route path="/gestao-comercial/parceiros" element={<Parceiros />} />
                      <Route path="/gestao-comercial/dashboard-comercial" element={<DashboardComercial />} />
                      <Route path="/gestao-financeira" element={<GestaoFinanceira />} />
                      <Route path="/gestao-financeira/custos" element={<Custos />} />
                      <Route path="/gestao-financeira/ponto-equilibrio" element={<PontoEquilibrio />} />
                      <Route path="/gestao-financeira/projecao-resultados-pdv" element={<ProjecaoResultadosPDV />} />
                      <Route path="/configuracoes" element={<Configuracoes />} />
                      <Route path="/projections" element={<Projections />} />
                      <Route path="/relatorios" element={<Relatorios />} />
                      <Route path="/agentes-ia" element={<AgentesIA />} />
                      <Route path="/agentes-ia/:id" element={<AgenteIAPage />} />
                      <Route path="/security-monitor" element={<SecurityMonitor />} />
                      <Route path="/auth-monitor" element={<AuthenticationMonitor />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
