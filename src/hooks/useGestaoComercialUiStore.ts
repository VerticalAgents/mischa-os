
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GestaoComercialUiState {
  // Tab ativa
  activeTab: string;
  
  // Filtros por aba (exemplo para representantes)
  representantesFiltros: {
    texto: string;
    status: string;
    regiao: string;
  };
  
  // Filtros para outras abas podem ser adicionados aqui
  funilLeadsFiltros: {
    texto: string;
    status: string;
  };
  
  // Ações
  setActiveTab: (tab: string) => void;
  setRepresentantesFiltros: (filtros: Partial<GestaoComercialUiState['representantesFiltros']>) => void;
  setFunilLeadsFiltros: (filtros: Partial<GestaoComercialUiState['funilLeadsFiltros']>) => void;
  clearFiltros: () => void;
}

export const useGestaoComercialUiStore = create<GestaoComercialUiState>()(
  persist(
    (set) => ({
      // Estado inicial
      activeTab: "representantes",
      representantesFiltros: {
        texto: "",
        status: "todos",
        regiao: "todas"
      },
      funilLeadsFiltros: {
        texto: "",
        status: "todos"
      },
      
      // Ações
      setActiveTab: (tab) => set({ activeTab: tab }),
      setRepresentantesFiltros: (filtros) => 
        set((state) => ({ 
          representantesFiltros: { ...state.representantesFiltros, ...filtros }
        })),
      setFunilLeadsFiltros: (filtros) => 
        set((state) => ({ 
          funilLeadsFiltros: { ...state.funilLeadsFiltros, ...filtros }
        })),
      clearFiltros: () => set({
        representantesFiltros: { texto: "", status: "todos", regiao: "todas" },
        funilLeadsFiltros: { texto: "", status: "todos" }
      }),
    }),
    {
      name: 'gestao-comercial-ui-state',
      version: 1,
    }
  )
);
