
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ConfiguracoesProducao {
  unidadesPorForma: number;
  formasPorLote: number;
  incluirPedidosPrevistos: boolean;
  percentualPedidosPrevistos: number;
  tempoMedioPorFornada: number;
  unidadesBrowniePorForma: number;
  formasPorFornada: number;
}

interface ConfigStore {
  // Getters para dados ativos
  getRepresentanteAtivo: () => any[];
  getRotaAtiva: () => any[];
  getCategoriaAtiva: () => any[];
  getTipoLogisticaAtivo: () => any[];
  getFormaPagamentoAtiva: () => any[];
  getTipoCobrancaAtivo: () => any[];
  
  // Configurações de produção
  configuracoesProducao: ConfiguracoesProducao;
  atualizarConfiguracoesProducao: (config: ConfiguracoesProducao) => void;
  
  // Dados mock para compatibilidade (deprecated - usar hooks Supabase)
  representantes: any[];
  rotasEntrega: any[];
  categoriasEstabelecimento: any[];
}

export const useConfigStore = create<ConfigStore>()(
  devtools(
    (set, get) => ({
      // Configurações de produção
      configuracoesProducao: {
        unidadesPorForma: 24,
        formasPorLote: 4,
        incluirPedidosPrevistos: true,
        percentualPedidosPrevistos: 15,
        tempoMedioPorFornada: 45,
        unidadesBrowniePorForma: 16,
        formasPorFornada: 2,
      },
      
      atualizarConfiguracoesProducao: (config: ConfiguracoesProducao) => {
        set({ configuracoesProducao: config });
      },
      
      // Dados mock para compatibilidade (deprecated)
      representantes: [
        { id: 1, nome: 'João Silva' },
        { id: 2, nome: 'Maria Santos' },
        { id: 3, nome: 'Pedro Costa' },
      ],
      
      rotasEntrega: [
        { id: 1, nome: 'Zona Norte' },
        { id: 2, nome: 'Zona Sul' },
        { id: 3, nome: 'Centro' },
        { id: 4, nome: 'Grande ABC' },
      ],
      
      categoriasEstabelecimento: [
        { id: 1, nome: 'Padaria' },
        { id: 2, nome: 'Lanchonete' },
        { id: 3, nome: 'Restaurante' },
        { id: 4, nome: 'Mercado' },
        { id: 5, nome: 'Revenda' },
      ],
      
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
