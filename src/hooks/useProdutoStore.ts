
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Produto, ComponenteProduto, TipoComponente } from "@/types";

type ProdutoEdit = Omit<Produto, "id" | "custoTotal" | "margemLucro" | "componentes" | "ativo">;

interface ProdutoStore {
  produtos: Produto[];
  adicionarProduto: (produto: z.infer<typeof formSchema>) => void;
  adicionarComponenteReceita: (idProduto: number, idReceita: number, quantidade: number) => void;
  adicionarComponenteInsumo: (idProduto: number, idInsumo: number, quantidade: number) => void;
  atualizarComponente: (idProduto: number, idComponente: number, quantidade: number) => void;
  removerComponente: (idProduto: number, idComponente: number) => void;
  atualizarProduto: (id: number, produto: Partial<z.infer<typeof formSchema>>) => void;
  removerProduto: (id: number) => void;
  calcularCustoProduto: (produto: Produto) => number;
  getAllProdutos: () => Produto[];
  atualizarEstoqueMinimo: (id: number, estoqueMinimo: number) => void;
}

// This schema is the same as in ProdutosTab.tsx but needs to be duplicated here to avoid circular imports
import * as z from "zod";

const formSchema = z.object({
  nome: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  descricao: z.string().optional(),
  categoriaId: z.number().min(1, {
    message: "Categoria é obrigatória.",
  }),
  subcategoriaId: z.number().min(1, {
    message: "Subcategoria é obrigatória.",
  }),
  ativo: z.boolean().default(true),
  componentes: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      tipo: z.enum(["Insumo", "Receita", "Outro"]),
      quantidade: z.number(),
      idItem: z.number().optional(),
      custo: z.number().optional(),
    })
  ),
});

