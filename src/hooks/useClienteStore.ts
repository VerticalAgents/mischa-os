
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente, StatusCliente } from '../types';
import { clientesMock } from '../data/mockData';

// Dados dos clientes com giro semanal e periodicidade
const clientesComDados: Partial<Cliente>[] = [
  { nome: "AMPM (João Wallig)", quantidadePadrao: 15, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Dr. João Wallig, 1800 - Passo da Areia, Porto Alegre - RS" },
  { nome: "Arena Sports Poa", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Bento Gonçalves, 567 - Partenon, Porto Alegre - RS" },
  { nome: "Argentum", quantidadePadrao: 50, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. 24 de Outubro, 111 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Armazém da Redenção", quantidadePadrao: 20, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. José Bonifácio, 675 - Farroupilha, Porto Alegre - RS" },
  { nome: "Armazém do Sabor", quantidadePadrao: 7, periodicidadePadrao: 14, statusCliente: "A ativar", enderecoEntrega: "R. Padre Chagas, 342 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Bampi", quantidadePadrao: 5, periodicidadePadrao: 21, statusCliente: "Ativo", enderecoEntrega: "R. Silva Jardim, 408 - Auxiliadora, Porto Alegre - RS" },
  { nome: "Bendita Esquina", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Osvaldo Aranha, 960 - Bom Fim, Porto Alegre - RS" },
  { nome: "Boteco 787", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Protásio Alves, 787 - Rio Branco, Porto Alegre - RS" },
  { nome: "Bruno - Distribuidor", quantidadePadrao: 120, periodicidadePadrao: 14, statusCliente: "Em análise", enderecoEntrega: "Av. Assis Brasil, 3522 - São Sebastião, Porto Alegre - RS" },
  { nome: "Cafeína e Gasolina", quantidadePadrao: 30, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. Barão do Triunfo, 440 - Azenha, Porto Alegre - RS" },
  { nome: "CASL", quantidadePadrao: 15, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Ipiranga, 6681 - Partenon, Porto Alegre - RS" },
  { nome: "Cavanhas Barão", quantidadePadrao: 8, periodicidadePadrao: 21, statusCliente: "Standby", enderecoEntrega: "Av. Barão do Amazonas, 123 - São Geraldo, Porto Alegre - RS" },
  { nome: "CECIV UFRGS", quantidadePadrao: 25, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Paulo Gama, 110 - Farroupilha, Porto Alegre - RS" },
  { nome: "Cestas POA", quantidadePadrao: 20, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "R. Ramiro Barcelos, 1450 - Rio Branco, Porto Alegre - RS" },
  { nome: "Chalet Suisse", quantidadePadrao: 20, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Goethe, 100 - Rio Branco, Porto Alegre - RS" },
  { nome: "Confraria do Café", quantidadePadrao: 15, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "Av. Independência, 820 - Independência, Porto Alegre - RS" },
  { nome: "Curtir e Celebrar Cestas", quantidadePadrao: 5, periodicidadePadrao: 21, statusCliente: "Inativo", enderecoEntrega: "R. Gonçalo de Carvalho, 330 - Floresta, Porto Alegre - RS" },
  { nome: "DAEAMB", quantidadePadrao: 20, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Bento Gonçalves, 9500 - Agronomia, Porto Alegre - RS" },
  { nome: "DAPROD UFRGS", quantidadePadrao: 30, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Paulo Gama, 110 - Farroupilha, Porto Alegre - RS" },
  { nome: "DCE UFCSPA", quantidadePadrao: 208, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. Sarmento Leite, 245 - Centro Histórico, Porto Alegre - RS" },
  { nome: "Demarchi", quantidadePadrao: 15, periodicidadePadrao: 21, statusCliente: "A ativar", enderecoEntrega: "Av. Cristóvão Colombo, 545 - Floresta, Porto Alegre - RS" },
  { nome: "Divino Verde", quantidadePadrao: 90, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. Quintino Bocaiúva, 707 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "E.E.E.E.F Jerônimo de Alb.", quantidadePadrao: 10, periodicidadePadrao: 21, statusCliente: "Ativo", enderecoEntrega: "R. Jerônimo de Ornelas, 55 - Santana, Porto Alegre - RS" },
  { nome: "Engenho do Pão", quantidadePadrao: 30, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "R. Mariante, 288 - Rio Branco, Porto Alegre - RS" },
  { nome: "Eurostock Investimentos", quantidadePadrao: 30, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "Av. Carlos Gomes, 300 - Auxiliadora, Porto Alegre - RS" },
  { nome: "Everest Pub", quantidadePadrao: 10, periodicidadePadrao: 28, statusCliente: "Ativo", enderecoEntrega: "R. Olavo Barreto Viana, 18 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "EWF Luta Livre", quantidadePadrao: 12, periodicidadePadrao: 28, statusCliente: "Ativo", enderecoEntrega: "R. Mostardeiro, 780 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Giulia - Distribuidor", quantidadePadrao: 150, periodicidadePadrao: 3, statusCliente: "Ativo", enderecoEntrega: "Av. Borges de Medeiros, 2500 - Praia de Belas, Porto Alegre - RS" },
  { nome: "GL Assados", quantidadePadrao: 10, periodicidadePadrao: 28, statusCliente: "Standby", enderecoEntrega: "Av. Otto Niemeyer, 2500 - Cavalhada, Porto Alegre - RS" },
  { nome: "Guadalajara Formaturas", quantidadePadrao: 100, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Ipiranga, 5200 - Azenha, Porto Alegre - RS" }
];

// Convert periodicidade text to number of days
const convertPeriodicidade = (periodicidade: string): number => {
  if (periodicidade.includes('semana')) {
    const num = parseInt(periodicidade.split(' ')[0]);
    return num * 7; // semanas para dias
  } else if (periodicidade.includes('dia')) {
    return parseInt(periodicidade.split(' ')[0]);
  } else if (periodicidade.includes('3x semana')) {
    return 3; // 3 vezes por semana (aproximadamente a cada 3 dias)
  }
  return 7; // default é uma semana
};

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
      clientes: [
        ...clientesMock,
        ...clientesComDados.map((cliente, index) => ({
          id: 1000 + index,
          nome: cliente.nome || `Cliente ${1000 + index}`,
          cnpjCpf: `${Math.floor(Math.random() * 99)}.${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}/0001-${Math.floor(Math.random() * 99)}`,
          enderecoEntrega: cliente.enderecoEntrega || `Endereço do cliente ${1000 + index}`,
          contatoNome: `Contato ${1000 + index}`,
          contatoTelefone: `(51) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          contatoEmail: `contato@${cliente.nome?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
          quantidadePadrao: cliente.quantidadePadrao || 0,
          periodicidadePadrao: cliente.periodicidadePadrao || 7,
          statusCliente: cliente.statusCliente || "Ativo",
          dataCadastro: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
        }))
      ],
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
