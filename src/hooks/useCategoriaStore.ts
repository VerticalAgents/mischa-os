
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

interface CategoriaStore {
  categorias: Categoria[];
  
  // Getters
  getCategoriasAtivas: () => Categoria[];
  getCategoriaPorId: (id: number) => Categoria | undefined;
}

export const useCategoriaStore = create<CategoriaStore>()(
  devtools(
    (set, get) => ({
      categorias: [
        { id: 1, nome: "Revenda Padrão", descricao: "Produtos para revenda tradicional", ativo: true },
        { id: 2, nome: "Food Service", descricao: "Produtos para estabelecimentos alimentícios", ativo: true },
        { id: 3, nome: "Especiais", descricao: "Produtos especiais e sazonais", ativo: true }
      ],
      
      getCategoriasAtivas: () => {
        return get().categorias.filter(c => c.ativo);
      },
      
      getCategoriaPorId: (id) => {
        return get().categorias.find(c => c.id === id);
      }
    }),
    { name: 'categoria-store' }
  )
);
