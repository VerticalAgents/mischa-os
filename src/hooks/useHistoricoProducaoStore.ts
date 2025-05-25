
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { HistoricoProducao } from "@/types";

interface HistoricoProducaoStore {
  historico: HistoricoProducao[];
  
  // Actions
  adicionarRegistroHistorico: (registro: Omit<HistoricoProducao, 'id'>) => void;
  editarRegistroHistorico: (id: number, dadosAtualizados: Partial<HistoricoProducao>) => void;
  obterHistoricoPorPeriodo: (dataInicio: Date, dataFim: Date) => HistoricoProducao[];
  obterHistoricoPorProduto: (produtoNome: string) => HistoricoProducao[];
}

export const useHistoricoProducaoStore = create<HistoricoProducaoStore>()(
  immer((set, get) => ({
    historico: [
      {
        id: 1,
        dataProducao: new Date(2023, 4, 15),
        produtoId: 1,
        produtoNome: 'Tradicional',
        formasProducidas: 10,
        unidadesCalculadas: 300,
        turno: 'Matutino',
        observacoes: 'Produção regular',
        origem: 'Manual'
      },
      {
        id: 2,
        dataProducao: new Date(2023, 4, 16),
        produtoId: 2,
        produtoNome: 'Choco Duo',
        formasProducidas: 8,
        unidadesCalculadas: 240,
        turno: 'Vespertino',
        observacoes: 'Produção especial para evento',
        origem: 'Manual'
      }
    ],
    
    adicionarRegistroHistorico: (registro) => set(state => {
      const novoId = state.historico.length > 0 
        ? Math.max(...state.historico.map(h => h.id)) + 1 
        : 1;
        
      state.historico.push({
        ...registro,
        id: novoId
      });
    }),
    
    editarRegistroHistorico: (id, dadosAtualizados) => set(state => {
      const index = state.historico.findIndex(h => h.id === id);
      if (index !== -1) {
        Object.assign(state.historico[index], dadosAtualizados);
      }
    }),
    
    obterHistoricoPorPeriodo: (dataInicio, dataFim) => {
      return get().historico.filter(h => 
        h.dataProducao >= dataInicio && h.dataProducao <= dataFim
      );
    },
    
    obterHistoricoPorProduto: (produtoNome) => {
      return get().historico.filter(h => 
        h.produtoNome.toLowerCase().includes(produtoNome.toLowerCase())
      );
    }
  }))
);
