
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import GlobalRoutePersistence from '@/components/routing/GlobalRoutePersistence';
import Index from '@/pages/Index';
import AuthPage from '@/pages/auth/AuthPage';
import LoginPage from '@/pages/auth/LoginPage';
import Home from '@/pages/Home';
import Agendamento from '@/pages/Agendamento';
import Clientes from '@/pages/Clientes';
import Expedicao from '@/pages/Expedicao';
import PCP from '@/pages/PCP';
import Estoque from '@/pages/Estoque';
import EstoqueInsumos from '@/pages/EstoqueInsumos';
import Precificacao from '@/pages/Precificacao';
import GestaoComercial from '@/pages/GestaoComercial';
import GestaoFinanceira from '@/pages/GestaoFinanceira';
import PontoEquilibrio from '@/pages/gestao-financeira/PontoEquilibrio';
import ProjecaoResultadosPDV from '@/pages/gestao-financeira/ProjecaoResultadosPDV';
import Projections from '@/pages/Projections';
import Configuracoes from '@/pages/Configuracoes';
import Dashboard from '@/pages/Dashboard';
import DashboardAnalytics from '@/pages/DashboardAnalytics';
import Analytics from '@/pages/Analytics';
import AnaliseGiro from '@/pages/AnaliseGiro';
import Relatorios from '@/pages/Relatorios';
import Security from '@/pages/Security';
import AgentesIA from '@/pages/AgentesIA';
import AgenteIAPage from '@/pages/AgenteIAPage';
import Representantes from '@/pages/gestao-comercial/Representantes';
import Distribuidores from '@/pages/gestao-comercial/Distribuidores';
import Parceiros from '@/pages/gestao-comercial/Parceiros';
import FunilLeads from '@/pages/gestao-comercial/FunilLeads';
import ClientesPorRepresentante from '@/pages/gestao-comercial/ClientesPorRepresentante';
import Custos from '@/pages/financeiro/Custos';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={
              <ProtectedRoute>
                <AppLayout>
                  <GlobalRoutePersistence />
                  <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/agendamento" element={<Agendamento />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/expedicao" element={<Expedicao />} />
                    <Route path="/pcp" element={<PCP />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/estoque-insumos" element={<EstoqueInsumos />} />
                    <Route path="/precificacao" element={<Precificacao />} />
                    <Route path="/gestao-comercial" element={<GestaoComercial />} />
                    <Route path="/gestao-financeira" element={<GestaoFinanceira />} />
                    <Route path="/gestao-financeira/ponto-equilibrio" element={<PontoEquilibrio />} />
                    <Route path="/gestao-financeira/projecao-resultados-pdv" element={<ProjecaoResultadosPDV />} />
                    <Route path="/projections" element={<Projections />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dashboard-analytics" element={<DashboardAnalytics />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/analise-giro" element={<AnaliseGiro />} />
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/agentes-ia" element={<AgentesIA />} />
                    <Route path="/agentes-ia/:agenteId" element={<AgenteIAPage />} />
                    <Route path="/gestao-comercial/representantes" element={<Representantes />} />
                    <Route path="/gestao-comercial/distribuidores" element={<Distribuidores />} />
                    <Route path="/gestao-comercial/parceiros" element={<Parceiros />} />
                    <Route path="/gestao-comercial/funil-leads" element={<FunilLeads />} />
                    <Route path="/gestao-comercial/clientes-por-representante" element={<ClientesPorRepresentante />} />
                    <Route path="/financeiro/custos" element={<Custos />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
