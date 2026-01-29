
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/components/layout/AppLayout';
import { RouteGuard } from '@/components/navigation/RouteGuard';
import { lazy, Suspense } from 'react';
import LazyErrorBoundary from '@/components/error/LazyErrorBoundary';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load all page components for code splitting
const Index = lazy(() => import('@/pages/Index'));
const Home = lazy(() => import('@/pages/Home'));
const Manual = lazy(() => import('@/pages/Manual'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Mapas = lazy(() => import('@/pages/Mapas'));
const Agendamento = lazy(() => import('@/pages/Agendamento'));
const Expedicao = lazy(() => import('@/pages/Expedicao'));
const Estoque = lazy(() => import('@/pages/Estoque'));
const EstoqueInsumos = lazy(() => import('@/pages/EstoqueInsumos'));
const PCP = lazy(() => import('@/pages/PCP'));
const Precificacao = lazy(() => import('@/pages/Precificacao'));
const GestaoComercial = lazy(() => import('@/pages/GestaoComercial'));
const FunilLeads = lazy(() => import('@/pages/gestao-comercial/FunilLeads'));
const Distribuidores = lazy(() => import('@/pages/gestao-comercial/Distribuidores'));
const Parceiros = lazy(() => import('@/pages/gestao-comercial/Parceiros'));
const DashboardAnalytics = lazy(() => import('@/pages/DashboardAnalytics'));
const AnaliseGiro = lazy(() => import('@/pages/AnaliseGiro'));
const GestaoFinanceira = lazy(() => import('@/pages/GestaoFinanceira'));
const ProjecaoResultadosPDV = lazy(() => import('@/pages/gestao-financeira/ProjecaoResultadosPDV'));
const PontoEquilibrio = lazy(() => import('@/pages/gestao-financeira/PontoEquilibrio'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));
const AgentesIA = lazy(() => import('@/pages/AgentesIA'));
const AgenteIAPage = lazy(() => import('@/pages/AgenteIAPage'));
const Projections = lazy(() => import('@/pages/Projections'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Custos = lazy(() => import('@/pages/financeiro/Custos'));
const AuthPage = lazy(() => import('@/pages/auth/AuthPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const FichaPreview = lazy(() => import('@/pages/fichas-tecnicas/Preview'));
const Security = lazy(() => import('@/pages/Security'));
const ControleTrocas = lazy(() => import('@/pages/ControleTrocas'));

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
                <LazyErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <main className="min-h-screen w-full">
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
                    <Route path="/mapas" element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Mapas />
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
                     <Route path="/fichas-tecnicas/preview" element={
                       <ProtectedRoute>
                         <FichaPreview />
                       </ProtectedRoute>
                     } />
                     <Route path="/seguranca" element={
                       <ProtectedRoute>
                         <AppLayout>
                           <Security />
                         </AppLayout>
                       </ProtectedRoute>
                     } />
                     <Route path="/controle-trocas" element={
                       <ProtectedRoute>
                         <AppLayout>
                           <ControleTrocas />
                         </AppLayout>
                       </ProtectedRoute>
                     } />
                       <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </Suspense>
                </LazyErrorBoundary>
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
