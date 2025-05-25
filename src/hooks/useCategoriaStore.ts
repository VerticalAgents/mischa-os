
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { ProdutoCategoria, ProdutoSubcategoria } from "@/types";
import { useProdutoStore } from "./useProdutoStore";

interface CategoriaStore {
  categorias: ProdutoCategoria[];
  
  // Actions for Categories
  adicionarCategoria: (nome: string, descricao?: string) => void;
  atualizarCategoria: (id: number, nome: string, descricao?: string) => void;
  removerCategoria: (id: number) => boolean;
  
  // Actions for Subcategories
  adicionarSubcategoria: (categoriaId: number, nome: string) => void;
  atualizarSubcategoria: (id: number, categoriaId: number, nome: string) => void;
  removerSubcategoria: (categoriaId: number, subcategoriaId: number) => boolean;
  
  // Getters
  getCategoriaById: (id: number) => ProdutoCategoria | undefined;
  getSubcategoriaById: (categoriaId: number, subcategoriaId: number) => ProdutoSubcategoria | undefined;
  getSubcategoriasByCategoriaId: (categoriaId: number) => ProdutoSubcategoria[];
  
  // Verification methods
  categoriaTemProdutos: (categoriaId: number) => boolean;
  subcategoriaTemProdutos: (subcategoriaId: number) => boolean;
}

export const useCategoriaStore = create<CategoriaStore>()(
  immer((set, get) => ({
    categorias: [
      {
        id: 1,
        nome: "Doces",
        descricao: "Produtos da linha de doces",
        subcategorias: [
          { id: 1, nome: "Brownie 38g", categoriaId: 1, quantidadeProdutos: 1 },
          { id: 2, nome: "Brownie 55g", categoriaId: 1, quantidadeProdutos: 0 }
        ],
        quantidadeProdutos: 1
      },
      {
        id: 2,
        nome: "Food Service",
        descricao: "Produtos para estabelecimentos",
        subcategorias: [
          { id: 3, nome: "Kits", categoriaId: 2, quantidadeProdutos: 0 }
        ],
        quantidadeProdutos: 0
      }
    ],
    
    adicionarCategoria: (nome, descricao) => set(state => {
      const id = state.categorias.length > 0 
        ? Math.max(...state.categorias.map(c => c.id)) + 1 
        : 1;
        
      state.categorias.push({
        id,
        nome,
        descricao,
        subcategorias: [],
        quantidadeProdutos: 0
      });
    }),
    
    atualizarCategoria: (id, nome, descricao) => set(state => {
      const index = state.categorias.findIndex(c => c.id === id);
      if (index !== -1) {
        state.categorias[index].nome = nome;
        if (descricao !== undefined) {
          state.categorias[index].descricao = descricao;
        }
      }
    }),
    
    removerCategoria: (id) => {
      const { categoriaTemProdutos } = get();
      if (categoriaTemProdutos(id)) {
        return false;
      }
      
      set(state => {
        state.categorias = state.categorias.filter(c => c.id !== id);
      });
      
      return true;
    },
    
    adicionarSubcategoria: (categoriaId, nome) => set(state => {
      const categoriaIndex = state.categorias.findIndex(c => c.id === categoriaId);
      if (categoriaIndex !== -1) {
        const subcategorias = state.categorias[categoriaIndex].subcategorias;
        const id = subcategorias.length > 0 
          ? Math.max(...subcategorias.map(s => s.id)) + 1 
          : 1;
          
        state.categorias[categoriaIndex].subcategorias.push({
          id,
          nome,
          categoriaId,
          quantidadeProdutos: 0
        });
      }
    }),
    
    atualizarSubcategoria: (id, categoriaId, nome) => set(state => {
      const categoriaIndex = state.categorias.findIndex(c => c.id === categoriaId);
      if (categoriaIndex !== -1) {
        const subcategoriaIndex = state.categorias[categoriaIndex].subcategorias.findIndex(s => s.id === id);
        if (subcategoriaIndex !== -1) {
          state.categorias[categoriaIndex].subcategorias[subcategoriaIndex].nome = nome;
        }
      }
    }),
    
    removerSubcategoria: (categoriaId, subcategoriaId) => {
      const { subcategoriaTemProdutos } = get();
      if (subcategoriaTemProdutos(subcategoriaId)) {
        return false;
      }
      
      set(state => {
        const categoriaIndex = state.categorias.findIndex(c => c.id === categoriaId);
        if (categoriaIndex !== -1) {
          state.categorias[categoriaIndex].subcategorias = state.categorias[categoriaIndex].subcategorias.filter(
            s => s.id !== subcategoriaId
          );
        }
      });
      
      return true;
    },
    
    getCategoriaById: (id) => {
      return get().categorias.find(c => c.id === id);
    },
    
    getSubcategoriaById: (categoriaId, subcategoriaId) => {
      const categoria = get().categorias.find(c => c.id === categoriaId);
      if (categoria) {
        return categoria.subcategorias.find(s => s.id === subcategoriaId);
      }
      return undefined;
    },
    
    getSubcategoriasByCategoriaId: (categoriaId) => {
      const categoria = get().categorias.find(c => c.id === categoriaId);
      return categoria ? categoria.subcategorias : [];
    },
    
    categoriaTemProdutos: (categoriaId) => {
      const produtos = useProdutoStore.getState().produtos;
      return produtos.some(p => p.categoriaId === categoriaId);
    },
    
    subcategoriaTemProdutos: (subcategoriaId) => {
      const produtos = useProdutoStore.getState().produtos;
      return produtos.some(p => p.subcategoriaId === subcategoriaId);
    }
  }))
);
