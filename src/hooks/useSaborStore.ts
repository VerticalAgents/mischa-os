import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// Legacy store for compatibility - components should migrate to Supabase hooks
interface SaborStore {
  sabores: any[];
  
  // Actions - these will be handled by components using Supabase hooks
  adicionarSabor: (sabor: any) => void;
  editarSabor: (id: string, dadosAtualizados: any) => void;
  removerSabor: (id: string) => void;
  buscarSabores: () => any[];
}

export const useSaborStore = create<SaborStore>()(
  immer((set, get) => ({
    sabores: [],
    
    adicionarSabor: (sabor) => {
      console.warn('Use useSaboresSupabase hook instead of store');
    },
    
    editarSabor: (id, dadosAtualizados) => {
      console.warn('Use useSaboresSupabase hook instead of store');
    },
    
    removerSabor: (id) => {
      console.warn('Use useSaboresSupabase hook instead of store');
    },
    
    buscarSabores: () => {
      console.warn('Use useSaboresSupabase hook instead of store');
      return [];
    }
  }))
);
