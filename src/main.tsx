
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import './index.css';
import { applySecurityHeaders } from './utils/securityHeaders';
import App from './App';
import LoginPage from '@/pages/auth/LoginPage';
import AuthPage from '@/pages/auth/AuthPage';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Clientes from '@/pages/Clientes';
import Expedicao from '@/pages/Expedicao';
import Agendamento from '@/pages/Agendamento';
import ConfirmacaoReposicao from '@/pages/ConfirmacaoReposicao';
import Configuracoes from '@/pages/Configuracoes';
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
import AgentesIA from '@/pages/AgentesIA';
import AgenteIAPage from '@/pages/AgenteIAPage';
import Projections from '@/pages/Projections';
import Custos from '@/pages/financeiro/Custos';
import NotFound from '@/pages/NotFound';

// Apply security headers
applySecurityHeaders();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "auth",
        element: <AuthPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "home",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Home />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "clientes",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Clientes />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "expedicao",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Expedicao />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "agendamento",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Agendamento />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "confirmacao-reposicao",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <ConfirmacaoReposicao />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "configuracoes",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Configuracoes />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "estoque",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Estoque />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "estoque/insumos",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <EstoqueInsumos />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "pcp",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <PCP />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "precificacao",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Precificacao />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "gestao-comercial",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <GestaoComercial />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "gestao-comercial/funil-leads",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <FunilLeads />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "gestao-comercial/distribuidores",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Distribuidores />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "gestao-comercial/parceiros",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Parceiros />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard-analytics",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <DashboardAnalytics />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "analise-giro",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <AnaliseGiro />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "gestao-financeira",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <GestaoFinanceira />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "gestao-financeira/projecao-resultados-pdv",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <ProjecaoResultadosPDV />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "gestao-financeira/ponto-equilibrio",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <PontoEquilibrio />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "agentes-ia",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <AgentesIA />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "agentes-ia/:id",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <AgenteIAPage />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "projecoes",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Projections />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "custos",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Custos />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <NotFound />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>
);
