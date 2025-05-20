
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { Insumo, CategoriaInsumo, UnidadeMedida } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Custom category type
interface CategoriaPersonalizada {
  id: string;
  nome: string;
}

// Mock data for insumos
const insumosMock: Insumo[] = [
  {
    id: 1,
    nome: "Chocolate Meio Amargo",
    categoria: "Matéria Prima",
    volumeBruto: 1000,
    unidadeMedida: "g",
    custoMedio: 30.00,
    custoUnitario: 0.03 // 30.00 / 1000
  },
  {
    id: 2,
    nome: "Manteiga",
    categoria: "Matéria Prima",
    volumeBruto: 200,
    unidadeMedida: "g",
    custoMedio: 8.50,
    custoUnitario: 0.0425 // 8.50 / 200
  },
  {
    id: 3,
    nome: "Açúcar",
    categoria: "Matéria Prima",
    volumeBruto: 1000,
    unidadeMedida: "g",
    custoMedio: 6.00,
    custoUnitario: 0.006 // 6.00 / 1000
  },
  {
    id: 4,
    nome: "Farinha de Trigo",
    categoria: "Matéria Prima",
    volumeBruto: 1000,
    unidadeMedida: "g",
    custoMedio: 4.50,
    custoUnitario: 0.0045 // 4.50 / 1000
  },
  {
    id: 5,
    nome: "Embalagem Plástica Individual",
    categoria: "Embalagem",
    volumeBruto: 100,
    unidadeMedida: "un",
    custoMedio: 25.00,
    custoUnitario: 0.25 // 25.00 / 100
  },
  {
    id: 6,
    nome: "Rótulo de Papel",
    categoria: "Embalagem",
    volumeBruto: 100,
    unidadeMedida: "un",
    custoMedio: 10.00,
    custoUnitario: 0.10 // 10.00 / 100
  }
];

// Initial custom categories
const categoriasPersonalizadasMock: CategoriaPersonalizada[] = [
  {
    id: uuidv4(),
    nome: "Material de Limpeza"
  },
  {
    id: uuidv4(),
    nome: "Utensílios de Cozinha"
  }
];

interface InsumoStore {
  insumos: Insumo[];
  insumoAtual: Insumo | null;
  categoriasPersonalizadas: CategoriaPersonalizada[];
  
  // Ações para Insumos
  adicionarInsumo: (insumo: Omit<Insumo, 'id' | 'custoUnitario'>) => Insumo;
  atualizarInsumo: (id: number, dados: Partial<Omit<Insumo, 'id' | 'custoUnitario'>>) => void;
  removerInsumo: (id: number) => void;
  
  // Ações para Categorias Personalizadas
  adicionarCategoria: (nome: string) => void;
  editarCategoria: (id: string, nome: string) => void;
  removerCategoria: (id: string) => void;
  
  // Getters
  getInsumosPorCategoria: (categoria: CategoriaInsumo | string) => Insumo[];
  getInsumoPorId: (id: number) => Insumo | undefined;
  getAllInsumos: () => Insumo[];
  getAllCategorias: () => (CategoriaInsumo | string)[];
}

