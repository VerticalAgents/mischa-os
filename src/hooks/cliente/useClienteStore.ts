
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente, StatusCliente } from '../../types';
import { clientesMock } from '../../data/mockData';
import { generateInitialClientes } from './utils';
import clienteActions from './clienteActions';
import { getClientesFiltrados, getClientePorId } from './clienteSelectors';

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
  setMetaGiro: (idCliente: number, metaSemanal: number) => void;
  
  // Getters
  getClientesFiltrados: () => Cliente[];
  getClientePorId: (id: number) => Cliente | undefined;
}

export const useClienteStore = create<ClienteStore>()(
  devtools(
    (set, get) => ({
      clientes: generateInitialClientes(),
      clienteAtual: null,
      filtros: {
        termo: '',
        status: 'Todos'
      },
      
      // Actions
      setClientes: clienteActions.setClientes(set),
      adicionarCliente: clienteActions.adicionarCliente(get, set),
      atualizarCliente: clienteActions.atualizarCliente(set),
      removerCliente: clienteActions.removerCliente(set),
      selecionarCliente: clienteActions.selecionarCliente(get, set),
      setFiltroTermo: clienteActions.setFiltroTermo(set),
      setFiltroStatus: clienteActions.setFiltroStatus(set),
      setMetaGiro: clienteActions.setMetaGiro(set),
      
      // Getters
      getClientesFiltrados: () => getClientesFiltrados(get().clientes, get().filtros),
      getClientePorId: (id) => getClientePorId(get().clientes, id)
    }),
    { name: 'cliente-store' }
  )
);
