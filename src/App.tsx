
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/components/layout/AppLayout';
import Index from '@/pages/Index';
import Home from '@/pages/Home';
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
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Router>
            <AuthProvider>
              <SidebarProvider>
                <div className="min-h-screen w-full">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Routes>
                            <Route path="/home" element={<Home />} />
                            <Route path="/clientes" element={<Clientes />} />
                            <Route path="/agendamento" element={<Agendamento />} />
                            <Route path="/expedicao" element={<Expedicao />} />
                            <Route path="/estoque/insumos" element={<EstoqueInsumos />} />
                            <Route path="/estoque" element={<Estoque />} />
                            <Route path="/pcp" element={<PCP />} />
                            <Route path="/precificacao" element={<Precificacao />} />
                            <Route path="/gestao-comercial" element={<GestaoComercial />} />
                            <Route path="/gestao-comercial/funil-leads" element={<FunilLeads />} />
                            <Route path="/gestao-comercial/distribuidores" element={<Distribuidores />} />
                            <Route path="/gestao-comercial/parceiros" element={<Parceiros />} />
                            <Route path="/dashboard-analytics" element={<DashboardAnalytics />} />
                            <Route path="/analise-giro" element={<AnaliseGiro />} />
                            <Route path="/gestao-financeira" element={<GestaoFinanceira />} />
                            <Route path="/gestao-financeira/projecao-resultados-pdv" element={<ProjecaoResultadosPDV />} />
                            <Route path="/gestao-financeira/ponto-equilibrio" element={<PontoEquilibrio />} />
                            <Route path="/configuracoes" element={<Configuracoes />} />
                            <Route path="/agentes-ia" element={<AgentesIA />} />
                            <Route path="/agentes-ia/:id" element={<AgenteIAPage />} />
                            <Route path="/projecoes" element={<Projections />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/custos" element={<Custos />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </AppLayout>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </div>
              </SidebarProvider>
              <Toaster />
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
