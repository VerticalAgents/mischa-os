
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlanejamentoProducaoState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  semanaAtual: Date;
  setSemanaAtual: (data: Date) => void;
}

export const usePlanejamentoProducaoStore = create<PlanejamentoProducaoState>()(
  persist(
    (set) => ({
      activeTab: "projecao-producao",
      setActiveTab: (tab) => set({ activeTab: tab }),
      semanaAtual: new Date(),
      setSemanaAtual: (data) => set({ semanaAtual: data }),
    }),
    {
      name: 'planejamento-producao-state',
      version: 1,
    }
  )
);
