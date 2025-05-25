
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { Sabor } from '../types';

interface SaborStore {
  sabores: Sabor[];
  saborAtual: Sabor | null;
  
  // Ações
  adicionarSabor: (sabor: Omit<Sabor, 'id'>) => Sabor;
  atualizarSabor: (id: number, dados: Partial<Omit<Sabor, 'id'>>) => void;
  removerSabor: (id: number) => void;
  atualizarSaldoEstoque: (id: number, quantidade: number, entrada: boolean) => void;
  
  // Getters
  getSaborPorId: (id: number) => Sabor | undefined;
  getAllSabores: () => Sabor[];
  getSaboresAtivos: () => Sabor[];
  getSaboresAbaixoMinimo: () => Sabor[];
}

export const useSaborStore = create<SaborStore>()(
  devtools(
    (set, get) => ({
      sabores: [], // Iniciando vazio
      saborAtual: null,
      
      adicionarSabor: (sabor) => {
        const novoId = Math.max(0, ...get().sabores.map(s => s.id)) + 1;
        
        const novoSabor: Sabor = {
          ...sabor,
          id: novoId
        };
        
        set(state => ({
          sabores: [...state.sabores, novoSabor]
        }));
        
        toast({
          title: "Sabor adicionado",
          description: `${sabor.nome} foi adicionado com sucesso`
        });
        
        return novoSabor;
      },
      
      atualizarSabor: (id, dados) => {
        const sabor = get().sabores.find(s => s.id === id);
        
        if (!sabor) {
          toast({
            title: "Erro",
            description: "Sabor não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        set(state => ({
          sabores: state.sabores.map(s => 
            s.id === id ? { ...s, ...dados } : s
          ),
          saborAtual: state.saborAtual?.id === id 
            ? { ...state.saborAtual, ...dados } 
            : state.saborAtual
        }));
        
        toast({
          title: "Sabor atualizado",
          description: `${sabor.nome} foi atualizado com sucesso`
        });
      },
      
      removerSabor: (id) => {
        const sabor = get().sabores.find(s => s.id === id);
        
        if (!sabor) return;
        
        set(state => ({
          sabores: state.sabores.filter(s => s.id !== id),
          saborAtual: state.saborAtual?.id === id ? null : state.saborAtual
        }));
        
        toast({
          title: "Sabor removido",
          description: `${sabor.nome} foi removido com sucesso`
        });
      },
      
      atualizarSaldoEstoque: (id, quantidade, entrada) => {
        const sabor = get().sabores.find(s => s.id === id);
        
        if (!sabor) return;
        
        const novoSaldo = entrada 
          ? sabor.saldoAtual + quantidade 
          : sabor.saldoAtual - quantidade;
        
        set(state => ({
          sabores: state.sabores.map(s => 
            s.id === id ? { ...s, saldoAtual: Math.max(0, novoSaldo) } : s
          )
        }));
      },
      
      getSaborPorId: (id) => {
        return get().sabores.find(s => s.id === id);
      },
      
      getAllSabores: () => {
        return get().sabores;
      },
      
      getSaboresAtivos: () => {
        return get().sabores.filter(s => s.ativo);
      },
      
      getSaboresAbaixoMinimo: () => {
        return get().sabores.filter(s => s.saldoAtual < s.estoqueMinimo);
      }
    }),
    { name: 'sabor-store' }
  )
);
