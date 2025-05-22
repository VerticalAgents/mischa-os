import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import DashboardAnalytics from "@/pages/DashboardAnalytics";
import Clientes from "@/pages/Clientes";
import Precificacao from "@/pages/Precificacao";
import Agendamento from "@/pages/Agendamento";
import Estoque from "@/pages/Estoque";
import Configuracoes from "@/pages/Configuracoes";
import PCP from "@/pages/PCP";
import Expedicao from "@/pages/Expedicao";
import Projections from "@/pages/Projections";
import NotFound from "./pages/NotFound";
import { applyTheme } from "./lib/theme";
import AgentesIA from "./pages/AgentesIA";
import AgenteIAPage from "./pages/AgenteIAPage";
import EstoqueInsumos from "./pages/EstoqueInsumos";

// New pages
import GestaoComercial from "./pages/GestaoComercial";
import FunilLeads from "./pages/gestao-comercial/FunilLeads";
import Distribuidores from "./pages/gestao-comercial/Distribuidores";
import Parceiros from "./pages/gestao-comercial/Parceiros";
import GestaoFinanceira from "./pages/GestaoFinanceira";
import Custos from "./pages/financeiro/Custos";

const queryClient = new QueryClient();

// Apply theme from localStorage on load
const initializeTheme = () => {
  const stored = localStorage.getItem('theme-storage');
  if (stored) {
    try {
      const theme = JSON.parse(stored);
      applyTheme(theme.state?.isDark || false);
    } catch (e) {
      console.error("Error parsing theme from localStorage:", e);
      applyTheme(false);
    }
  } else {
    applyTheme(false);
  }
};

const App = () => {
  // Initialize theme on app load
  React.useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Existing Routes */}
            <Route path="/" element={
              <AppLayout>
                <DashboardAnalytics />
              </AppLayout>
            } />
            <Route path="/clientes" element={
              <AppLayout>
                <Clientes />
              </AppLayout>
            } />
            <Route path="/precificacao" element={
              <AppLayout>
                <Precificacao />
              </AppLayout>
            } />
            <Route path="/agendamento" element={
              <AppLayout>
                <Agendamento />
              </AppLayout>
            } />
            <Route path="/expedicao" element={
              <AppLayout>
                <Expedicao />
              </AppLayout>
            } />
            <Route path="/estoque" element={
              <AppLayout>
                <Estoque />
              </AppLayout>
            } />
            <Route path="/estoque/insumos" element={
              <AppLayout>
                <EstoqueInsumos />
              </AppLayout>
            } />
            <Route path="/configuracoes" element={
              <AppLayout>
                <Configuracoes />
              </AppLayout>
            } />
            <Route path="/pcp" element={
              <AppLayout>
                <PCP />
              </AppLayout>
            } />
            <Route path="/projecoes" element={
              <AppLayout>
                <Projections />
              </AppLayout>
            } />
            <Route path="/analytics" element={
              <AppLayout>
                <DashboardAnalytics />
              </AppLayout>
            } />
            <Route path="/agentes-ia" element={
              <AppLayout>
                <AgentesIA />
              </AppLayout>
            } />
            <Route path="/agentes-ia/:id" element={
              <AppLayout>
                <AgenteIAPage />
              </AppLayout>
            } />
            
            {/* Routes for Commercial Management */}
            <Route path="/gestao-comercial" element={
              <AppLayout>
                <GestaoComercial />
              </AppLayout>
            } />
            <Route path="/gestao-comercial/funil-leads" element={
              <AppLayout>
                <GestaoComercial />
              </AppLayout>
            } />
            <Route path="/gestao-comercial/distribuidores" element={
              <AppLayout>
                <GestaoComercial />
              </AppLayout>
            } />
            <Route path="/gestao-comercial/parceiros" element={
              <AppLayout>
                <GestaoComercial />
              </AppLayout>
            } />
            
            {/* Routes for Financial Management */}
            <Route path="/gestao-financeira" element={
              <AppLayout>
                <GestaoFinanceira />
              </AppLayout>
            } />
            <Route path="/custos" element={
              <AppLayout>
                <Custos />
              </AppLayout>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
