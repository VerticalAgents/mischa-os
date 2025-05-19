
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ConfirmacaoReposicao, StatusConfirmacaoReposicao, Cliente } from '@/types';
import { addDays, isAfter, isBefore, subDays } from 'date-fns';

interface ConfirmacaoReposicaoState {
  confirmacoes: ConfirmacaoReposicao[];
  
  // Ações
  adicionarConfirmacao: (idCliente: number, nomeCliente: string, dataPrevisaoReposicao: Date, telefoneContato?: string) => void;
  atualizarStatusConfirmacao: (id: number, novoStatus: StatusConfirmacaoReposicao, observacoes?: string) => void;
  registrarContato: (id: number, observacoes?: string) => void;
  registrarResposta: (id: number, observacoes?: string) => void;
  reagendarAutomatico: (id: number) => void;
  reagendarManual: (id: number, novaData: Date) => void;
  
  // Getters para as listas
  getContatoNecessarioHoje: () => ConfirmacaoReposicao[];
  getContatoNaoRealizadoAtrasado: () => ConfirmacaoReposicao[];
  getContatadoSemResposta: () => ConfirmacaoReposicao[];
  getReenvioApos24h: () => ConfirmacaoReposicao[];
  getSemRespostaApos2Contato: () => ConfirmacaoReposicao[];
  
  // Geração automática baseada em clientes
  gerarConfirmacoesPendentes: (clientes: Cliente[]) => void;
  
  // Stats para dashboard
  getConfirmacaoStats: () => {
    contatarHoje: number;
    contatoPendente: number;
    semResposta1: number;
    semResposta2: number;
  };
}

