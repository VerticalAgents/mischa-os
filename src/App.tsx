
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import Agendamento from "./pages/Agendamento";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import EstoqueInsumos from "./pages/EstoqueInsumos";
import Expedicao from "./pages/Expedicao";
import PCP from "./pages/PCP";
import Precificacao from "./pages/Precificacao";
import GestaoFinanceira from "./pages/GestaoFinanceira";
import GestaoComercial from "./pages/GestaoComercial";
import FunilLeads from "./pages/gestao-comercial/FunilLeads";
import Distribuidores from "./pages/gestao-comercial/Distribuidores";
import Parceiros from "./pages/gestao-comercial/Parceiros";
import ProjecaoResultadosPDV from "./pages/gestao-financeira/ProjecaoResultadosPDV";
import PontoEquilibrio from "./pages/gestao-financeira/PontoEquilibrio";
import Projections from "./pages/Projections";
import Custos from "./pages/financeiro/Custos";
import AgentesIA from "./pages/AgentesIA";
import AgenteIAPage from "./pages/AgenteIAPage";
import LoginPage from "./pages/auth/LoginPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard-analytics" element={<DashboardAnalytics />} />
                <Route path="/agendamento" element={<Agendamento />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/expedicao" element={<Expedicao />} />
                <Route path="/pcp" element={<PCP />} />
                <Route path="/estoque/insumos" element={<EstoqueInsumos />} />
                <Route path="/precificacao" element={<Precificacao />} />
                <Route path="/gestao-financeira" element={<GestaoFinanceira />} />
                <Route path="/gestao-financeira/projecao-resultados-pdv" element={<ProjecaoResultadosPDV />} />
                <Route path="/gestao-financeira/ponto-equilibrio" element={<PontoEquilibrio />} />
                <Route path="/projecoes" element={<Projections />} />
                <Route path="/custos" element={<Custos />} />
                <Route path="/gestao-comercial" element={<GestaoComercial />} />
                <Route path="/gestao-comercial/funil-leads" element={<FunilLeads />} />
                <Route path="/gestao-comercial/distribuidores" element={<Distribuidores />} />
                <Route path="/gestao-comercial/parceiros" element={<Parceiros />} />
                <Route path="/agentes-ia" element={<AgentesIA />} />
                <Route path="/agentes-ia/:agentId" element={<AgenteIAPage />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
