
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import './index.css';
import { applySecurityHeaders } from './utils/securityHeaders';
import App from './App';
import LoginPage from '@/pages/auth/LoginPage';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Clientes from '@/pages/Clientes';
import Expedicao from '@/pages/Expedicao';
import Agendamento from '@/pages/Agendamento';
import ConfirmacaoReposicao from '@/pages/ConfirmacaoReposicao';
import Configuracoes from '@/pages/Configuracoes';

// Apply security headers
applySecurityHeaders();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/clientes",
        element: (
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        ),
      },
      {
        path: "/expedicao",
        element: (
          <ProtectedRoute>
            <Expedicao />
          </ProtectedRoute>
        ),
      },
      {
        path: "/agendamento",
        element: (
          <ProtectedRoute>
            <Agendamento />
          </ProtectedRoute>
        ),
      },
      {
        path: "/confirmacao-reposicao",
        element: (
          <ProtectedRoute>
            <ConfirmacaoReposicao />
          </ProtectedRoute>
        ),
      },
      {
        path: "/configuracoes",
        element: (
          <ProtectedRoute>
            <Configuracoes />
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
