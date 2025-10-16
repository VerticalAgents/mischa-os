
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExpedicaoUiState {
  // Filtros da Separação de Pedidos
  filtroTexto: string;
  filtroTipoPedido: string;
  filtroData: string;
  filtroRepresentantes: number[];
  
  // Tab ativa na Expedição
  activeTab: string;
  entregasTab: string;
  
  // Ações
  setFiltroTexto: (texto: string) => void;
  setFiltroTipoPedido: (tipo: string) => void;
  setFiltroData: (data: string) => void;
  setFiltroRepresentantes: (ids: number[]) => void;
  setActiveTab: (tab: string) => void;
  setEntregasTab: (tab: string) => void;
  clearFilters: () => void;
}

export const useExpedicaoUiStore = create<ExpedicaoUiState>()(
  persist(
    (set) => ({
      // Estado inicial
      filtroTexto: "",
      filtroTipoPedido: "todos",
      filtroData: new Date().toISOString().split('T')[0],
      filtroRepresentantes: [],
      activeTab: "resumo",
      entregasTab: "hoje",
      
      // Ações
      setFiltroTexto: (texto) => set({ filtroTexto: texto }),
      setFiltroTipoPedido: (tipo) => set({ filtroTipoPedido: tipo }),
      setFiltroData: (data) => set({ filtroData: data }),
      setFiltroRepresentantes: (ids) => set({ filtroRepresentantes: ids }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setEntregasTab: (tab) => set({ entregasTab: tab }),
      clearFilters: () => set({ 
        filtroTexto: "",
        filtroTipoPedido: "todos",
        filtroData: new Date().toISOString().split('T')[0],
        filtroRepresentantes: []
      }),
    }),
    {
      name: 'expedicao-ui-state',
      version: 1,
    }
  )
);
