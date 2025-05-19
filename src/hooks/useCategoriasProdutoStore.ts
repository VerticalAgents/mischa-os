
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ProdutoCategoria, ProdutoSubcategoria } from '@/types';

interface CategoriasProdutoState {
  categorias: ProdutoCategoria[];
  
  // Ações para categorias
  adicionarCategoria: (nome: string, descricao?: string) => void;
  atualizarCategoria: (id: number, nome: string, descricao?: string) => void;
  removerCategoria: (id: number) => boolean; // retorna true se removido com sucesso
  
  // Ações para subcategorias
  adicionarSubcategoria: (idCategoria: number, nome: string, descricao?: string) => void;
  atualizarSubcategoria: (id: number, idCategoria: number, nome: string, descricao?: string) => void;
  removerSubcategoria: (idCategoria: number, id: number) => boolean; // retorna true se removido com sucesso
  
  // Verificações
  existemProdutosVinculadosCategoria: (id: number) => boolean;
  existemProdutosVinculadosSubcategoria: (idCategoria: number, id: number) => boolean;
}

export const useCategoriasProdutoStore = create<CategoriasProdutoState>()(
  immer((set, get) => ({
    categorias: [
      {
        id: 1,
        nome: 'Doces',
        descricao: 'Produtos de confeitaria e doces',
        ativo: true,
        subcategorias: [
          { 
            id: 1, 
            nome: 'Brownies', 
            descricao: 'Brownies em diversas versões', 
            ativo: true, 
            idCategoria: 1 
          },
          { 
            id: 2, 
            nome: 'Cookies', 
            descricao: 'Cookies tradicionais e especiais', 
            ativo: true, 
            idCategoria: 1 
          }
        ]
      },
      {
        id: 2,
        nome: 'Kits',
        descricao: 'Pacotes e kits especiais',
        ativo: true,
        subcategorias: [
          { 
            id: 3, 
            nome: 'Kit Presente', 
            descricao: 'Kits para presente', 
            ativo: true, 
            idCategoria: 2 
          }
        ]
      }
    ],
    
    adicionarCategoria: (nome, descricao) => set(state => {
      const novoId = state.categorias.length > 0 
        ? Math.max(...state.categorias.map(c => c.id)) + 1 
        : 1;
        
      state.categorias.push({
        id: novoId,
        nome,
        descricao,
        ativo: true,
        subcategorias: []
      });
    }),
    
    atualizarCategoria: (id, nome, descricao) => set(state => {
      const categoria = state.categorias.find(c => c.id === id);
      if (categoria) {
        categoria.nome = nome;
        categoria.descricao = descricao;
      }
    }),
    
    removerCategoria: (id) => {
      const temProdutosVinculados = get().existemProdutosVinculadosCategoria(id);
      if (temProdutosVinculados) {
        return false;
      }
      
      set(state => {
        state.categorias = state.categorias.filter(c => c.id !== id);
      });
      return true;
    },
    
    adicionarSubcategoria: (idCategoria, nome, descricao) => set(state => {
      const categoria = state.categorias.find(c => c.id === idCategoria);
      if (categoria) {
        const novoId = categoria.subcategorias.length > 0 
          ? Math.max(...categoria.subcategorias.map(s => s.id)) + 1 
          : 1;
          
        categoria.subcategorias.push({
          id: novoId,
          nome,
          descricao,
          ativo: true,
          idCategoria
        });
      }
    }),
    
    atualizarSubcategoria: (id, idCategoria, nome, descricao) => set(state => {
      const categoria = state.categorias.find(c => c.id === idCategoria);
      if (categoria) {
        const subcategoria = categoria.subcategorias.find(s => s.id === id);
        if (subcategoria) {
          subcategoria.nome = nome;
          subcategoria.descricao = descricao;
        }
      }
    }),
    
    removerSubcategoria: (idCategoria, id) => {
      const temProdutosVinculados = get().existemProdutosVinculadosSubcategoria(idCategoria, id);
      if (temProdutosVinculados) {
        return false;
      }
      
      set(state => {
        const categoria = state.categorias.find(c => c.id === idCategoria);
        if (categoria) {
          categoria.subcategorias = categoria.subcategorias.filter(s => s.id !== id);
        }
      });
      return true;
    },
    
    // Estas funções simulam a verificação com o useProdutoStore
    // Em uma implementação real, você integraria com o useProdutoStore
    existemProdutosVinculadosCategoria: (id) => {
      // Simulação: verificar se existem produtos com esta categoria
      const { produtos } = require('./useProdutoStore').useProdutoStore.getState();
      return produtos.some((p: any) => p.idCategoria === id);
    },
    
    existemProdutosVinculadosSubcategoria: (idCategoria, id) => {
      // Simulação: verificar se existem produtos com esta subcategoria
      const { produtos } = require('./useProdutoStore').useProdutoStore.getState();
      return produtos.some((p: any) => p.idCategoria === idCategoria && p.idSubcategoria === id);
    }
  }))
);
