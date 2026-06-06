import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExpedicaoUiState {
  // Filtros da Separação de Pedidos
  filtroTexto: string;
  filtroTipoPedido: string;
  filtroData: string;
  filtroRepresentantes: number[];
  filtroProdutos: string[];
  filtroProdutosModo: 'incluir' | 'excluir';
  
  // Tab ativa na Expedição
  activeTab: string;
  entregasTab: string;
  
  // Semana selecionada para Entregas Pendentes
  semanaAtrasados: string;
  
  // Modo de visualização: 'semana' ou 'todos'
  modoVisualizacaoAtrasados: 'semana' | 'todos';
  
  // Modo de data na Separação: 'dia' ou 'semana'
  modoDataSeparacao: 'dia' | 'semana';
  semanaSeparacao: string; // ISO date

  // Resumo da Expedição (independente da Separação)
  modoDataResumo: 'dia' | 'semana';
  dataResumo: string; // YYYY-MM-DD
  semanaResumo: string; // ISO date

  // Preset da aba Despacho
  presetDespacho: 'hoje' | 'semana' | 'atrasados' | 'todos';
  
  // Ações
  setFiltroTexto: (texto: string) => void;
  setFiltroTipoPedido: (tipo: string) => void;
  setFiltroData: (data: string) => void;
  setFiltroRepresentantes: (ids: number[]) => void;
  setFiltroProdutos: (ids: string[]) => void;
  setFiltroProdutosModo: (modo: 'incluir' | 'excluir') => void;
  setActiveTab: (tab: string) => void;
  setEntregasTab: (tab: string) => void;
  setSemanaAtrasados: (data: Date) => void;
  setModoVisualizacaoAtrasados: (modo: 'semana' | 'todos') => void;
  setModoDataSeparacao: (modo: 'dia' | 'semana') => void;
  setSemanaSeparacao: (data: Date) => void;
  setModoDataResumo: (modo: 'dia' | 'semana') => void;
  setDataResumo: (data: string) => void;
  setSemanaResumo: (data: Date) => void;
  setPresetDespacho: (preset: 'hoje' | 'semana' | 'atrasados' | 'todos') => void;
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
      filtroProdutos: [],
      filtroProdutosModo: 'incluir',
      activeTab: "resumo",
      entregasTab: "hoje",
      semanaAtrasados: new Date().toISOString(),
      modoVisualizacaoAtrasados: 'semana',
      modoDataSeparacao: 'dia',
      semanaSeparacao: new Date().toISOString(),
      modoDataResumo: 'dia',
      dataResumo: new Date().toISOString().split('T')[0],
      semanaResumo: new Date().toISOString(),
      presetDespacho: 'hoje',
      
      // Ações
      setFiltroTexto: (texto) => set({ filtroTexto: texto }),
      setFiltroTipoPedido: (tipo) => set({ filtroTipoPedido: tipo }),
      setFiltroData: (data) => set({ filtroData: data }),
      setFiltroRepresentantes: (ids) => set({ filtroRepresentantes: ids }),
      setFiltroProdutos: (ids) => set({ filtroProdutos: ids }),
      setFiltroProdutosModo: (modo) => set({ filtroProdutosModo: modo }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setEntregasTab: (tab) => set({ entregasTab: tab }),
      setSemanaAtrasados: (data) => set({ semanaAtrasados: data.toISOString() }),
      setModoVisualizacaoAtrasados: (modo) => set({ modoVisualizacaoAtrasados: modo }),
      setModoDataSeparacao: (modo) => set({ modoDataSeparacao: modo }),
      setSemanaSeparacao: (data) => set({ semanaSeparacao: data.toISOString() }),
      setModoDataResumo: (modo) => set({ modoDataResumo: modo }),
      setDataResumo: (data) => set({ dataResumo: data }),
      setSemanaResumo: (data) => set({ semanaResumo: data.toISOString() }),
      setPresetDespacho: (preset) => set({ presetDespacho: preset }),
      clearFilters: () => set({ 
        filtroTexto: "",
        filtroTipoPedido: "todos",
        filtroData: new Date().toISOString().split('T')[0],
        filtroRepresentantes: [],
        filtroProdutos: [],
        filtroProdutosModo: 'incluir',
        semanaAtrasados: new Date().toISOString(),
        modoVisualizacaoAtrasados: 'semana',
        modoDataSeparacao: 'dia',
        semanaSeparacao: new Date().toISOString(),
        modoDataResumo: 'dia',
        dataResumo: new Date().toISOString().split('T')[0],
        semanaResumo: new Date().toISOString(),
        presetDespacho: 'hoje'
      }),
    }),
    {
      name: 'expedicao-ui-state',
      version: 8,
    }
  )
);
