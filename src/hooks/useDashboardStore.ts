
import { create } from 'zustand';
import { Cliente, Pedido } from '../types';

interface DashboardData {
  totalPDVsAtivos: number;
  totalEntregasHoje: number;
  totalProducaoHoje: number;
  totalVendasSemana: number;
  clientesInativos: Cliente[];
  alertasUrgentes: string[];
  proximasEntregas: Pedido[];
  metricasDesempenho: {
    eficienciaEntrega: number;
    satisfacaoCliente: number;
    volumeProducao: number;
  };
}

interface DashboardStore {
  data: DashboardData;
  loading: boolean;
  loadDashboardData: (clientes: Cliente[], pedidos: Pedido[]) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  data: {
    totalPDVsAtivos: 0,
    totalEntregasHoje: 0,
    totalProducaoHoje: 0,
    totalVendasSemana: 0,
    clientesInativos: [],
    alertasUrgentes: [],
    proximasEntregas: [],
    metricasDesempenho: {
      eficienciaEntrega: 0,
      satisfacaoCliente: 0,
      volumeProducao: 0,
    },
  },
  loading: false,
  
  loadDashboardData: (clientes: Cliente[], pedidos: Pedido[]) => {
    set({ loading: true });
    
    // Calculate dashboard metrics
    const totalPDVsAtivos = clientes.filter(c => c.status_cliente === 'Ativo').length;
    const clientesEmAnalise = clientes.filter(c => c.status_cliente === 'Em análise').length;
    const clientesStandby = clientes.filter(c => c.status_cliente === 'Standby').length;
    const clientesAtivar = clientes.filter(c => c.status_cliente === 'A ativar').length;
    const clientesInativos = clientes.filter(c => c.status_cliente === 'Inativo').length;
    
    // Calculate clients without recent orders
    const hoje = new Date();
    const umMesAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const clientesSemPedidosRecentes = clientes.filter(cliente => {
      if (cliente.status_cliente !== 'Ativo') return false;
      
      const ultimaReposicao = cliente.ultima_data_reposicao_efetiva;
      if (!ultimaReposicao) return true;
      
      return new Date(ultimaReposicao) < umMesAtras;
    });
    
    // Calculate production metrics
    const clientesComGiro = clientes.filter(c => 
      c.ativo && c.quantidade_padrao && c.periodicidade_padrao
    );
    
    const giroSemanalEstimado = clientesComGiro.reduce((total, cliente) => {
      if (cliente.periodicidade_padrao === 3) {
        return total + ((cliente.quantidade_padrao || 0) * 3);
      }
      const periodicidadeSemanas = (cliente.periodicidade_padrao || 7) / 7;
      return total + Math.round((cliente.quantidade_padrao || 0) / periodicidadeSemanas);
    }, 0);
    
    // Calculate today's deliveries
    const entregasHoje = pedidos.filter(p => {
      const dataPrevista = new Date(p.dataPrevistaEntrega);
      return dataPrevista.toDateString() === hoje.toDateString();
    }).length;
    
    // Calculate weekly sales (estimated)
    const vendasSemana = giroSemanalEstimado * 5; // Preço médio estimado
    
    const dashboardData: DashboardData = {
      totalPDVsAtivos,
      totalEntregasHoje: entregasHoje,
      totalProducaoHoje: Math.round(giroSemanalEstimado / 7), // Daily average
      totalVendasSemana: vendasSemana,
      clientesInativos: clientesSemPedidosRecentes,
      alertasUrgentes: [
        clientesSemPedidosRecentes.length > 0 ? `${clientesSemPedidosRecentes.length} clientes sem pedidos há mais de 30 dias` : '',
        clientesEmAnalise > 0 ? `${clientesEmAnalise} clientes em análise` : '',
      ].filter(Boolean),
      proximasEntregas: pedidos
        .filter(p => new Date(p.dataPrevistaEntrega) >= hoje)
        .sort((a, b) => new Date(a.dataPrevistaEntrega).getTime() - new Date(b.dataPrevistaEntrega).getTime())
        .slice(0, 5),
      metricasDesempenho: {
        eficienciaEntrega: Math.min(95, Math.max(70, 90 - clientesSemPedidosRecentes.length)), // Between 70-95%
        satisfacaoCliente: Math.min(100, Math.max(80, 95 - (clientesEmAnalise * 2))), // Between 80-100%
        volumeProducao: Math.min(100, Math.max(60, (giroSemanalEstimado / 1000) * 100)), // Based on weekly volume
      },
    };
    
    set({ data: dashboardData, loading: false });
  },
}));
