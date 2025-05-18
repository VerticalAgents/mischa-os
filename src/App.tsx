
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import Precificacao from "@/pages/Precificacao";
import Agendamento from "@/pages/Agendamento";
import Estoque from "@/pages/Estoque";
import Configuracoes from "@/pages/Configuracoes";
import PCP from "@/pages/PCP";
import Expedicao from "@/pages/Expedicao";
import Projections from "@/pages/Projections";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AppLayout>
              <Dashboard />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
