
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { useRoutePersistence } from "./hooks/useRoutePersistence";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import AuthPage from "./pages/auth/AuthPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// New pages
import GestaoComercial from "./pages/GestaoComercial";
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

// Componente interno para usar os hooks após o Router estar disponível
const AppContent = () => {
  const { restoreRoute } = useRoutePersistence();

  // Restaura a rota salva APENAS na primeira inicialização
  useEffect(() => {
    // Usar setTimeout para garantir que seja executado após a montagem inicial
    const timeoutId = setTimeout(() => {
      restoreRoute();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []); // Array de dependências vazio para executar apenas uma vez

  return (
    <Routes>
      {/* Auth Routes - redirect /login to /auth */}
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
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
      <Route path="/precificacao" element={
        <ProtectedRoute>
          <AppLayout>
            <Precificacao />
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
      <Route path="/estoque" element={
        <ProtectedRoute>
          <AppLayout>
            <Estoque />
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
      <Route path="/configuracoes" element={
        <ProtectedRoute>
          <AppLayout>
            <Configuracoes />
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
      <Route path="/projecoes" element={
        <ProtectedRoute>
          <AppLayout>
            <Projections />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AppLayout>
            <DashboardAnalytics />
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
            <GestaoComercial />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/gestao-comercial/distribuidores" element={
        <ProtectedRoute>
          <AppLayout>
            <GestaoComercial />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/gestao-comercial/parceiros" element={
        <ProtectedRoute>
          <AppLayout>
            <GestaoComercial />
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
      <Route path="/custos" element={
        <ProtectedRoute>
          <AppLayout>
            <Custos />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Initialize theme on app load
  React.useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
