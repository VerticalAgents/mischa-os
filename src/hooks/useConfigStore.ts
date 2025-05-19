import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Representante, 
  RotaEntrega, 
  CategoriaEstabelecimento, 
  TipoLogistica, 
  FormaPagamento,
  ConfiguracoesProducao,
  CategoriaInsumoParam
} from '@/types';
import { 
  representantesMock, 
  rotasEntregaMock, 
  categoriasEstabelecimentoMock,
  tiposLogisticaMock,
  formasPagamentoMock,
  configuracoesProducaoMock,
  categoriasInsumoMock
} from '@/data/configData';

interface ConfigStore {
  representantes: Representante[];
  rotasEntrega: RotaEntrega[];
  categoriasEstabelecimento: CategoriaEstabelecimento[];
  tiposLogistica: TipoLogistica[];
  formasPagamento: FormaPagamento[];
  configuracoesProducao: ConfiguracoesProducao;
  categoriasInsumo: CategoriaInsumoParam[];

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

  // Ações para Categorias de Insumo
  adicionarCategoriaInsumo: (categoria: Omit<CategoriaInsumoParam, 'id'>) => void;
  atualizarCategoriaInsumo: (id: number, dados: Partial<CategoriaInsumoParam>) => void;
  removerCategoriaInsumo: (id: number) => void;

  // Getters
  getRepresentanteAtivo: () => Representante[];
  getRotaAtiva: () => RotaEntrega[];
  getCategoriaAtiva: () => CategoriaEstabelecimento[];
  getTipoLogisticaAtivo: () => TipoLogistica[];
  getFormaPagamentoAtiva: () => FormaPagamento[];
  getCategoriaInsumoAtiva: () => CategoriaInsumoParam[];
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
      categoriasInsumo: categoriasInsumoMock,

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

      // Implementação para Categorias de Insumo
      adicionarCategoriaInsumo: (categoria) => {
        set((state) => {
          const novoId = Math.max(0, ...state.categoriasInsumo.map(c => c.id)) + 1;
          return {
            categoriasInsumo: [
              ...state.categoriasInsumo,
              { ...categoria, id: novoId, quantidadeItensVinculados: 0 }
            ]
          };
        });
      },

      atualizarCategoriaInsumo: (id, dados) => {
        set((state) => ({
          categoriasInsumo: state.categoriasInsumo.map(cat => 
            cat.id === id ? { ...cat, ...dados } : cat
          )
        }));
      },

      removerCategoriaInsumo: (id) => {
        // Verificar se existem itens vinculados antes de remover
        const categoria = get().categoriasInsumo.find(c => c.id === id);
        if (categoria && categoria.quantidadeItensVinculados && categoria.quantidadeItensVinculados > 0) {
          console.error('Não é possível remover uma categoria com itens vinculados');
          return;
        }
        
        set((state) => ({
          categoriasInsumo: state.categoriasInsumo.filter(cat => cat.id !== id)
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
      },
      
      // Getter para Categorias de Insumo ativas
      getCategoriaInsumoAtiva: () => {
        return get().categoriasInsumo.filter(c => c.ativo);
      }
    }),
    { name: 'config-store' }
  )
);