export const useConfirmacaoReposicaoStore = create<ConfirmacaoReposicaoState>()(
  immer((set, get) => ({
    confirmacoes: [],
    
    adicionarConfirmacao: (idCliente, nomeCliente, dataPrevisaoReposicao, telefoneContato) => set(state => {
      // Verificar se já existe confirmação para este cliente e data
      const confirmacaoExistente = state.confirmacoes.find(c => 
        c.idCliente === idCliente && 
        c.dataPrevisaoReposicao.toDateString() === dataPrevisaoReposicao.toDateString()
      );
      
      if (!confirmacaoExistente) {
        const novoId = state.confirmacoes.length > 0 
          ? Math.max(...state.confirmacoes.map(c => c.id)) + 1 
          : 1;
          
        state.confirmacoes.push({
          id: novoId,
          idCliente,
          nomeCliente,
          dataPrevisaoReposicao,
          statusConfirmacao: 'Pendente',
          telefoneContato
        });
      }
    }),
    
    atualizarStatusConfirmacao: (id, novoStatus, observacoes) => set(state => {
      const confirmacao = state.confirmacoes.find(c => c.id === id);
      if (confirmacao) {
        confirmacao.statusConfirmacao = novoStatus;
        if (observacoes) confirmacao.observacoes = observacoes;
      }
    }),
    
    registrarContato: (id, observacoes) => set(state => {
      const confirmacao = state.confirmacoes.find(c => c.id === id);
      if (confirmacao) {
        confirmacao.dataContato = new Date();
        confirmacao.statusConfirmacao = 'Contatado';
        if (observacoes) confirmacao.observacoes = observacoes;
      }
    }),
    
    registrarResposta: (id, observacoes) => set(state => {
      const confirmacao = state.confirmacoes.find(c => c.id === id);
      if (confirmacao) {
        confirmacao.dataResposta = new Date();
        confirmacao.statusConfirmacao = 'Respondido';
        if (observacoes) confirmacao.observacoes = observacoes;
      }
    }),
    
    reagendarAutomatico: (id) => set(state => {
      const confirmacao = state.confirmacoes.find(c => c.id === id);
      if (confirmacao) {
        // Adicionar 5 dias úteis (simulação simplificada)
        const novaData = addDays(new Date(), 7); // Aproximação 
        confirmacao.dataReagendamento = novaData;
        confirmacao.statusConfirmacao = 'Reagendado';
      }
    }),
    
    reagendarManual: (id, novaData) => set(state => {
      const confirmacao = state.confirmacoes.find(c => c.id === id);
      if (confirmacao) {
        confirmacao.dataReagendamento = novaData;
        confirmacao.statusConfirmacao = 'Reagendado';
      }
    }),
    
    getContatoNecessarioHoje: () => {
      const hoje = new Date();
      return get().confirmacoes.filter(c => 
        c.statusConfirmacao === 'Pendente' &&
        isAfter(c.dataPrevisaoReposicao, hoje) &&
        isBefore(c.dataPrevisaoReposicao, addDays(hoje, 2))
      );
    },
    
    getContatoNaoRealizadoAtrasado: () => {
      const hoje = new Date();
      return get().confirmacoes.filter(c => 
        c.statusConfirmacao === 'Pendente' &&
        isBefore(c.dataPrevisaoReposicao, hoje)
      );
    },
    
    getContatadoSemResposta: () => {
      const hoje = new Date();
      return get().confirmacoes.filter(c => 
        c.statusConfirmacao === 'Contatado' &&
        c.dataContato && 
        isBefore(c.dataContato, hoje) &&
        !c.dataResposta
      );
    },
    
    getReenvioApos24h: () => {
      const hoje = new Date();
      const ontem = subDays(hoje, 1);
      return get().confirmacoes.filter(c => 
        c.statusConfirmacao === 'Contatado' &&
        c.dataContato && 
        isBefore(c.dataContato, ontem) &&
        !c.dataResposta
      );
    },
    
    getSemRespostaApos2Contato: () => {
      return get().confirmacoes.filter(c => 
        c.statusConfirmacao === 'RecontatorNecessario' ||
        c.statusConfirmacao === 'SemResposta' ||
        c.statusConfirmacao === 'ConferenciaPresencial'
      );
    },
    
    gerarConfirmacoesPendentes: (clientes) => set(state => {
      const hoje = new Date();
      const doisDiasDepois = addDays(hoje, 2);
      
      clientes.forEach(cliente => {
        if (cliente.statusCliente === 'Ativo' && cliente.proximaDataReposicao) {
          const dataProximaReposicao = new Date(cliente.proximaDataReposicao);
          
          // Verificar se a data está dentro dos próximos 2 dias
          if (isAfter(dataProximaReposicao, hoje) && 
              isBefore(dataProximaReposicao, doisDiasDepois)) {
              
            // Verificar se já existe confirmação para este cliente e data
            const confirmacaoExistente = state.confirmacoes.find(c => 
              c.idCliente === cliente.id && 
              c.dataPrevisaoReposicao.toDateString() === dataProximaReposicao.toDateString() &&
              ['Pendente', 'Contatado', 'RecontatorNecessario'].includes(c.statusConfirmacao)
            );
            
            if (!confirmacaoExistente) {
              const novoId = state.confirmacoes.length > 0 
                ? Math.max(...state.confirmacoes.map(c => c.id)) + 1 
                : 1;
                
              state.confirmacoes.push({
                id: novoId,
                idCliente: cliente.id,
                nomeCliente: cliente.nome,
                dataPrevisaoReposicao: dataProximaReposicao,
                statusConfirmacao: 'Pendente',
                telefoneContato: cliente.contatoTelefone
              });
            }
          }
        }
      });
    }),
    
    getConfirmacaoStats: () => {
      const contatarHoje = get().getContatoNecessarioHoje().length;
      const contatoPendente = get().getContatoNaoRealizadoAtrasado().length;
      const semResposta1 = get().getContatadoSemResposta().length;
      const semResposta2 = get().getSemRespostaApos2Contato().length;
      
      return {
        contatarHoje,
        contatoPendente,
        semResposta1,
        semResposta2
      };
    }
  }))
);
