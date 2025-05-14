
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente, StatusCliente } from '../types';
import { clientesMock } from '../data/mockData';

interface ClienteStore {
  clientes: Cliente[];
  clienteAtual: Cliente | null;
  filtros: {
    termo: string;
    status: StatusCliente | 'Todos';
  };
  
  // Ações
  setClientes: (clientes: Cliente[]) => void;
  adicionarCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => void;
  atualizarCliente: (id: number, dadosCliente: Partial<Cliente>) => void;
  removerCliente: (id: number) => void;
  selecionarCliente: (id: number | null) => void;
  setFiltroTermo: (termo: string) => void;
  setFiltroStatus: (status: StatusCliente | 'Todos') => void;
  
  // Getters
  getClientesFiltrados: () => Cliente[];
  getClientePorId: (id: number) => Cliente | undefined;
}

export const useClienteStore = create<ClienteStore>()(
  devtools(
    (set, get) => ({
      clientes: clientesMock,
      clienteAtual: null,
      filtros: {
        termo: '',
        status: 'Todos'
      },
      
      setClientes: (clientes) => set({ clientes }),
      
      adicionarCliente: (cliente) => {
        const novoId = Math.max(0, ...get().clientes.map(c => c.id)) + 1;
        
        set(state => ({
          clientes: [
            ...state.clientes,
            {
              ...cliente,
              id: novoId,
              dataCadastro: new Date()
            }
          ]
        }));
      },
      
      atualizarCliente: (id, dadosCliente) => {
        set(state => ({
          clientes: state.clientes.map(cliente => 
            cliente.id === id ? { ...cliente, ...dadosCliente } : cliente
          )
        }));
      },
      
      removerCliente: (id) => {
        set(state => ({
          clientes: state.clientes.filter(cliente => cliente.id !== id),
          clienteAtual: state.clienteAtual?.id === id ? null : state.clienteAtual
        }));
      },
      
      selecionarCliente: (id) => {
        if (id === null) {
          set({ clienteAtual: null });
          return;
        }
        
        const cliente = get().clientes.find(c => c.id === id);
        set({ clienteAtual: cliente || null });
      },
      
      setFiltroTermo: (termo) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            termo
          }
        }));
      },
      
      setFiltroStatus: (status) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            status
          }
        }));
      },
      
      getClientesFiltrados: () => {
        const { clientes, filtros } = get();
        
        return clientes.filter(cliente => {
          // Filtro por termo
          const termoMatch = filtros.termo === '' || 
            cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
            (cliente.cnpjCpf && cliente.cnpjCpf.includes(filtros.termo));
          
          // Filtro por status
          const statusMatch = filtros.status === 'Todos' || cliente.statusCliente === filtros.status;
          
          return termoMatch && statusMatch;
        });
      },
      
      getClientePorId: (id) => {
        return get().clientes.find(c => c.id === id);
      }
    }),
    { name: 'cliente-store' }
  )
);
