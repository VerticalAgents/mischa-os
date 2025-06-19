
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import Clientes from "./pages/Clientes";
import Agendamento from "./pages/Agendamento";
import Expedicao from "./pages/Expedicao";
import EstoqueInsumos from "./pages/EstoqueInsumos";
import PCP from "./pages/PCP";
import Precificacao from "./pages/Precificacao";
import Configuracoes from "./pages/Configuracoes";
import GestaoComercial from "./pages/GestaoComercial";
import GestaoFinanceira from "./pages/GestaoFinanceira";
import AuthPage from "./pages/auth/AuthPage";
import Projections from "./pages/Projections";
import Custos from "./pages/financeiro/Custos";
import FunilLeads from "./pages/gestao-comercial/FunilLeads";
import Distribuidores from "./pages/gestao-comercial/Distribuidores";
import Parceiros from "./pages/gestao-comercial/Parceiros";
import ProjecaoResultadosPDV from "./pages/gestao-financeira/ProjecaoResultadosPDV";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
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
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Configuracoes />
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
              <Route path="/projecoes" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Projections />
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
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
