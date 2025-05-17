
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { PlanejamentoProducao } from "../types";

// Interface for expanded PlanejamentoProducaoStore state
interface PlanejamentoProducaoState {
  planejamentos: PlanejamentoProducao[];
  adicionarPlanejamento: (planejamento: Omit<PlanejamentoProducao, "id">) => void;
  atualizarPlanejamento: (id: number, status: 'Pendente' | 'Em Produção' | 'Concluído' | 'Cancelado', quantidades?: Record<number, number>) => void;
  removerPlanejamento: (id: number) => void;
  calcularNecessidadeFormas: (totalUnidades: number) => number;
  calcularTempoProducao: (totalUnidades: number) => { horas: number; minutos: number };
}

// Create the store
export const usePlanejamentoProducaoStore = create<PlanejamentoProducaoState>()(
  immer((set) => ({
    planejamentos: [
      {
        id: 1,
        dataPlanejamento: new Date(),
        dataProducao: new Date(new Date().setDate(new Date().getDate() + 1)),
        status: 'Pendente',
        itensPlanejamento: [
          { idSabor: 1, nomeSabor: 'Tradicional', quantidadePlanejada: 100 },
          { idSabor: 2, nomeSabor: 'Choco Duo', quantidadePlanejada: 150 },
          { idSabor: 5, nomeSabor: 'Avelã', quantidadePlanejada: 80 }
        ],
        observacoes: 'Planejamento para o fim de semana',
        totalUnidades: 330,
        // Additional properties
        totalUnidadesAgendadas: 330,
        formasNecessarias: 11
      }
    ],
    
    adicionarPlanejamento: (planejamento) => set(state => {
      const novoId = state.planejamentos.length > 0 
        ? Math.max(...state.planejamentos.map(p => p.id)) + 1 
        : 1;
      
      const totalUnidades = planejamento.itensPlanejamento.reduce(
        (total, item) => total + item.quantidadePlanejada, 0);
      
      const formasNecessarias = state.calcularNecessidadeFormas(totalUnidades);
      
      state.planejamentos.push({
        ...planejamento,
        id: novoId,
        totalUnidades,
        totalUnidadesAgendadas: totalUnidades,
        formasNecessarias
      });
    }),
    
    atualizarPlanejamento: (id, status, quantidades) => set(state => {
      const index = state.planejamentos.findIndex(p => p.id === id);
      if (index !== -1) {
        state.planejamentos[index].status = status;
        
        // Se temos quantidades produzidas, atualizamos os itens do planejamento
        if (quantidades) {
          state.planejamentos[index].itensPlanejamento.forEach(item => {
            if (quantidades[item.idSabor] !== undefined) {
              item.quantidadeProduzida = quantidades[item.idSabor];
            }
          });
        }
      }
    }),
    
    removerPlanejamento: (id) => set(state => {
      state.planejamentos = state.planejamentos.filter(p => p.id !== id);
    }),
    
    calcularNecessidadeFormas: (totalUnidades) => {
      // Cada forma comporta 30 unidades
      const CAPACIDADE_FORMA = 30;
      return Math.ceil(totalUnidades / CAPACIDADE_FORMA);
    },
    
    calcularTempoProducao: (totalUnidades) => {
      // Estimativa: 1 minuto por unidade + 30 minutos de setup
      const minutosTotais = totalUnidades + 30;
      const horas = Math.floor(minutosTotais / 60);
      const minutos = minutosTotais % 60;
      return { horas, minutos };
    }
  }))
);
