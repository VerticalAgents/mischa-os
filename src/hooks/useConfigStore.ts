
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Representante, RotaEntrega, CategoriaEstabelecimento } from '@/types';
import { representantesMock, rotasEntregaMock, categoriasEstabelecimentoMock } from '@/data/configData';

interface ConfigStore {
  representantes: Representante[];
  rotasEntrega: RotaEntrega[];
  categoriasEstabelecimento: CategoriaEstabelecimento[];

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

  // Getters
  getRepresentanteAtivo: () => Representante[];
  getRotaAtiva: () => RotaEntrega[];
  getCategoriaAtiva: () => CategoriaEstabelecimento[];
}

export const useConfigStore = create<ConfigStore>()(
  devtools(
    (set, get) => ({
      representantes: representantesMock,
      rotasEntrega: rotasEntregaMock,
      categoriasEstabelecimento: categoriasEstabelecimentoMock,

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

      // Getters filtrados
      getRepresentanteAtivo: () => {
        return get().representantes.filter(r => r.ativo);
      },

      getRotaAtiva: () => {
        return get().rotasEntrega.filter(r => r.ativo);
      },

      getCategoriaAtiva: () => {
        return get().categoriasEstabelecimento.filter(c => c.ativo);
      }
    }),
    { name: 'config-store' }
  )
);
