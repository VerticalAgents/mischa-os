import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GestaoFinanceiraUiState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useGestaoFinanceiraUiStore = create<GestaoFinanceiraUiState>()(
  persist(
    (set) => ({
      activeTab: "resumo",
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'gestao-financeira-ui-state',
      version: 1,
    }
  )
);
