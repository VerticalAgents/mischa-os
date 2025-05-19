
import { Cliente } from '../../types';
import { calcularGiroSemanal } from './utils';

// Actions for cliente store
const clienteActions = {
  setClientes: (set: Function) => (clientes: Cliente[]) => {
    set({ clientes });
  },
  
  adicionarCliente: (get: Function, set: Function) => (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => {
    const novoId = Math.max(0, ...get().clientes.map((c: Cliente) => c.id)) + 1;
    
    set((state: any) => ({
      clientes: [
        ...state.clientes,
        {
          ...cliente,
          id: novoId,
          dataCadastro: new Date(),
          metaGiroSemanal: Math.round(calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao) * 1.2)
        }
      ]
    }));
  },
  
  atualizarCliente: (set: Function) => (id: number, dadosCliente: Partial<Cliente>) => {
    set((state: any) => ({
      clientes: state.clientes.map((cliente: Cliente) => 
        cliente.id === id ? { ...cliente, ...dadosCliente } : cliente
      ),
      clienteAtual: state.clienteAtual?.id === id ? { ...state.clienteAtual, ...dadosCliente } : state.clienteAtual
    }));
  },
  
  removerCliente: (set: Function) => (id: number) => {
    set((state: any) => ({
      clientes: state.clientes.filter((cliente: Cliente) => cliente.id !== id),
      clienteAtual: state.clienteAtual?.id === id ? null : state.clienteAtual
    }));
  },
  
  selecionarCliente: (get: Function, set: Function) => (id: number | null) => {
    if (id === null) {
      set({ clienteAtual: null });
      return;
    }
    
    const cliente = get().clientes.find((c: Cliente) => c.id === id);
    set({ clienteAtual: cliente || null });
  },
  
  setFiltroTermo: (set: Function) => (termo: string) => {
    set((state: any) => ({
      filtros: {
        ...state.filtros,
        termo
      }
    }));
  },
  
  setFiltroStatus: (set: Function) => (status: string) => {
    set((state: any) => ({
      filtros: {
        ...state.filtros,
        status
      }
    }));
  },
  
  setMetaGiro: (set: Function) => (idCliente: number, metaSemanal: number) => {
    set((state: any) => ({
      clientes: state.clientes.map((cliente: Cliente) => 
        cliente.id === idCliente ? { ...cliente, metaGiroSemanal: metaSemanal } : cliente
      ),
      clienteAtual: state.clienteAtual?.id === idCliente ? { ...state.clienteAtual, metaGiroSemanal: metaSemanal } : state.clienteAtual
    }));
  }
};

export default clienteActions;
