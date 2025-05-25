import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { HistoricoProducao } from "@/types";

// Legacy store for compatibility - components should migrate to Supabase hooks
interface HistoricoProducaoStore {
  historico: any[];
  
  // Actions - these will be handled by components using Supabase hooks
  adicionarRegistroHistorico: (registro: any) => void;
  editarRegistroHistorico: (id: number, dadosAtualizados: any) => void;
  obterHistoricoPorPeriodo: (dataInicio: Date, dataFim: Date) => any[];
  obterHistoricoPorProduto: (produtoNome: string) => any[];
}

export const useHistoricoProducaoStore = create<HistoricoProducaoStore>()(
  immer((set, get) => ({
    historico: [],
    
    adicionarRegistroHistorico: (registro) => {
      console.warn('Use useHistoricoProducaoSupabase hook instead of store');
    },
    
    editarRegistroHistorico: (id, dadosAtualizados) => {
      console.warn('Use useHistoricoProducaoSupabase hook instead of store');
    },
    
    obterHistoricoPorPeriodo: (dataInicio, dataFim) => {
      console.warn('Use useHistoricoProducaoSupabase hook instead of store');
      return [];
    },
    
    obterHistoricoPorProduto: (produtoNome) => {
      console.warn('Use useHistoricoProducaoSupabase hook instead of store');
      return [];
    }
  }))
);
