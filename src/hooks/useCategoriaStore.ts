
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ProdutoCategoria, ProdutoSubcategoria } from '@/types';

interface CategoriaStore {
  categorias: ProdutoCategoria[];
  
  // Getters
  getCategoriasAtivas: () => ProdutoCategoria[];
  getCategoriaPorId: (id: number) => ProdutoCategoria | undefined;
  getSubcategoriasByCategoriaId: (categoriaId: number) => ProdutoSubcategoria[];
  
  // Actions for categorias
  adicionarCategoria: (nome: string, descricao?: string) => void;
  atualizarCategoria: (id: number, nome: string, descricao?: string) => void;
  removerCategoria: (id: number) => boolean;
  
  // Actions for subcategorias
  adicionarSubcategoria: (categoriaId: number, nome: string) => void;
  atualizarSubcategoria: (id: number, categoriaId: number, nome: string) => void;
  removerSubcategoria: (categoriaId: number, subcategoriaId: number) => boolean;
  
  // Helper methods
  categoriaTemProdutos: (categoriaId: number) => boolean;
  subcategoriaTemProdutos: (subcategoriaId: number) => boolean;
}

export const useCategoriaStore = create<CategoriaStore>()(
  devtools(
    (set, get) => ({
      categorias: [
        { 
          id: 1, 
          nome: "Revenda Padrão", 
          descricao: "Produtos para revenda tradicional", 
          subcategorias: [
            { id: 1, nome: "Brownies", categoriaId: 1, quantidadeProdutos: 0 },
            { id: 2, nome: "Cookies", categoriaId: 1, quantidadeProdutos: 0 }
          ],
          quantidadeProdutos: 0
        },
        { 
          id: 2, 
          nome: "Food Service", 
          descricao: "Produtos para estabelecimentos alimentícios", 
          subcategorias: [
            { id: 3, nome: "Kits", categoriaId: 2, quantidadeProdutos: 0 },
            { id: 4, nome: "Individuais", categoriaId: 2, quantidadeProdutos: 0 }
          ],
          quantidadeProdutos: 0
        },
        { 
          id: 3, 
          nome: "Especiais", 
          descricao: "Produtos especiais e sazonais", 
          subcategorias: [
            { id: 5, nome: "Sazonais", categoriaId: 3, quantidadeProdutos: 0 }
          ],
          quantidadeProdutos: 0
        }
      ],
      
      getCategoriasAtivas: () => {
        return get().categorias;
      },
      
      getCategoriaPorId: (id) => {
        return get().categorias.find(c => c.id === id);
      },
      
      getSubcategoriasByCategoriaId: (categoriaId) => {
        const categoria = get().categorias.find(c => c.id === categoriaId);
        return categoria?.subcategorias || [];
      },
      
      adicionarCategoria: (nome, descricao) => {
        set((state) => {
          const novoId = Math.max(0, ...state.categorias.map(c => c.id)) + 1;
          const novaCategoria: ProdutoCategoria = {
            id: novoId,
            nome,
            descricao,
            subcategorias: [],
            quantidadeProdutos: 0
          };
          return {
            categorias: [...state.categorias, novaCategoria]
          };
        });
      },
      
      atualizarCategoria: (id, nome, descricao) => {
        set((state) => ({
          categorias: state.categorias.map(cat => 
            cat.id === id ? { ...cat, nome, descricao } : cat
          )
        }));
      },
      
      removerCategoria: (id) => {
        const categoria = get().categorias.find(c => c.id === id);
        if (!categoria) return false;
        
        set((state) => ({
          categorias: state.categorias.filter(cat => cat.id !== id)
        }));
        return true;
      },
      
      adicionarSubcategoria: (categoriaId, nome) => {
        set((state) => {
          const allSubcategorias = state.categorias.flatMap(c => c.subcategorias);
          const novoId = Math.max(0, ...allSubcategorias.map(s => s.id)) + 1;
          
          return {
            categorias: state.categorias.map(cat => 
              cat.id === categoriaId 
                ? {
                    ...cat,
                    subcategorias: [
                      ...cat.subcategorias,
                      { id: novoId, nome, categoriaId, quantidadeProdutos: 0 }
                    ]
                  }
                : cat
            )
          };
        });
      },
      
      atualizarSubcategoria: (id, categoriaId, nome) => {
        set((state) => ({
          categorias: state.categorias.map(cat => 
            cat.id === categoriaId
              ? {
                  ...cat,
                  subcategorias: cat.subcategorias.map(sub =>
                    sub.id === id ? { ...sub, nome } : sub
                  )
                }
              : cat
          )
        }));
      },
      
      removerSubcategoria: (categoriaId, subcategoriaId) => {
        set((state) => ({
          categorias: state.categorias.map(cat => 
            cat.id === categoriaId
              ? {
                  ...cat,
                  subcategorias: cat.subcategorias.filter(sub => sub.id !== subcategoriaId)
                }
              : cat
          )
        }));
        return true;
      },
      
      categoriaTemProdutos: (categoriaId) => {
        const categoria = get().categorias.find(c => c.id === categoriaId);
        return (categoria?.quantidadeProdutos || 0) > 0;
      },
      
      subcategoriaTemProdutos: (subcategoriaId) => {
        const allSubcategorias = get().categorias.flatMap(c => c.subcategorias);
        const subcategoria = allSubcategorias.find(s => s.id === subcategoriaId);
        return (subcategoria?.quantidadeProdutos || 0) > 0;
      }
    }),
    { name: 'categoria-store' }
  )
);