export const useProdutoStore = create<ProdutoStore>()(
  immer((set, get) => ({
    produtos: [
      {
        id: 1,
        nome: "Brownie Individual",
        descricao: "Brownie individual embalado",
        precoVenda: 5.99,
        custoTotal: 2.85,
        margemLucro: 52.4,
        componentes: [
          {
            id: 1,
            nome: "Massa Brownie Tradicional",
            tipo: "Receita",
            quantidade: 35,
            idItem: 1,
            custo: 1.85
          },
          {
            id: 2,
            nome: "Embalagem Individual",
            tipo: "Insumo",
            quantidade: 1,
            idItem: 3,
            custo: 1.00
          }
        ],
        ativo: true,
        pesoUnitario: 35,
        custoUnitario: 2.85,
        unidadesProducao: 100,
        categoria: "Doces",
        estoqueMinimo: 10,
        categoriaId: 1,
        subcategoriaId: 1
      }
    ],
    
    adicionarProduto: (produto) => set(state => {
      const id = state.produtos.length > 0 ? Math.max(...state.produtos.map(p => p.id)) + 1 : 1;
      state.produtos.push({
        id,
        nome: produto.nome,
        descricao: produto.descricao,
        categoriaId: produto.categoriaId,
        subcategoriaId: produto.subcategoriaId,
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: produto.componentes || [],
        ativo: produto.ativo,
        unidadesProducao: 1,
        pesoUnitario: 0,
        custoUnitario: 0,
        categoria: "Não categorizado",
        estoqueMinimo: 0
      });
    }),
    
    adicionarComponenteReceita: (idProduto, idReceita, quantidade) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === idProduto);
      if (produtoIndex !== -1) {
        const componentes = state.produtos[produtoIndex].componentes;
        const id = componentes.length > 0 ? Math.max(...componentes.map(c => c.id)) + 1 : 1;
        
        // Simular busca na receita
        const nomeReceita = `Receita ${idReceita}`; // Substituir por busca real
        const custoPorGrama = 0.05; // Simulação de custo
        const custoParcial = quantidade * custoPorGrama;
        
        state.produtos[produtoIndex].componentes.push({
          id,
          nome: nomeReceita,
          tipo: "Receita",
          quantidade,
          idItem: idReceita,
          custo: custoParcial
        });
        
        // Atualizar custo total
        state.produtos[produtoIndex].custoTotal = get().calcularCustoProduto(state.produtos[produtoIndex]);
        state.produtos[produtoIndex].custoUnitario = state.produtos[produtoIndex].custoTotal / (state.produtos[produtoIndex].unidadesProducao || 1);
        
        // Atualizar margem de lucro
        if (state.produtos[produtoIndex].precoVenda > 0) {
          state.produtos[produtoIndex].margemLucro = ((state.produtos[produtoIndex].precoVenda - state.produtos[produtoIndex].custoUnitario) / state.produtos[produtoIndex].precoVenda) * 100;
        }
        
        // Atualizar peso unitário se for uma receita
        state.produtos[produtoIndex].pesoUnitario = (state.produtos[produtoIndex].pesoUnitario || 0) + quantidade / (state.produtos[produtoIndex].unidadesProducao || 1);
      }
    }),
    
    adicionarComponenteInsumo: (idProduto, idInsumo, quantidade) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === idProduto);
      if (produtoIndex !== -1) {
        const componentes = state.produtos[produtoIndex].componentes;
        const id = componentes.length > 0 ? Math.max(...componentes.map(c => c.id)) + 1 : 1;
        
        // Simular busca no insumo
        const nomeInsumo = `Insumo ${idInsumo}`; // Substituir por busca real
        const custoUnitario = 1.0; // Simulação de custo
        const custoParcial = quantidade * custoUnitario;
        
        state.produtos[produtoIndex].componentes.push({
          id,
          nome: nomeInsumo,
          tipo: "Insumo",
          quantidade,
          idItem: idInsumo,
          custo: custoParcial
        });
        
        // Atualizar custo total
        state.produtos[produtoIndex].custoTotal = get().calcularCustoProduto(state.produtos[produtoIndex]);
        state.produtos[produtoIndex].custoUnitario = state.produtos[produtoIndex].custoTotal / (state.produtos[produtoIndex].unidadesProducao || 1);
        
        // Atualizar margem de lucro
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
          // Atualizar quantidade
          state.produtos[produtoIndex].componentes[componenteIndex].quantidade = quantidade;
          
          // Recalcular custo 
          const componente = state.produtos[produtoIndex].componentes[componenteIndex];
          if (componente.custo) {
            // Calcular o custo unitário (custo por unidade de quantidade)
            const custoUnitario = componente.custo / componente.quantidade;
            // Atualizar o custo com base na nova quantidade
            componente.custo = custoUnitario * quantidade;
          }
          
          // Atualizar custo total
          state.produtos[produtoIndex].custoTotal = get().calcularCustoProduto(state.produtos[produtoIndex]);
          state.produtos[produtoIndex].custoUnitario = state.produtos[produtoIndex].custoTotal / (state.produtos[produtoIndex].unidadesProducao || 1);
          
          // Atualizar margem de lucro
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
        
        // Atualizar custo total
        state.produtos[produtoIndex].custoTotal = get().calcularCustoProduto(state.produtos[produtoIndex]);
        state.produtos[produtoIndex].custoUnitario = state.produtos[produtoIndex].custoTotal / (state.produtos[produtoIndex].unidadesProducao || 1);
        
        // Atualizar margem de lucro
        if (state.produtos[produtoIndex].precoVenda > 0) {
          state.produtos[produtoIndex].margemLucro = ((state.produtos[produtoIndex].precoVenda - state.produtos[produtoIndex].custoUnitario) / state.produtos[produtoIndex].precoVenda) * 100;
        }
      }
    }),
    
    atualizarProduto: (id, produto) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === id);
      if (produtoIndex !== -1) {
        state.produtos[produtoIndex] = { 
          ...state.produtos[produtoIndex], 
          nome: produto.nome || state.produtos[produtoIndex].nome,
          descricao: produto.descricao,
          categoriaId: produto.categoriaId || state.produtos[produtoIndex].categoriaId,
          subcategoriaId: produto.subcategoriaId || state.produtos[produtoIndex].subcategoriaId,
          ativo: produto.ativo ?? state.produtos[produtoIndex].ativo,
          componentes: produto.componentes || state.produtos[produtoIndex].componentes
        };
        
        // Update categoria field if categoriaId was changed
        if (produto.categoriaId) {
          // This is a simplified approach - in a real app, you'd fetch the category name from the category store
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
      return produto.componentes.reduce((total, componente) => total + (componente.custo || 0), 0);
    },
    
    getAllProdutos: () => get().produtos
  }))
);
