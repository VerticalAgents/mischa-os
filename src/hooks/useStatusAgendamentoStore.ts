
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StatusAgendamento {
  id: number;
  nome: string;
  descricao: string;
  cor: string;
  fixo: boolean;
}

export interface StatusConfirmacao {
  id: number;
  nome: string;
  descricao: string;
  cor: string;
  fixo: boolean;
  acaoRequerida: boolean;
}

interface StatusAgendamentoStore {
  statusAgendamento: StatusAgendamento[];
  statusConfirmacao: StatusConfirmacao[];
  adicionarStatus: (status: Omit<StatusAgendamento, 'id'>) => void;
  atualizarStatus: (id: number, dados: Partial<StatusAgendamento>) => void;
  removerStatus: (id: number) => void;
  getStatusFixos: () => StatusAgendamento[];
  getStatusPersonalizados: () => StatusAgendamento[];
  getStatusConfirmacaoPorId: (id: number) => StatusConfirmacao | undefined;
  getStatusConfirmacaoAtivos: () => StatusConfirmacao[];
  getStatusConfirmacaoPendentes: () => StatusConfirmacao[];
  moverClienteParaStatusConfirmacao: (idCliente: number, idStatusConfirmacao: number, observacao?: string) => void;
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

// Status de confirmação via WhatsApp
const statusConfirmacaoIniciais: StatusConfirmacao[] = [
  {
    id: 1,
    nome: 'Contato necessário hoje',
    descricao: 'Cliente precisa ser contatado hoje para confirmação',
    cor: '#F97316', // Orange
    fixo: true,
    acaoRequerida: true
  },
  {
    id: 2,
    nome: 'Contato não realizado (atrasado)',
    descricao: 'Cliente não foi contatado na data prevista',
    cor: '#EF4444', // Red
    fixo: true,
    acaoRequerida: true
  },
  {
    id: 3,
    nome: 'Contatado, sem resposta',
    descricao: 'Cliente foi contatado, mas ainda não respondeu',
    cor: '#F59E0B', // Amber
    fixo: true,
    acaoRequerida: false
  },
  {
    id: 4,
    nome: 'Reenvio após 24h',
    descricao: 'Segundo contato necessário após 24h sem resposta',
    cor: '#F97316', // Orange
    fixo: true,
    acaoRequerida: true
  },
  {
    id: 5,
    nome: 'Sem resposta após 2º contato',
    descricao: 'Cliente não respondeu após segunda tentativa',
    cor: '#EF4444', // Red
    fixo: true,
    acaoRequerida: true
  },
  {
    id: 6,
    nome: 'Verificação presencial',
    descricao: 'Necessária verificação presencial no PDV',
    cor: '#8B5CF6', // Purple
    fixo: true,
    acaoRequerida: true
  },
  {
    id: 7,
    nome: 'Confirmado',
    descricao: 'Cliente confirmou a reposição',
    cor: '#10B981', // Green
    fixo: true,
    acaoRequerida: false
  }
];

export const useStatusAgendamentoStore = create<StatusAgendamentoStore>()(
  devtools(
    (set, get) => ({
      statusAgendamento: statusFixosIniciais,
      statusConfirmacao: statusConfirmacaoIniciais,
      
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
      },
      
      getStatusConfirmacaoPorId: (id) => {
        return get().statusConfirmacao.find(s => s.id === id);
      },
      
      getStatusConfirmacaoAtivos: () => {
        return get().statusConfirmacao.filter(s => s.acaoRequerida);
      },
      
      getStatusConfirmacaoPendentes: () => {
        return get().statusConfirmacao.filter(s => !s.acaoRequerida);
      },
      
      moverClienteParaStatusConfirmacao: (idCliente, idStatusConfirmacao, observacao) => {
        // Lógica para mover cliente entre status de confirmação seria implementada aqui
        // Depende da integração com o store de clientes
        // Por enquanto é apenas um placeholder
      }
    }),
    { name: 'status-agendamento-store' }
  )
);
