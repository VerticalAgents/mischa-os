import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Representante, 
  RotaEntrega, 
  CategoriaEstabelecimento, 
  TipoLogistica, 
  FormaPagamento,
  ConfiguracoesProducao 
} from '@/types';
import { 
  representantesMock, 
  rotasEntregaMock, 
  categoriasEstabelecimentoMock,
  tiposLogisticaMock,
  formasPagamentoMock,
  configuracoesProducaoMock
} from '@/data/configData';

interface ConfigStore {
  representantes: Representante[];
  rotasEntrega: RotaEntrega[];
  categoriasEstabelecimento: CategoriaEstabelecimento[];
  tiposLogistica: TipoLogistica[];
  formasPagamento: FormaPagamento[];
  configuracoesProducao: ConfiguracoesProducao;

  // Ações para Representantes
  adicionarRepresentante: (representante: Omit<Representante, 'id'>) => void;
  atualizarRepresentante: (id: number, dados: Partial<Representante>) => void;
  removerRepresentante: (id: number) => void;
  
  // Ações para Rotas
  adicionarRota: (rota: Omit<RotaEntrega, 'id'>) => void;
  atualizarRota: (id: number, dados: Partial<RotaEntrega>) => void;
  removerRota: (id: number) => void;

  // Ações para Categorias
  adicionarCategoria: (categoria: Omit<CategoriaEstabelecimento, 'id'>) => void;
  atualizarCategoria: (id: number, dados: Partial<CategoriaEstabelecimento>) => void;
  removerCategoria: (id: number) => void;
  
  // Ações para Tipos de Logística
  adicionarTipoLogistica: (tipoLogistica: Omit<TipoLogistica, 'id'>) => void;
  atualizarTipoLogistica: (id: number, dados: Partial<TipoLogistica>) => void;
  removerTipoLogistica: (id: number) => void;
  
  // Ações para Formas de Pagamento
  adicionarFormaPagamento: (formaPagamento: Omit<FormaPagamento, 'id'>) => void;
  atualizarFormaPagamento: (id: number, dados: Partial<FormaPagamento>) => void;
  removerFormaPagamento: (id: number) => void;
  
  // Ações para Configurações de Produção
  atualizarConfiguracoesProducao: (dados: Partial<ConfiguracoesProducao>) => void;

  // Getters
  getRepresentanteAtivo: () => Representante[];
  getRotaAtiva: () => RotaEntrega[];
  getCategoriaAtiva: () => CategoriaEstabelecimento[];
  getTipoLogisticaAtivo: () => TipoLogistica[];
  getFormaPagamentoAtiva: () => FormaPagamento[];
}

export const useConfigStore = create<ConfigStore>()(
  devtools(
    (set, get) => ({
      representantes: representantesMock,
      rotasEntrega: rotasEntregaMock,
      categoriasEstabelecimento: categoriasEstabelecimentoMock,
      tiposLogistica: tiposLogisticaMock,
      formasPagamento: formasPagamentoMock,
      configuracoesProducao: configuracoesProducaoMock,

      // Implementação para Representantes
      adicionarRepresentante: (representante) => {
        set((state) => {
          const novoId = Math.max(0, ...state.representantes.map(r => r.id)) + 1;
          return {
            representantes: [
              ...state.representantes,
              { ...representante, id: novoId }
            ]
          };
        });
      },

      atualizarRepresentante: (id, dados) => {
        set((state) => ({
          representantes: state.representantes.map(rep => 
            rep.id === id ? { ...rep, ...dados } : rep
          )
        }));
      },

      removerRepresentante: (id) => {
        set((state) => ({
          representantes: state.representantes.filter(rep => rep.id !== id)
        }));
      },

      // Implementação para Rotas
      adicionarRota: (rota) => {
        set((state) => {
          const novoId = Math.max(0, ...state.rotasEntrega.map(r => r.id)) + 1;
          return {
            rotasEntrega: [
              ...state.rotasEntrega,
              { ...rota, id: novoId }
            ]
          };
        });
      },

      atualizarRota: (id, dados) => {
        set((state) => ({
          rotasEntrega: state.rotasEntrega.map(rota => 
            rota.id === id ? { ...rota, ...dados } : rota
          )
        }));
      },

      removerRota: (id) => {
        set((state) => ({
          rotasEntrega: state.rotasEntrega.filter(rota => rota.id !== id)
        }));
      },

      // Implementação para Categorias
      adicionarCategoria: (categoria) => {
        set((state) => {
          const novoId = Math.max(0, ...state.categoriasEstabelecimento.map(c => c.id)) + 1;
          return {
            categoriasEstabelecimento: [
              ...state.categoriasEstabelecimento,
              { ...categoria, id: novoId }
            ]
          };
        });
      },

      atualizarCategoria: (id, dados) => {
        set((state) => ({
          categoriasEstabelecimento: state.categoriasEstabelecimento.map(cat => 
            cat.id === id ? { ...cat, ...dados } : cat
          )
        }));
      },

      removerCategoria: (id) => {
        set((state) => ({
          categoriasEstabelecimento: state.categoriasEstabelecimento.filter(cat => cat.id !== id)
        }));
      },

      // Implementação para Tipos de Logística
      adicionarTipoLogistica: (tipoLogistica) => {
        set((state) => {
          const novoId = Math.max(0, ...state.tiposLogistica.map(t => t.id)) + 1;
          return {
            tiposLogistica: [
              ...state.tiposLogistica,
              { ...tipoLogistica, id: novoId }
            ]
          };
        });
      },

      atualizarTipoLogistica: (id, dados) => {
        set((state) => ({
          tiposLogistica: state.tiposLogistica.map(tipo => 
            tipo.id === id ? { ...tipo, ...dados } : tipo
          )
        }));
      },

      removerTipoLogistica: (id) => {
        set((state) => ({
          tiposLogistica: state.tiposLogistica.filter(tipo => tipo.id !== id)
        }));
      },

      // Implementação para Formas de Pagamento
      adicionarFormaPagamento: (formaPagamento) => {
        set((state) => {
          const novoId = Math.max(0, ...state.formasPagamento.map(f => f.id)) + 1;
          return {
            formasPagamento: [
              ...state.formasPagamento,
              { ...formaPagamento, id: novoId }
            ]
          };
        });
      },

      atualizarFormaPagamento: (id, dados) => {
        set((state) => ({
          formasPagamento: state.formasPagamento.map(forma => 
            forma.id === id ? { ...forma, ...dados } : forma
          )
        }));
      },

      removerFormaPagamento: (id) => {
        set((state) => ({
          formasPagamento: state.formasPagamento.filter(forma => forma.id !== id)
        }));
      },

      // Implementação para Configurações de Produção
      atualizarConfiguracoesProducao: (dados) => {
        set((state) => ({
          configuracoesProducao: {
            ...state.configuracoesProducao,
            ...dados
          }
        }));
      },

      // Getters filtrados
      getRepresentanteAtivo: () => {
        return get().representantes.filter(r => r.ativo);
      },

      getRotaAtiva: () => {
        return get().rotasEntrega.filter(r => r.ativo);
      },

      getCategoriaAtiva: () => {
        return get().categoriasEstabelecimento.filter(c => c.ativo);
      },

      getTipoLogisticaAtivo: () => {
        return get().tiposLogistica.filter(t => t.ativo);
      },

      getFormaPagamentoAtiva: () => {
        return get().formasPagamento.filter(f => f.ativo);
      }
    }),
    { name: 'config-store' }
  )
);
