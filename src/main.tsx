import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import './index.css';
import { applySecurityHeaders } from './utils/securityHeaders';
import App from './App';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import RequireAuth from '@/components/RequireAuth';
import Clients from '@/pages/Clients';
import Expedicao from '@/pages/Expedicao';
import Produtos from '@/pages/Produtos';
import Agendamentos from '@/pages/Agendamentos';
import ConfirmacaoReposicao from '@/pages/ConfirmacaoReposicao';
import Admin from '@/pages/Admin';
import Unauthorized from '@/pages/Unauthorized';
import RequireAdmin from '@/components/RequireAdmin';
import Categorias from '@/pages/Categorias';
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
        element: <Login />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password",
        element: <ResetPassword />,
      },
      {
        path: "/dashboard",
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/clients",
        element: (
          <RequireAuth>
            <Clients />
          </RequireAuth>
        ),
      },
      {
        path: "/expedicao",
        element: (
          <RequireAuth>
            <Expedicao />
          </RequireAuth>
        ),
      },
      {
        path: "/produtos",
        element: (
          <RequireAuth>
            <Produtos />
          </RequireAuth>
        ),
      },
      {
        path: "/agendamentos",
        element: (
          <RequireAuth>
            <Agendamentos />
          </RequireAuth>
        ),
      },
      {
        path: "/confirmacao-reposicao",
        element: (
          <RequireAuth>
            <ConfirmacaoReposicao />
          </RequireAuth>
        ),
      },
      {
        path: "/categorias",
        element: (
          <RequireAuth>
            <Categorias />
          </RequireAuth>
        ),
      },
      {
        path: "/configuracoes",
        element: (
          <RequireAuth>
            <Configuracoes />
          </RequireAuth>
        ),
      },
      {
        path: "/admin",
        element: (
          <RequireAuth>
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          </RequireAuth>
        ),
      },
      {
        path: "/unauthorized",
        element: <Unauthorized />,
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
