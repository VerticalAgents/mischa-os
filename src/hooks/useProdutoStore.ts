
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { Produto, ComponenteProduto } from '@/types';
import { useReceitaStore } from './useReceitaStore';
import { useInsumoStore } from './useInsumoStore';

// Mock data for produtos
const produtosMock: Produto[] = [
  {
    id: 1,
    nome: "Brownie Tradicional Individual",
    descricao: "Brownie tradicional embalado individualmente com rótulo",
    componentes: [
      { 
        id: 1, 
        idProduto: 1, 
        tipo: "Receita", 
        idItem: 1, // ID da receita Brownie Tradicional
        nome: "Brownie Tradicional", 
        quantidade: 1300, // gramas
        custo: 22.13 // (17.025 / 750) * 1300
      },
      { 
        id: 2, 
        idProduto: 1, 
        tipo: "Insumo", 
        idItem: 5, // ID do insumo Embalagem Plástica Individual
        nome: "Embalagem Plástica Individual", 
        quantidade: 20, 
        custo: 5.00 // 0.25 * 20
      },
      { 
        id: 3, 
        idProduto: 1, 
        tipo: "Insumo", 
        idItem: 6, // ID do insumo Rótulo de Papel
        nome: "Rótulo de Papel", 
        quantidade: 20, 
        custo: 2.00 // 0.10 * 20
      }
    ],
    unidadesProducao: 20,
    pesoUnitario: 65, // 1300g / 20 unidades
    custoTotal: 29.13, // soma dos custos dos componentes
    custoUnitario: 1.46 // 29.13 / 20
  }
];

interface ProdutoStore {
  produtos: Produto[];
  produtoAtual: Produto | null;
  
  // Ações
  adicionarProduto: (nome: string, descricao?: string, unidadesProducao?: number) => Produto;
  adicionarComponenteReceita: (idProduto: number, idReceita: number, quantidade: number) => void;
  adicionarComponenteInsumo: (idProduto: number, idInsumo: number, quantidade: number) => void;
  atualizarComponente: (idProduto: number, idComponente: number, quantidade: number) => void;
  removerComponente: (idProduto: number, idComponente: number) => void;
  atualizarProduto: (id: number, dados: Partial<Omit<Produto, 'id' | 'componentes' | 'custoTotal' | 'custoUnitario'>>) => void;
  removerProduto: (id: number) => void;
  recalcularProduto: (idProduto: number) => void;
  
  // Getters
  getProdutoPorId: (id: number) => Produto | undefined;
  getAllProdutos: () => Produto[];
}

