
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
      insumos: [], // Iniciando vazio
      insumoAtual: null,
      categoriasPersonalizadas: [], // Iniciando vazio
      
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
