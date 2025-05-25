
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DashboardData } from '../types';
import { useClienteStore } from './useClienteStore';

interface DashboardStore {
  dashboardData: DashboardData;
  loading: boolean;
  carregarDashboard: () => void;
  atualizarDashboard: (clientes: any[], pedidos: any[]) => void;
  getDashboardData: () => DashboardData;
  getDadosGraficoPDVsPorStatus: () => any[];
}

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set, get) => ({
      dashboardData: {
        contadoresStatus: {
          ativos: 0,
          emAnalise: 0,
          inativos: 0,
          aAtivar: 0,
          standby: 0
        },
        giroMedioSemanalPorPDV: [],
        giroMedioSemanalGeral: 0,
        previsaoGiroTotalSemanal: 0,
        previsaoGiroTotalMensal: 0
      },
      loading: false,
      
      carregarDashboard: () => {
        set({ loading: true });
        
        try {
          const clienteStore = useClienteStore.getState();
          const clientes = clienteStore.clientes;
          
          // Calcular contadores de status
          const contadoresStatus = {
            ativos: clientes.filter(c => c.statusCliente === 'Ativo').length,
            emAnalise: clientes.filter(c => c.statusCliente === 'Em análise').length,
            inativos: clientes.filter(c => c.statusCliente === 'Inativo').length,
            aAtivar: clientes.filter(c => c.statusCliente === 'A ativar').length,
            standby: clientes.filter(c => c.statusCliente === 'Standby').length,
          };
          
          // Filtrar clientes ativos com giro
          const clientesAtivos = clientes.filter(cliente => 
            cliente.statusCliente === 'Ativo' && 
            cliente.giroMedioSemanal && 
            cliente.giroMedioSemanal > 0
          );
          
          // Calcular giro médio semanal por PDV
          const giroMedioSemanalPorPDV = clientesAtivos.map(cliente => ({
            idCliente: cliente.id,
            nomeCliente: cliente.nome,
            giroSemanal: cliente.giroMedioSemanal || 0
          }));
          
          // Ordenar por giro semanal decrescente
          giroMedioSemanalPorPDV.sort((a, b) => b.giroSemanal - a.giroSemanal);
          
          // Calcular giro médio semanal geral
          const giroMedioSemanalGeral = clientesAtivos.length > 0 
            ? Math.round(clientesAtivos.reduce((sum, cliente) => sum + (cliente.giroMedioSemanal || 0), 0) / clientesAtivos.length)
            : 0;
          
          // Calcular previsão de giro total semanal (soma de todos os giros ativos)
          const previsaoGiroTotalSemanal = clientesAtivos.reduce((sum, cliente) => sum + (cliente.giroMedioSemanal || 0), 0);
          
          // Calcular previsão de giro total mensal (4.33 semanas por mês)
          const previsaoGiroTotalMensal = Math.round(previsaoGiroTotalSemanal * 4.33);
          
          const dashboardData: DashboardData = {
            contadoresStatus,
            giroMedioSemanalPorPDV,
            giroMedioSemanalGeral,
            previsaoGiroTotalSemanal,
            previsaoGiroTotalMensal
          };
          
          set({ dashboardData, loading: false });
        } catch (error) {
          console.error('Erro ao carregar dashboard:', error);
          set({ loading: false });
        }
      },

      atualizarDashboard: (clientes, pedidos) => {
        set({ loading: true });
        
        try {
          // Calcular contadores de status
          const contadoresStatus = {
            ativos: clientes.filter(c => c.statusCliente === 'Ativo').length,
            emAnalise: clientes.filter(c => c.statusCliente === 'Em análise').length,
            inativos: clientes.filter(c => c.statusCliente === 'Inativo').length,
            aAtivar: clientes.filter(c => c.statusCliente === 'A ativar').length,
            standby: clientes.filter(c => c.statusCliente === 'Standby').length,
          };
          
          // Filtrar clientes ativos com giro
          const clientesAtivos = clientes.filter(cliente => 
            cliente.statusCliente === 'Ativo' && 
            cliente.giroMedioSemanal && 
            cliente.giroMedioSemanal > 0
          );
          
          // Calcular giro médio semanal por PDV
          const giroMedioSemanalPorPDV = clientesAtivos.map(cliente => ({
            idCliente: cliente.id,
            nomeCliente: cliente.nome,
            giroSemanal: cliente.giroMedioSemanal || 0
          }));
          
          // Ordenar por giro semanal decrescente
          giroMedioSemanalPorPDV.sort((a, b) => b.giroSemanal - a.giroSemanal);
          
          // Calcular giro médio semanal geral
          const giroMedioSemanalGeral = clientesAtivos.length > 0 
            ? Math.round(clientesAtivos.reduce((sum, cliente) => sum + (cliente.giroMedioSemanal || 0), 0) / clientesAtivos.length)
            : 0;
          
          // Calcular previsão de giro total semanal (soma de todos os giros ativos)
          const previsaoGiroTotalSemanal = clientesAtivos.reduce((sum, cliente) => sum + (cliente.giroMedioSemanal || 0), 0);
          
          // Calcular previsão de giro total mensal (4.33 semanas por mês)
          const previsaoGiroTotalMensal = Math.round(previsaoGiroTotalSemanal * 4.33);
          
          const dashboardData: DashboardData = {
            contadoresStatus,
            giroMedioSemanalPorPDV,
            giroMedioSemanalGeral,
            previsaoGiroTotalSemanal,
            previsaoGiroTotalMensal
          };
          
          set({ dashboardData, loading: false });
        } catch (error) {
          console.error('Erro ao atualizar dashboard:', error);
          set({ loading: false });
        }
      },

      getDadosGraficoPDVsPorStatus: () => {
        const { dashboardData } = get();
        return [
          { name: 'Ativos', value: dashboardData.contadoresStatus.ativos },
          { name: 'Em Análise', value: dashboardData.contadoresStatus.emAnalise },
          { name: 'Inativos', value: dashboardData.contadoresStatus.inativos },
          { name: 'A Ativar', value: dashboardData.contadoresStatus.aAtivar },
          { name: 'Standby', value: dashboardData.contadoresStatus.standby }
        ];
      },
      
      getDashboardData: () => {
        return get().dashboardData;
      }
    }),
    { name: 'dashboard-store' }
  )
);
