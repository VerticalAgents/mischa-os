import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GestaoFinanceiraOldUiState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useGestaoFinanceiraOldUiStore = create<GestaoFinanceiraOldUiState>()(
  persist(
    (set) => ({
      activeTab: "resumo",
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'gestao-financeira-old-ui-state',
      version: 1,
    }
  )
);
