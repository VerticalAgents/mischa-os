
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/components/layout/AppLayout';
import { RouteGuard } from '@/components/navigation/RouteGuard';
import Index from '@/pages/Index';
import Home from '@/pages/Home';
import Manual from '@/pages/Manual';
import Clientes from '@/pages/Clientes';
import Agendamento from '@/pages/Agendamento';
import Expedicao from '@/pages/Expedicao';
import Estoque from '@/pages/Estoque';
import EstoqueInsumos from '@/pages/EstoqueInsumos';
import PCP from '@/pages/PCP';
import Precificacao from '@/pages/Precificacao';
import GestaoComercial from '@/pages/GestaoComercial';
import FunilLeads from '@/pages/gestao-comercial/FunilLeads';
import Distribuidores from '@/pages/gestao-comercial/Distribuidores';
import Parceiros from '@/pages/gestao-comercial/Parceiros';
import DashboardAnalytics from '@/pages/DashboardAnalytics';
import AnaliseGiro from '@/pages/AnaliseGiro';
import GestaoFinanceira from '@/pages/GestaoFinanceira';
import ProjecaoResultadosPDV from '@/pages/gestao-financeira/ProjecaoResultadosPDV';
import PontoEquilibrio from '@/pages/gestao-financeira/PontoEquilibrio';
import Configuracoes from '@/pages/Configuracoes';
import AgentesIA from '@/pages/AgentesIA';
import AgenteIAPage from '@/pages/AgenteIAPage';
import Projections from '@/pages/Projections';
import Dashboard from '@/pages/Dashboard';
import Custos from '@/pages/financeiro/Custos';
import AuthPage from '@/pages/auth/AuthPage';
import LoginPage from '@/pages/auth/LoginPage';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Router>
          <AuthProvider>
            <RouteGuard>
              <SidebarProvider>
                <div className="min-h-screen w-full">
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/home" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Home />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/manual" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Manual />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/manual/:sectionId" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Manual />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/clientes" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Clientes />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/agendamento" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Agendamento />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/expedicao" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Expedicao />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/estoque/insumos" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <EstoqueInsumos />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/estoque" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Estoque />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/pcp" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <PCP />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/precificacao" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Precificacao />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/gestao-comercial" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <GestaoComercial />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/gestao-comercial/funil-leads" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <FunilLeads />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/gestao-comercial/distribuidores" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Distribuidores />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/gestao-comercial/parceiros" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Parceiros />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard-analytics" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <DashboardAnalytics />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/analise-giro" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AnaliseGiro />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/gestao-financeira" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <GestaoFinanceira />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/gestao-financeira/projecao-resultados-pdv" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ProjecaoResultadosPDV />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/gestao-financeira/ponto-equilibrio" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <PontoEquilibrio />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/configuracoes" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Configuracoes />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/agentes-ia" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AgentesIA />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/agentes-ia/:id" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AgenteIAPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/projecoes" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Projections />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/custos" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Custos />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </SidebarProvider>
            </RouteGuard>
            <Toaster />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
