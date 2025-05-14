
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { ReceitaBase, ItemReceita } from '@/types';
import { useInsumoStore } from './useInsumoStore';

// Mock data for receitas
const receitasMock: ReceitaBase[] = [
  {
    id: 1,
    nome: "Brownie Tradicional",
    itensReceita: [
      { id: 1, idReceita: 1, idInsumo: 1, quantidade: 300, custo: 9.00 },
      { id: 2, idReceita: 1, idInsumo: 2, quantidade: 150, custo: 6.375 },
      { id: 3, idReceita: 1, idInsumo: 3, quantidade: 200, custo: 1.20 },
      { id: 4, idReceita: 1, idInsumo: 4, quantidade: 100, custo: 0.45 }
    ],
    pesoTotal: 750, // soma das quantidades
    custoTotal: 17.025 // soma dos custos
  },
  {
    id: 2,
    nome: "Brownie Blondie",
    itensReceita: [
      { id: 5, idReceita: 2, idInsumo: 2, quantidade: 150, custo: 6.375 },
      { id: 6, idReceita: 2, idInsumo: 3, quantidade: 250, custo: 1.50 },
      { id: 7, idReceita: 2, idInsumo: 4, quantidade: 150, custo: 0.675 }
    ],
    pesoTotal: 550, // soma das quantidades
    custoTotal: 8.55 // soma dos custos
  }
];

interface ReceitaStore {
  receitas: ReceitaBase[];
  receitaAtual: ReceitaBase | null;
  
  // Ações
  adicionarReceita: (nome: string) => ReceitaBase;
  adicionarItemReceita: (idReceita: number, idInsumo: number, quantidade: number) => void;
  atualizarItemReceita: (idReceita: number, idItem: number, quantidade: number) => void;
  removerItemReceita: (idReceita: number, idItem: number) => void;
  atualizarReceita: (id: number, dados: Partial<Omit<ReceitaBase, 'id' | 'itensReceita' | 'pesoTotal' | 'custoTotal'>>) => void;
  removerReceita: (id: number) => void;
  
  // Getters
  getReceitaPorId: (id: number) => ReceitaBase | undefined;
  getAllReceitas: () => ReceitaBase[];
}

export const useReceitaStore = create<ReceitaStore>()(
  devtools(
    (set, get) => ({
      receitas: receitasMock,
      receitaAtual: null,
      
      adicionarReceita: (nome) => {
        const novoId = Math.max(0, ...get().receitas.map(r => r.id)) + 1;
        
        const novaReceita: ReceitaBase = {
          id: novoId,
          nome,
          itensReceita: [],
          pesoTotal: 0,
          custoTotal: 0
        };
        
        set(state => ({
          receitas: [...state.receitas, novaReceita]
        }));
        
        toast({
          title: "Receita adicionada",
          description: `${nome} foi adicionada com sucesso`
        });
        
        return novaReceita;
      },
      
      adicionarItemReceita: (idReceita, idInsumo, quantidade) => {
        const receita = get().receitas.find(r => r.id === idReceita);
        const insumo = useInsumoStore.getState().getInsumoPorId(idInsumo);
        
        if (!receita || !insumo) {
          toast({
            title: "Erro",
            description: "Receita ou insumo não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        // Verificar se este insumo já existe na receita
        const itemExistente = receita.itensReceita.find(i => i.idInsumo === idInsumo);
        if (itemExistente) {
          // Atualizar quantidade em vez de adicionar novo
          get().atualizarItemReceita(idReceita, itemExistente.id, quantidade + itemExistente.quantidade);
          return;
        }
        
        const novoIdItem = Math.max(0, ...receita.itensReceita.map(i => i.id), 0) + 1;
        const custo = insumo.custoUnitario * quantidade;
        
        const novoItem: ItemReceita = {
          id: novoIdItem,
          idReceita,
          idInsumo,
          insumo,
          quantidade,
          custo
        };
        
        set(state => ({
          receitas: state.receitas.map(r => {
            if (r.id === idReceita) {
              const novosItens = [...r.itensReceita, novoItem];
              const novoPesoTotal = novosItens.reduce((sum, item) => sum + item.quantidade, 0);
              const novoCustoTotal = novosItens.reduce((sum, item) => sum + item.custo, 0);
              
              return {
                ...r,
                itensReceita: novosItens,
                pesoTotal: novoPesoTotal,
                custoTotal: Number(novoCustoTotal.toFixed(2))
              };
            }
            return r;
          })
        }));
      },
      
      atualizarItemReceita: (idReceita, idItem, quantidade) => {
        const receita = get().receitas.find(r => r.id === idReceita);
        const item = receita?.itensReceita.find(i => i.id === idItem);
        const insumo = item ? useInsumoStore.getState().getInsumoPorId(item.idInsumo) : undefined;
        
        if (!receita || !item || !insumo) {
          toast({
            title: "Erro",
            description: "Receita, item ou insumo não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        const custo = insumo.custoUnitario * quantidade;
        
        set(state => ({
          receitas: state.receitas.map(r => {
            if (r.id === idReceita) {
              const novosItens = r.itensReceita.map(i => 
                i.id === idItem 
                  ? { ...i, quantidade, custo: Number(custo.toFixed(3)) } 
                  : i
              );
              
              const novoPesoTotal = novosItens.reduce((sum, item) => sum + item.quantidade, 0);
              const novoCustoTotal = novosItens.reduce((sum, item) => sum + item.custo, 0);
              
              return {
                ...r,
                itensReceita: novosItens,
                pesoTotal: novoPesoTotal,
                custoTotal: Number(novoCustoTotal.toFixed(2))
              };
            }
            return r;
          })
        }));
      },
      
      removerItemReceita: (idReceita, idItem) => {
        const receita = get().receitas.find(r => r.id === idReceita);
        
        if (!receita) return;
        
        set(state => ({
          receitas: state.receitas.map(r => {
            if (r.id === idReceita) {
              const novosItens = r.itensReceita.filter(i => i.id !== idItem);
              const novoPesoTotal = novosItens.reduce((sum, item) => sum + item.quantidade, 0);
              const novoCustoTotal = novosItens.reduce((sum, item) => sum + item.custo, 0);
              
              return {
                ...r,
                itensReceita: novosItens,
                pesoTotal: novoPesoTotal,
                custoTotal: Number(novoCustoTotal.toFixed(2))
              };
            }
            return r;
          })
        }));
      },
      
      atualizarReceita: (id, dados) => {
        set(state => ({
          receitas: state.receitas.map(r => 
            r.id === id ? { ...r, ...dados } : r
          )
        }));
      },
      
      removerReceita: (id) => {
        const receita = get().receitas.find(r => r.id === id);
        
        if (!receita) return;
        
        set(state => ({
          receitas: state.receitas.filter(r => r.id !== id)
        }));
        
        toast({
          title: "Receita removida",
          description: `${receita.nome} foi removida com sucesso`
        });
      },
      
      getReceitaPorId: (id) => {
        return get().receitas.find(r => r.id === id);
      },
      
      getAllReceitas: () => {
        return get().receitas;
      }
    }),
    { name: 'receita-store' }
  )
);
