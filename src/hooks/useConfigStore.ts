
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ConfigStore {
  // Getters para dados ativos
  getRepresentanteAtivo: () => any[];
  getRotaAtiva: () => any[];
  getCategoriaAtiva: () => any[];
  getTipoLogisticaAtivo: () => any[];
  getFormaPagamentoAtiva: () => any[];
  getTipoCobrancaAtivo: () => any[];
}

export const useConfigStore = create<ConfigStore>()(
  devtools(
    (set, get) => ({
      getRepresentanteAtivo: () => {
        // Por enquanto retorna dados mock, mas será conectado aos hooks Supabase
        return [
          { id: 1, nome: 'João Silva' },
          { id: 2, nome: 'Maria Santos' },
          { id: 3, nome: 'Pedro Costa' },
        ];
      },
      
      getRotaAtiva: () => {
        return [
          { id: 1, nome: 'Zona Norte' },
          { id: 2, nome: 'Zona Sul' },
          { id: 3, nome: 'Centro' },
          { id: 4, nome: 'Grande ABC' },
        ];
      },
      
      getCategoriaAtiva: () => {
        return [
          { id: 1, nome: 'Padaria' },
          { id: 2, nome: 'Lanchonete' },
          { id: 3, nome: 'Restaurante' },
          { id: 4, nome: 'Mercado' },
          { id: 5, nome: 'Revenda' },
        ];
      },
      
      getTipoLogisticaAtivo: () => {
        return [
          { id: 1, nome: 'Própria' },
          { id: 2, nome: 'Terceirizada' },
          { id: 3, nome: 'Mista' },
          { id: 4, nome: 'Cliente retira' },
        ];
      },
      
      getFormaPagamentoAtiva: () => {
        return [
          { id: 1, nome: 'À vista' },
          { id: 2, nome: 'Boleto' },
          { id: 3, nome: 'Cartão de crédito' },
          { id: 4, nome: 'Cartão de débito' },
          { id: 5, nome: 'PIX' },
          { id: 6, nome: 'Transferência bancária' },
        ];
      },
      
      getTipoCobrancaAtivo: () => {
        return [
          { id: 1, nome: 'À vista' },
          { id: 2, nome: 'Consignado' },
        ];
      },
    }),
    { name: 'config-store' }
  )
);
