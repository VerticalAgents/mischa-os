
import { create } from 'zustand';
import { ProdutoCategoria } from '@/types';

interface ProdutoCategoriaStore {
  categorias: ProdutoCategoria[];
  adicionarCategoria: (categoria: Omit<ProdutoCategoria, 'id'>) => void;
  atualizarCategoria: (id: number, categoriaDados: Partial<ProdutoCategoria>) => void;
  removerCategoria: (id: number) => void;
}

// Mock data inicial
const categoriasIniciais: ProdutoCategoria[] = [
  {
    id: 1,
    nome: "Bolos",
    descricao: "Todos os tipos de bolos",
    ativo: true,
    subcategorias: [
      { id: 1, categoriaId: 1, nome: "Bolos de Chocolate", ativo: true },
      { id: 2, categoriaId: 1, nome: "Bolos de Frutas", ativo: true }
    ]
  },
  {
    id: 2,
    nome: "Brownies",
    descricao: "Brownies e sobremesas de chocolate",
    ativo: true,
    subcategorias: [
      { id: 3, categoriaId: 2, nome: "Brownies Tradicionais", ativo: true },
      { id: 4, categoriaId: 2, nome: "Brownies Gourmet", ativo: true }
    ]
  },
  {
    id: 3,
    nome: "Tortas",
    descricao: "Tortas doces e salgadas",
    ativo: true,
    subcategorias: []
  }
];

export const useProdutoCategoriaStore = create<ProdutoCategoriaStore>((set) => ({
  categorias: categoriasIniciais,

  adicionarCategoria: (categoria) => set((state) => {
    const novoId = state.categorias.length > 0 
      ? Math.max(...state.categorias.map(c => c.id)) + 1 
      : 1;
      
    return {
      categorias: [
        ...state.categorias,
        { ...categoria, id: novoId }
      ]
    };
  }),

  atualizarCategoria: (id, categoriaDados) => set((state) => ({
    categorias: state.categorias.map((categoria) => 
      categoria.id === id 
        ? { ...categoria, ...categoriaDados } 
        : categoria
    )
  })),

  removerCategoria: (id) => set((state) => ({
    categorias: state.categorias.filter((categoria) => categoria.id !== id)
  }))
}));
