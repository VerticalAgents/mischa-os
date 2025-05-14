
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { Insumo, CategoriaInsumo, UnidadeMedida } from '@/types';

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

interface InsumoStore {
  insumos: Insumo[];
  insumoAtual: Insumo | null;
  
  // Ações
  adicionarInsumo: (insumo: Omit<Insumo, 'id' | 'custoUnitario'>) => Insumo;
  atualizarInsumo: (id: number, dados: Partial<Omit<Insumo, 'id' | 'custoUnitario'>>) => void;
  removerInsumo: (id: number) => void;
  
  // Getters
  getInsumosPorCategoria: (categoria: CategoriaInsumo) => Insumo[];
  getInsumoPorId: (id: number) => Insumo | undefined;
  getAllInsumos: () => Insumo[];
}

export const useInsumoStore = create<InsumoStore>()(
  devtools(
    (set, get) => ({
      insumos: insumosMock,
      insumoAtual: null,
      
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
      
      getInsumosPorCategoria: (categoria) => {
        return get().insumos.filter(i => i.categoria === categoria);
      },
      
      getInsumoPorId: (id) => {
        return get().insumos.find(i => i.id === id);
      },
      
      getAllInsumos: () => {
        return get().insumos;
      }
    }),
    { name: 'insumo-store' }
  )
);
