
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DashboardData, Cliente, Pedido } from '../types';
import { calcularGiroSemanalPDV, calcularPrevisaoGiroSemanal, calcularPrevisaoGiroMensal } from '../utils/calculations';

interface DashboardStore {
  dashboardData: DashboardData;
  
  // Ações
  atualizarDashboard: (clientes: Cliente[], pedidos: Pedido[]) => void;
  
  // Getters
  getContadoresStatus: () => DashboardData['contadoresStatus'];
  getGiroMedioSemanalPorPDV: () => DashboardData['giroMedioSemanalPorPDV'];
  getGiroMedioSemanalGeral: () => number;
  getPrevisaoGiroTotalSemanal: () => number;
  getPrevisaoGiroTotalMensal: () => number;
  getDadosGraficoPDVsPorStatus: () => { name: string; value: number }[];
}

// Initial dashboard data state to prevent undefined errors
const initialDashboardData: DashboardData = {
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
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set, get) => ({
      dashboardData: initialDashboardData,
      
      atualizarDashboard: (clientes, pedidos) => {
        // Prevent executing if no data
        if (!clientes || clientes.length === 0) {
          console.log("No client data to update dashboard");
          return;
        }
        
        // Prevent unnecessary updates - check if we have the data filled already
        const currentData = get().dashboardData;
        if (currentData.contadoresStatus.ativos > 0 && currentData.giroMedioSemanalPorPDV.length > 0) {
          console.log("Dashboard data already loaded, skipping update");
          return; // Data already loaded, skip update
        }
        
        console.log("Calculating dashboard data...");
        
        // 1. Calcular contadores de status
        const contadoresStatus = {
          ativos: clientes.filter(c => c.statusCliente === "Ativo").length,
          emAnalise: clientes.filter(c => c.statusCliente === "Em análise").length,
          inativos: clientes.filter(c => c.statusCliente === "Inativo").length,
          aAtivar: clientes.filter(c => c.statusCliente === "A ativar").length,
          standby: clientes.filter(c => c.statusCliente === "Standby").length
        };
        
        // 2. Calcular giro médio semanal por PDV
        const clientesAtivosAnalise = clientes.filter(c => 
          c.statusCliente === "Ativo" || c.statusCliente === "Em análise"
        );
        
        const giroMedioSemanalPorPDV = clientesAtivosAnalise
          .filter(cliente => cliente.ultimaDataReposicaoEfetiva)
          .map(cliente => {
            // Encontrar o último pedido entregue para este cliente
            const ultimoPedidoEntregue = pedidos
              .filter(p => 
                p.idCliente === cliente.id && 
                p.statusPedido === "Entregue" &&
                p.dataEfetivaEntrega
              )
              .sort((a, b) => 
                new Date(b.dataEfetivaEntrega!).getTime() - new Date(a.dataEfetivaEntrega!).getTime()
              )[0];
            
            if (!ultimoPedidoEntregue || !ultimoPedidoEntregue.dataEfetivaEntrega || !cliente.ultimaDataReposicaoEfetiva) {
              return {
                idCliente: cliente.id,
                nomeCliente: cliente.nome,
                giroSemanal: cliente.quantidadePadrao * (7 / cliente.periodicidadePadrao) // Estimativa baseada no Qp e Pp
              };
            }
            
            // Encontrar o penúltimo pedido entregue (para calcular o delta)
            const penultimoPedidoEntregue = pedidos
              .filter(p => 
                p.idCliente === cliente.id && 
                p.statusPedido === "Entregue" &&
                p.dataEfetivaEntrega &&
                new Date(p.dataEfetivaEntrega).getTime() < new Date(ultimoPedidoEntregue.dataEfetivaEntrega!).getTime()
              )
              .sort((a, b) => 
                new Date(b.dataEfetivaEntrega!).getTime() - new Date(a.dataEfetivaEntrega!).getTime()
              )[0];
            
            if (!penultimoPedidoEntregue || !penultimoPedidoEntregue.dataEfetivaEntrega) {
              return {
                idCliente: cliente.id,
                nomeCliente: cliente.nome,
                giroSemanal: cliente.quantidadePadrao * (7 / cliente.periodicidadePadrao) // Estimativa baseada no Qp e Pp
              };
            }
            
            // Calcular delta efetivo
            const deltaEfetivo = Math.max(1, Math.round(
              (new Date(ultimoPedidoEntregue.dataEfetivaEntrega).getTime() - 
               new Date(penultimoPedidoEntregue.dataEfetivaEntrega).getTime()) / 
              (1000 * 60 * 60 * 24)
            ));
            
            // Calcular o total entregue
            const totalEntregue = ultimoPedidoEntregue.itensPedido.reduce(
              (sum, item) => sum + (item.quantidadeEntregue ?? item.quantidadeSabor), 0
            );
            
            // Calcular o giro semanal
            const giroSemanal = calcularGiroSemanalPDV(totalEntregue, deltaEfetivo);
            
            return {
              idCliente: cliente.id,
              nomeCliente: cliente.nome,
              giroSemanal
            };
          });
        
        // 3. Calcular giro médio semanal geral
        const totalGiroSemanal = giroMedioSemanalPorPDV.reduce((sum, pdv) => sum + pdv.giroSemanal, 0);
        const giroMedioSemanalGeral = giroMedioSemanalPorPDV.length > 0 
          ? totalGiroSemanal / giroMedioSemanalPorPDV.length
          : 0;
        
        // 4. Calcular previsão de giro semanal
        const previsaoGiroTotalSemanal = calcularPrevisaoGiroSemanal(
          clientes.filter(c => c.statusCliente === "Ativo")
        );
        
        // 5. Calcular previsão de giro mensal
        const previsaoGiroTotalMensal = calcularPrevisaoGiroMensal(previsaoGiroTotalSemanal);
        
        // Prepare the new data
        const newDashboardData = {
          contadoresStatus,
          giroMedioSemanalPorPDV,
          giroMedioSemanalGeral,
          previsaoGiroTotalSemanal,
          previsaoGiroTotalMensal
        };
        
        console.log("Dashboard data calculated, updating store...");
        
        // Update the store with a single, atomic operation
        set({ dashboardData: newDashboardData });
      },
      
      // Keep getters the same
      getContadoresStatus: () => get().dashboardData.contadoresStatus,
      getGiroMedioSemanalPorPDV: () => get().dashboardData.giroMedioSemanalPorPDV,
      getGiroMedioSemanalGeral: () => get().dashboardData.giroMedioSemanalGeral,
      getPrevisaoGiroTotalSemanal: () => get().dashboardData.previsaoGiroTotalSemanal,
      getPrevisaoGiroTotalMensal: () => get().dashboardData.previsaoGiroTotalMensal,
      getDadosGraficoPDVsPorStatus: () => {
        const { contadoresStatus } = get().dashboardData;
        
        return [
          { name: 'Ativos', value: contadoresStatus.ativos },
          { name: 'Em análise', value: contadoresStatus.emAnalise },
          { name: 'A ativar', value: contadoresStatus.aAtivar },
          { name: 'Standby', value: contadoresStatus.standby },
          { name: 'Inativos', value: contadoresStatus.inativos }
        ];
      }
    }),
    { name: 'dashboard-store' }
  )
);
