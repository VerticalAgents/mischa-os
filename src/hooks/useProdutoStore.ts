import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useProdutosSupabase } from "./useProdutosSupabase";

// This store now acts as a wrapper around Supabase hooks
interface ProdutoStore {
  produtos: any[];
  
  // Actions - these will be handled by components using Supabase hooks
  adicionarProduto: (produto: any) => void;
  editarProduto: (id: number, dadosAtualizados: any) => void;
  removerProduto: (id: number) => void;
  buscarProdutos: () => any[];
}

// Legacy store for compatibility - components should migrate to Supabase hooks
export const useProdutoStore = create<ProdutoStore>()(
  immer((set, get) => ({
    produtos: [],
    
    adicionarProduto: (produto) => {
      console.warn('Use useProdutosSupabase hook instead of store');
    },
    
    editarProduto: (id, dadosAtualizados) => {
      console.warn('Use useProdutosSupabase hook instead of store');
    },
    
    removerProduto: (id) => {
      console.warn('Use useProdutosSupabase hook instead of store');
    },
    
    buscarProdutos: () => {
      console.warn('Use useProdutosSupabase hook instead of store');
      return [];
    }
  }))
);
