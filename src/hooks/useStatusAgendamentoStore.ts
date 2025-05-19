
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StatusAgendamento {
  id: number;
  nome: string;
  descricao: string;
  cor: string;
  fixo: boolean;
}

interface StatusAgendamentoStore {
  statusAgendamento: StatusAgendamento[];
  adicionarStatus: (status: Omit<StatusAgendamento, 'id'>) => void;
  atualizarStatus: (id: number, dados: Partial<StatusAgendamento>) => void;
  removerStatus: (id: number) => void;
  getStatusFixos: () => StatusAgendamento[];
  getStatusPersonalizados: () => StatusAgendamento[];
}

// Status fixos do sistema
const statusFixosIniciais: StatusAgendamento[] = [
  {
    id: 1,
    nome: 'Agendar',
    descricao: 'Cliente sem data agendada no sistema',
    cor: '#F97316', // Orange
    fixo: true
  },
  {
    id: 2,
    nome: 'Previsto',
    descricao: 'Possui data prevista, mas ainda precisa de confirmação',
    cor: '#F59E0B', // Amber
    fixo: true
  },
  {
    id: 3,
    nome: 'Agendado',
    descricao: 'Data confirmada, entrega será realizada',
    cor: '#10B981', // Green
    fixo: true
  },
  {
    id: 4,
    nome: 'Reagendar',
    descricao: 'Entrega realizada, aguardando definição da próxima reposição',
    cor: '#8B5CF6', // Purple
    fixo: true
  }
];

export const useStatusAgendamentoStore = create<StatusAgendamentoStore>()(
  devtools(
    (set, get) => ({
      statusAgendamento: statusFixosIniciais,
      
      adicionarStatus: (status) => {
        set((state) => {
          const novoId = Math.max(0, ...state.statusAgendamento.map(s => s.id)) + 1;
          return {
            statusAgendamento: [
              ...state.statusAgendamento,
              { ...status, id: novoId }
            ]
          };
        });
      },
      
      atualizarStatus: (id, dados) => {
        set((state) => ({
          statusAgendamento: state.statusAgendamento.map(status => 
            status.id === id ? { ...status, ...dados } : status
          )
        }));
      },
      
      removerStatus: (id) => {
        // Não permitir remover status fixos
        const status = get().statusAgendamento.find(s => s.id === id);
        if (status?.fixo) return;
        
        set((state) => ({
          statusAgendamento: state.statusAgendamento.filter(s => s.id !== id)
        }));
      },
      
      getStatusFixos: () => {
        return get().statusAgendamento.filter(s => s.fixo);
      },
      
      getStatusPersonalizados: () => {
        return get().statusAgendamento.filter(s => !s.fixo);
      }
    }),
    { name: 'status-agendamento-store' }
  )
);
