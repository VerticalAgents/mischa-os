import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Produto, ComponenteProduto, TipoComponente } from "@/types";

type ProdutoEdit = Omit<Produto, "id" | "custoTotal" | "margemLucro" | "componentes" | "ativo">;

interface ProdutoStore {
  produtos: Produto[];
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
            idProduto: 1,
            idReceita: 1,
            nomeReceita: "Massa Brownie Tradicional",
            quantidade: 35,
            custoParcial: 1.85,
            tipo: "Receita",
            idItem: 1,
            nome: "Massa Brownie Tradicional",
            custo: 1.85
          },
          {
            id: 2,
            idProduto: 1,
            idReceita: 0,
            nomeReceita: "",
            quantidade: 1,
            custoParcial: 1.00,
            tipo: "Insumo",
            idItem: 3,
            nome: "Embalagem Individual",
            custo: 1.00
          }
        ],
        ativo: true,
        pesoUnitario: 35,
        custoUnitario: 2.85,
        unidadesProducao: 100,
        categoria: "Revenda Padrão", // Atualizado para refletir a nova categoria
        estoqueMinimo: 10,
        categoriaId: 1,
        subcategoriaId: 1
      },
      // Novos produtos padrão
      {
        id: 2,
        nome: "Brownie Tradicional",
        descricao: "Brownie tradicional",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 3,
        nome: "Brownie Choco Duo",
        descricao: "Brownie com chocolate duplo",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 4,
        nome: "Brownie Meio Amargo",
        descricao: "Brownie meio amargo",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 5,
        nome: "Brownie Stikadinho",
        descricao: "Brownie stikadinho",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 6,
        nome: "Brownie Avelã",
        descricao: "Brownie com avelã",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 7,
        nome: "Brownie Blondie",
        descricao: "Brownie blondie",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 8,
        nome: "Brownie Doce de Leite",
        descricao: "Brownie com doce de leite",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 9,
        nome: "Brownie Nesquik",
        descricao: "Brownie Nesquik",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 10,
        nome: "Brownie Oreo Cream",
        descricao: "Brownie Oreo Cream",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 11,
        nome: "Brownie Pistache",
        descricao: "Brownie com pistache",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Revenda Padrão",
        estoqueMinimo: 0,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 12,
        nome: "Mini Brownie Tradicional Congelado 2kg",
        descricao: "Mini brownie tradicional congelado",
        precoVenda: 0,
        custoTotal: 0,
        margemLucro: 0,
        componentes: [],
        ativo: true,
        pesoUnitario: 0,
        custoUnitario: 0,
        unidadesProducao: 100,
        categoria: "Food Service",
        estoqueMinimo: 0,
        categoriaId: 2,
        subcategoriaId: 3
      }
    ],
    
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
    
    atualizarProduto: (id, produto) => set(state => {
      const produtoIndex = state.produtos.findIndex(p => p.id === id);
      if (produtoIndex !== -1) {
        state.produtos[produtoIndex] = { ...state.produtos[produtoIndex], ...produto };
        
        // Update categoria field if categoriaId was changed
        if (produto.categoriaId) {
          const categoriaId = produto.categoriaId;
          if (categoriaId === 1) {
            state.produtos[produtoIndex].categoria = "Revenda Padrão"; // Atualizado
          } else if (categoriaId === 2) {
            state.produtos[produtoIndex].categoria = "Food Service";
          } else {
            state.produtos[produtoIndex].categoria = "Não categorizado";
          }
        }
      }
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
