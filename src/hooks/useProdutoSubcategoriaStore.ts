
import { create } from 'zustand';
import { ProdutoSubcategoria } from '@/types';
import { useProdutoCategoriaStore } from './useProdutoCategoriaStore';

interface ProdutoSubcategoriaStore {
  subcategorias: ProdutoSubcategoria[];
  adicionarSubcategoria: (subcategoria: Omit<ProdutoSubcategoria, 'id'>) => void;
  atualizarSubcategoria: (id: number, subcategoriaDados: Partial<ProdutoSubcategoria>) => void;
  removerSubcategoria: (id: number) => void;
}

// Initial data is imported from the categoria store
export const useProdutoSubcategoriaStore = create<ProdutoSubcategoriaStore>((set, get) => {
  // Extract subcategorias from the categoria store
  const subcategoriasIniciais: ProdutoSubcategoria[] = [];
  useProdutoCategoriaStore.getState().categorias.forEach(categoria => {
    if (categoria.subcategorias) {
      subcategoriasIniciais.push(...categoria.subcategorias);
    }
  });

  return {
    subcategorias: subcategoriasIniciais,

    adicionarSubcategoria: (subcategoria) => set((state) => {
      const novoId = state.subcategorias.length > 0 
        ? Math.max(...state.subcategorias.map(s => s.id)) + 1 
        : 1;
        
      return {
        subcategorias: [
          ...state.subcategorias,
          { ...subcategoria, id: novoId }
        ]
      };
    }),

    atualizarSubcategoria: (id, subcategoriaDados) => set((state) => ({
      subcategorias: state.subcategorias.map((subcategoria) => 
        subcategoria.id === id 
          ? { ...subcategoria, ...subcategoriaDados } 
          : subcategoria
      )
    })),

    removerSubcategoria: (id) => set((state) => ({
      subcategorias: state.subcategorias.filter((subcategoria) => subcategoria.id !== id)
    }))
  };
});
