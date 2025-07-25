import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useSupabaseProdutos } from "./useSupabaseProdutos";
import { Produto, ComponenteProduto, TipoComponente } from "@/types";

type ProdutoEdit = Omit<Produto, "id" | "custoTotal" | "margemLucro" | "componentes" | "ativo">;

interface ProdutoStore {
  produtos: Produto[];
  carregando: boolean;
  inicializar: () => void;
  adicionarProduto: (nome: string, descricao?: string, unidadesProducao?: number) => void;
  adicionarComponenteReceita: (idProduto: number, idReceita: number, quantidade: number) => void;
  adicionarComponenteInsumo: (idProduto: number, idInsumo: number, quantidade: number) => void;
  atualizarComponente: (idProduto: number, idComponente: number, quantidade: number) => void;
  removerComponente: (idProduto: number, idComponente: number) => void;
  atualizarProduto: (id: number, produto: Partial<ProdutoEdit>) => void;
  removerProduto: (id: number) => void;
  calcularCustoProduto: (produto: Produto) => number;
  getAllProdutos: () => Produto[];
  atualizarEstoqueMinimo: (id: number, estoqueMinimo: number) => void;
}

export const useProdutoStore = create<ProdutoStore>()(
  immer((set, get) => ({
    produtos: [],
    carregando: false,
    
    inicializar: () => {
      const { produtos: produtosSupabase } = useSupabaseProdutos();
      
      // Converter produtos do Supabase para o formato do store
      const produtosConvertidos: Produto[] = produtosSupabase.map(produto => ({
        id: parseInt(produto.id) || 0,
        nome: produto.nome,
        descricao: produto.descricao || '',
        precoVenda: Number(produto.preco_venda || 0),
        custoTotal: Number(produto.custo_total || 0),
        margemLucro: Number(produto.margem_lucro || 0),
        componentes: [],
        ativo: produto.ativo,
        unidadesProducao: produto.unidades_producao || 1,
        pesoUnitario: Number(produto.peso_unitario || 0),
        custoUnitario: Number(produto.custo_unitario || 0),
        categoria: produto.categoria_id ? `Categoria ${produto.categoria_id}` : "Não categorizado",
        estoqueMinimo: produto.estoque_minimo || 0,
        categoriaId: produto.categoria_id || 0,
        subcategoriaId: produto.subcategoria_id || 0
      }));
      
      set(state => {
        state.produtos = produtosConvertidos;
      });
    },
    
    adicionarProduto: (nome, descricao, unidadesProducao = 1) => set(state => {
      const id = state.produtos.length > 0 ? Math.max(...state.produtos.map(p => p.id)) + 1 : 1;
      state.produtos.push({
        id,
        nome,
        descricao,
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        unidadesProducao,
        pesoUnitario: 0,
        custoUnitario: 0,
        categoria: "Não categorizado",
        estoqueMinimo: 0,
        categoriaId: 0,
        subcategoriaId: 0
      });
    }),
    
    adicionarComponenteReceita: (idProduto, idReceita, quantidade) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === idProduto);
      if (produtoIndex !== -1) {
        const componentes = state.produtos[produtoIndex].componentes;
        const id = componentes.length > 0 ? Math.max(...componentes.map(c => c.id)) + 1 : 1;
        
        const nomeReceita = `Receita ${idReceita}`;
        const custoPorGrama = 0.05;
        const custoParcial = quantidade * custoPorGrama;
        
        state.produtos[produtoIndex].componentes.push({
          id,
          idProduto,
          idReceita,
          nomeReceita,
          quantidade,
          custoParcial,
          tipo: "Receita" as TipoComponente,
          idItem: idReceita,
          nome: nomeReceita,
          custo: custoParcial
        });
        
        state.produtos[produtoIndex].custoTotal = get().calcularCustoProduto(state.produtos[produtoIndex]);
        state.produtos[produtoIndex].custoUnitario = state.produtos[produtoIndex].custoTotal / (state.produtos[produtoIndex].unidadesProducao || 1);
        
        if (state.produtos[produtoIndex].precoVenda > 0) {
          state.produtos[produtoIndex].margemLucro = ((state.produtos[produtoIndex].precoVenda - state.produtos[produtoIndex].custoUnitario) / state.produtos[produtoIndex].precoVenda) * 100;
        }
        
        state.produtos[produtoIndex].pesoUnitario = (state.produtos[produtoIndex].pesoUnitario || 0) + quantidade / (state.produtos[produtoIndex].unidadesProducao || 1);
      }
    }),
    
    adicionarComponenteInsumo: (idProduto, idInsumo, quantidade) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === idProduto);
      if (produtoIndex !== -1) {
        const componentes = state.produtos[produtoIndex].componentes;
        const id = componentes.length > 0 ? Math.max(...componentes.map(c => c.id)) + 1 : 1;
        
        const nomeInsumo = `Insumo ${idInsumo}`;
        const custoUnitario = 1.0;
        const custoParcial = quantidade * custoUnitario;
        
        state.produtos[produtoIndex].componentes.push({
          id,
          idProduto,
          idReceita: 0,
          nomeReceita: "",
          quantidade,
          custoParcial,
          tipo: "Insumo" as TipoComponente,
          idItem: idInsumo,
          nome: nomeInsumo,
          custo: custoParcial
        });
        
        state.produtos[produtoIndex].custoTotal = get().calcularCustoProduto(state.produtos[produtoIndex]);
        state.produtos[produtoIndex].custoUnitario = state.produtos[produtoIndex].custoTotal / (state.produtos[produtoIndex].unidadesProducao || 1);
        
        if (state.produtos[produtoIndex].precoVenda > 0) {
          state.produtos[produtoIndex].margemLucro = ((state.produtos[produtoIndex].precoVenda - state.produtos[produtoIndex].custoUnitario) / state.produtos[produtoIndex].precoVenda) * 100;
        }
      }
    }),
    
    atualizarComponente: (idProduto, idComponente, quantidade) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === idProduto);
      if (produtoIndex !== -1) {
        const componenteIndex = state.produtos[produtoIndex].componentes.findIndex(c => c.id === idComponente);
        if (componenteIndex !== -1) {
          state.produtos[produtoIndex].componentes[componenteIndex].quantidade = quantidade;
          
          const componente = state.produtos[produtoIndex].componentes[componenteIndex];
          componente.custoParcial = componente.custo * quantidade;
          
          state.produtos[produtoIndex].custoTotal = get().calcularCustoProduto(state.produtos[produtoIndex]);
          state.produtos[produtoIndex].custoUnitario = state.produtos[produtoIndex].custoTotal / (state.produtos[produtoIndex].unidadesProducao || 1);
          
          if (state.produtos[produtoIndex].precoVenda > 0) {
            state.produtos[produtoIndex].margemLucro = ((state.produtos[produtoIndex].precoVenda - state.produtos[produtoIndex].custoUnitario) / state.produtos[produtoIndex].precoVenda) * 100;
          }
        }
      }
    }),
    
    removerComponente: (idProduto, idComponente) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === idProduto);
      if (produtoIndex !== -1) {
        state.produtos[produtoIndex].componentes = state.produtos[produtoIndex].componentes.filter(c => c.id !== idComponente);
        
        state.produtos[produtoIndex].custoTotal = get().calcularCustoProduto(state.produtos[produtoIndex]);
        state.produtos[produtoIndex].custoUnitario = state.produtos[produtoIndex].custoTotal / (state.produtos[produtoIndex].unidadesProducao || 1);
        
        if (state.produtos[produtoIndex].precoVenda > 0) {
          state.produtos[produtoIndex].margemLucro = ((state.produtos[produtoIndex].precoVenda - state.produtos[produtoIndex].custoUnitario) / state.produtos[produtoIndex].precoVenda) * 100;
        }
      }
    }),
    
    atualizarProduto: (id, produto) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === id);
      if (produtoIndex !== -1) {
        state.produtos[produtoIndex] = { ...state.produtos[produtoIndex], ...produto };
        
        if (produto.categoriaId) {
          const categoriaId = produto.categoriaId;
          if (categoriaId === 1) {
            state.produtos[produtoIndex].categoria = "Doces";
          } else if (categoriaId === 2) {
            state.produtos[produtoIndex].categoria = "Food Service";
          } else {
            state.produtos[produtoIndex].categoria = "Não categorizado";
          }
        }
      }
    }),
    
    removerProduto: (id) => set(state => {
      state.produtos = state.produtos.filter(p => p.id !== id);
    }),
    
    atualizarEstoqueMinimo: (id, estoqueMinimo) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === id);
      if (produtoIndex !== -1) {
        state.produtos[produtoIndex].estoqueMinimo = estoqueMinimo;
      }
    }),
    
    calcularCustoProduto: (produto) => {
      return produto.componentes.reduce((total, componente) => total + componente.custoParcial, 0);
    },
    
    getAllProdutos: () => get().produtos
  }))
);