export const useProdutoStore = create<ProdutoStore>()(
  devtools(
    (set, get) => ({
      produtos: produtosMock,
      produtoAtual: null,
      
      adicionarProduto: (nome, descricao = "", unidadesProducao = 0) => {
        const novoId = Math.max(0, ...get().produtos.map(p => p.id)) + 1;
        
        const novoProduto: Produto = {
          id: novoId,
          nome,
          descricao,
          componentes: [],
          unidadesProducao,
          pesoUnitario: 0,
          custoTotal: 0,
          custoUnitario: 0
        };
        
        set(state => ({
          produtos: [...state.produtos, novoProduto]
        }));
        
        toast({
          title: "Produto adicionado",
          description: `${nome} foi adicionado com sucesso`
        });
        
        return novoProduto;
      },
      
      adicionarComponenteReceita: (idProduto, idReceita, quantidade) => {
        const produto = get().produtos.find(p => p.id === idProduto);
        const receita = useReceitaStore.getState().getReceitaPorId(idReceita);
        
        if (!produto || !receita) {
          toast({
            title: "Erro",
            description: "Produto ou receita não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        // Verificar se esta receita já existe no produto
        const componenteExistente = produto.componentes.find(c => c.tipo === "Receita" && c.idItem === idReceita);
        if (componenteExistente) {
          // Atualizar quantidade em vez de adicionar novo
          get().atualizarComponente(idProduto, componenteExistente.id, quantidade);
          return;
        }
        
        const novoIdComponente = Math.max(0, ...produto.componentes.map(c => c.id), 0) + 1;
        
        // Calcular custo proporcional da receita
        const custoUnitarioReceita = receita.custoTotal / receita.pesoTotal;
        const custo = custoUnitarioReceita * quantidade;
        
        const novoComponente: ComponenteProduto = {
          id: novoIdComponente,
          idProduto,
          tipo: "Receita",
          idItem: idReceita,
          nome: receita.nome,
          quantidade,
          custo: Number(custo.toFixed(2))
        };
        
        set(state => ({
          produtos: state.produtos.map(p => {
            if (p.id === idProduto) {
              const novosComponentes = [...p.componentes, novoComponente];
              return {
                ...p,
                componentes: novosComponentes
              };
            }
            return p;
          })
        }));
        
        // Recalcular totais
        get().recalcularProduto(idProduto);
      },
      
      adicionarComponenteInsumo: (idProduto, idInsumo, quantidade) => {
        const produto = get().produtos.find(p => p.id === idProduto);
        const insumo = useInsumoStore.getState().getInsumoPorId(idInsumo);
        
        if (!produto || !insumo) {
          toast({
            title: "Erro",
            description: "Produto ou insumo não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        // Verificar se este insumo já existe no produto
        const componenteExistente = produto.componentes.find(c => c.tipo === "Insumo" && c.idItem === idInsumo);
        if (componenteExistente) {
          // Atualizar quantidade em vez de adicionar novo
          get().atualizarComponente(idProduto, componenteExistente.id, quantidade);
          return;
        }
        
        const novoIdComponente = Math.max(0, ...produto.componentes.map(c => c.id), 0) + 1;
        const custo = insumo.custoUnitario * quantidade;
        
        const novoComponente: ComponenteProduto = {
          id: novoIdComponente,
          idProduto,
          tipo: "Insumo",
          idItem: idInsumo,
          nome: insumo.nome,
          quantidade,
          custo: Number(custo.toFixed(2))
        };
        
        set(state => ({
          produtos: state.produtos.map(p => {
            if (p.id === idProduto) {
              const novosComponentes = [...p.componentes, novoComponente];
              return {
                ...p,
                componentes: novosComponentes
              };
            }
            return p;
          })
        }));
        
        // Recalcular totais
        get().recalcularProduto(idProduto);
      },
      
      atualizarComponente: (idProduto, idComponente, quantidade) => {
        const produto = get().produtos.find(p => p.id === idProduto);
        const componente = produto?.componentes.find(c => c.id === idComponente);
        
        if (!produto || !componente) {
          toast({
            title: "Erro",
            description: "Produto ou componente não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        // Recalcular o custo com base no tipo de componente
        let custo = 0;
        if (componente.tipo === "Receita") {
          const receita = useReceitaStore.getState().getReceitaPorId(componente.idItem);
          if (receita) {
            const custoUnitarioReceita = receita.custoTotal / receita.pesoTotal;
            custo = custoUnitarioReceita * quantidade;
          }
        } else if (componente.tipo === "Insumo") {
          const insumo = useInsumoStore.getState().getInsumoPorId(componente.idItem);
          if (insumo) {
            custo = insumo.custoUnitario * quantidade;
          }
        }
        
        set(state => ({
          produtos: state.produtos.map(p => {
            if (p.id === idProduto) {
              const novosComponentes = p.componentes.map(c => 
                c.id === idComponente 
                  ? { ...c, quantidade, custo: Number(custo.toFixed(2)) } 
                  : c
              );
              
              return {
                ...p,
                componentes: novosComponentes
              };
            }
            return p;
          })
        }));
        
        // Recalcular totais
        get().recalcularProduto(idProduto);
      },
      
      removerComponente: (idProduto, idComponente) => {
        set(state => ({
          produtos: state.produtos.map(p => {
            if (p.id === idProduto) {
              return {
                ...p,
                componentes: p.componentes.filter(c => c.id !== idComponente)
              };
            }
            return p;
          })
        }));
        
        // Recalcular totais
        get().recalcularProduto(idProduto);
      },
      
      atualizarProduto: (id, dados) => {
        set(state => ({
          produtos: state.produtos.map(p => {
            if (p.id === id) {
              return { ...p, ...dados };
            }
            return p;
          })
        }));
        
        // Se unidadesProducao foi alterada, recalculamos totais
        if ('unidadesProducao' in dados) {
          get().recalcularProduto(id);
        }
      },
      
      removerProduto: (id) => {
        const produto = get().produtos.find(p => p.id === id);
        
        if (!produto) return;
        
        set(state => ({
          produtos: state.produtos.filter(p => p.id !== id)
        }));
        
        toast({
          title: "Produto removido",
          description: `${produto.nome} foi removido com sucesso`
        });
      },
      
      recalcularProduto: (idProduto) => {
        set(state => ({
          produtos: state.produtos.map(p => {
            if (p.id === idProduto) {
              // Calcular custo total
              const custoTotal = p.componentes.reduce((sum, comp) => sum + comp.custo, 0);
              
              // Calcular peso total e unitário
              let pesoTotal = 0;
              // Somar apenas componentes do tipo Receita para o peso
              p.componentes.forEach(comp => {
                if (comp.tipo === "Receita") {
                  pesoTotal += comp.quantidade;
                }
              });
              
              const pesoUnitario = p.unidadesProducao > 0 ? Math.round(pesoTotal / p.unidadesProducao) : 0;
              const custoUnitario = p.unidadesProducao > 0 ? Number((custoTotal / p.unidadesProducao).toFixed(2)) : 0;
              
              return {
                ...p,
                pesoUnitario,
                custoTotal: Number(custoTotal.toFixed(2)),
                custoUnitario
              };
            }
            return p;
          })
        }));
      },
      
      getProdutoPorId: (id) => {
        return get().produtos.find(p => p.id === id);
      },
      
      getAllProdutos: () => {
        return get().produtos;
      }
    }),
    { name: 'produto-store' }
  )
);
