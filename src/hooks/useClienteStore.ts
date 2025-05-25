import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// Legacy store for compatibility - components should migrate to Supabase hooks
interface ClienteStore {
  clientes: any[];
  
  // Actions - these will be handled by components using Supabase hooks
  adicionarCliente: (cliente: any) => void;
  editarCliente: (id: string, dadosAtualizados: any) => void;
  removerCliente: (id: string) => void;
  buscarClientes: () => any[];
}

export const useClienteStore = create<ClienteStore>()(
  immer((set, get) => ({
    clientes: [],
    
    adicionarCliente: (cliente) => {
      console.warn('Use useClientesSupabase hook instead of store');
    },
    
    editarCliente: (id, dadosAtualizados) => {
      console.warn('Use useClientesSupabase hook instead of store');
    },
    
    removerCliente: (id) => {
      console.warn('Use useClientesSupabase hook instead of store');
    },
    
    buscarClientes: () => {
      console.warn('Use useClientesSupabase hook instead of store');
      return [];
    }
  }))
);