export const useInsumoStore = create<InsumoStore>()(
  devtools(
    (set, get) => ({
      insumos: insumosMock,
      insumoAtual: null,
      categoriasPersonalizadas: categoriasPersonalizadasMock,
      
      adicionarInsumo: (insumo) => {
        const novoId = Math.max(0, ...get().insumos.map(i => i.id)) + 1;
        const custoUnitario = insumo.volumeBruto > 0 ? insumo.custoMedio / insumo.volumeBruto : 0;
        
        const novoInsumo: Insumo = {
          ...insumo,
          id: novoId,
          custoUnitario: Number(custoUnitario.toFixed(4))
        };
        
        set(state => ({
          insumos: [...state.insumos, novoInsumo]
        }));
        
        toast({
          title: "Insumo adicionado",
          description: `${insumo.nome} foi adicionado com sucesso`
        });
        
        return novoInsumo;
      },
      
      atualizarInsumo: (id, dados) => {
        const insumo = get().insumos.find(i => i.id === id);
        
        if (!insumo) {
          toast({
            title: "Erro",
            description: "Insumo não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        const volumeBruto = dados.volumeBruto !== undefined ? dados.volumeBruto : insumo.volumeBruto;
        const custoMedio = dados.custoMedio !== undefined ? dados.custoMedio : insumo.custoMedio;
        const custoUnitario = volumeBruto > 0 ? custoMedio / volumeBruto : 0;
        
        set(state => ({
          insumos: state.insumos.map(i => 
            i.id === id 
              ? { 
                  ...i, 
                  ...dados, 
                  custoUnitario: Number(custoUnitario.toFixed(4))
                } 
              : i
          )
        }));
        
        toast({
          title: "Insumo atualizado",
          description: `${insumo.nome} foi atualizado com sucesso`
        });
      },
      
      removerInsumo: (id) => {
        const insumo = get().insumos.find(i => i.id === id);
        
        if (!insumo) return;
        
        set(state => ({
          insumos: state.insumos.filter(i => i.id !== id)
        }));
        
        toast({
          title: "Insumo removido",
          description: `${insumo.nome} foi removido com sucesso`
        });
      },
      
      adicionarCategoria: (nome) => {
        // Verificar se já existe uma categoria com esse nome
        const categoriasPadroes: CategoriaInsumo[] = ["Matéria Prima", "Embalagem", "Outros"];
        const todasCategorias = [...categoriasPadroes, ...get().categoriasPersonalizadas.map(c => c.nome)];
        
        if (todasCategorias.includes(nome)) {
          toast({
            title: "Erro",
            description: "Já existe uma categoria com esse nome",
            variant: "destructive"
          });
          return;
        }
        
        set(state => ({
          categoriasPersonalizadas: [
            ...state.categoriasPersonalizadas, 
            { id: uuidv4(), nome }
          ]
        }));
        
        toast({
          title: "Categoria adicionada",
          description: `Categoria "${nome}" adicionada com sucesso`
        });
      },
      
      editarCategoria: (id, novoNome) => {
        const categoriaAtual = get().categoriasPersonalizadas.find(c => c.id === id);
        if (!categoriaAtual) return;
        
        // Verificar se já existe outra categoria com esse nome
        const categoriasPadroes: CategoriaInsumo[] = ["Matéria Prima", "Embalagem", "Outros"];
        const outrasCategoriasPersonalizadas = get().categoriasPersonalizadas
          .filter(c => c.id !== id)
          .map(c => c.nome);
        
        if ([...categoriasPadroes, ...outrasCategoriasPersonalizadas].includes(novoNome)) {
          toast({
            title: "Erro",
            description: "Já existe uma categoria com esse nome",
            variant: "destructive"
          });
          return;
        }
        
        // Use a type assertion to fix the type compatibility issue
        set((state) => {
          const updatedInsumos = state.insumos.map(insumo => 
            insumo.categoria === categoriaAtual.nome 
              ? { ...insumo, categoria: novoNome as CategoriaInsumo } 
              : insumo
          );
          
          return {
            categoriasPersonalizadas: state.categoriasPersonalizadas.map(c => 
              c.id === id ? { ...c, nome: novoNome } : c
            ),
            insumos: updatedInsumos
          };
        });
        
        toast({
          title: "Categoria atualizada",
          description: `Categoria atualizada para "${novoNome}"`
        });
      },
      
      removerCategoria: (id) => {
        const categoria = get().categoriasPersonalizadas.find(c => c.id === id);
        if (!categoria) return;
        
        // Verificar se há insumos usando essa categoria
        const insumosNaCategoria = get().insumos.filter(i => i.categoria === categoria.nome);
        
        if (insumosNaCategoria.length > 0) {
          toast({
            title: "Erro",
            description: `Não é possível remover esta categoria pois existem ${insumosNaCategoria.length} insumo(s) vinculado(s)`,
            variant: "destructive"
          });
          return;
        }
        
        set(state => ({
          categoriasPersonalizadas: state.categoriasPersonalizadas.filter(c => c.id !== id)
        }));
        
        toast({
          title: "Categoria removida",
          description: `Categoria "${categoria.nome}" removida com sucesso`
        });
      },
      
      getInsumosPorCategoria: (categoria) => {
        return get().insumos.filter(i => i.categoria === categoria);
      },
      
      getInsumoPorId: (id) => {
        return get().insumos.find(i => i.id === id);
      },
      
      getAllInsumos: () => {
        return get().insumos;
      },
      
      getAllCategorias: () => {
        const categoriasPadroes: CategoriaInsumo[] = ["Matéria Prima", "Embalagem", "Outros"];
        const categoriasPersonalizadas = get().categoriasPersonalizadas.map(c => c.nome);
        return [...categoriasPadroes, ...categoriasPersonalizadas];
      }
    }),
    { name: 'insumo-store' }
  )
);
