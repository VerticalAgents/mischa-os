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
        categoria: "Revenda Padrão",
        estoqueMinimo: 10,
        categoriaId: 1,
        subcategoriaId: 1
      },
      // Novos produtos de brownie
      {
        id: 2,
        nome: "Brownie Tradicional",
        descricao: "Brownie tradicional",
        precoVenda: 6.50,
        custoTotal: 3.20,
        margemLucro: 50.8,
        componentes: [],
        ativo: true,
        pesoUnitario: 40,
        custoUnitario: 3.20,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 15,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 3,
        nome: "Brownie Choco Duo",
        descricao: "Brownie com duplo chocolate",
        precoVenda: 7.00,
        custoTotal: 3.50,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 42,
        custoUnitario: 3.50,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 12,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 4,
        nome: "Brownie Meio Amargo",
        descricao: "Brownie com chocolate meio amargo",
        precoVenda: 6.80,
        custoTotal: 3.40,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 40,
        custoUnitario: 3.40,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 10,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 5,
        nome: "Brownie Stikadinho",
        descricao: "Brownie com cobertura especial",
        precoVenda: 7.50,
        custoTotal: 3.75,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 45,
        custoUnitario: 3.75,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 8,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 6,
        nome: "Brownie Avelã",
        descricao: "Brownie com avelã",
        precoVenda: 8.00,
        custoTotal: 4.20,
        margemLucro: 47.5,
        componentes: [],
        ativo: true,
        pesoUnitario: 42,
        custoUnitario: 4.20,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 10,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 7,
        nome: "Brownie Blondie",
        descricao: "Brownie de chocolate branco",
        precoVenda: 7.20,
        custoTotal: 3.60,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 40,
        custoUnitario: 3.60,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 12,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 8,
        nome: "Brownie Doce de Leite",
        descricao: "Brownie com recheio de doce de leite",
        precoVenda: 7.80,
        custoTotal: 3.90,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 45,
        custoUnitario: 3.90,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 10,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 9,
        nome: "Brownie Nesquik",
        descricao: "Brownie sabor Nesquik",
        precoVenda: 7.20,
        custoTotal: 3.60,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 40,
        custoUnitario: 3.60,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 12,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 10,
        nome: "Brownie Oreo Cream",
        descricao: "Brownie com pedaços de Oreo",
        precoVenda: 8.50,
        custoTotal: 4.25,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 45,
        custoUnitario: 4.25,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 8,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 11,
        nome: "Brownie Pistache",
        descricao: "Brownie com pistache",
        precoVenda: 9.00,
        custoTotal: 4.50,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 42,
        custoUnitario: 4.50,
        unidadesProducao: 30,
        categoria: "Revenda Padrão",
        estoqueMinimo: 6,
        categoriaId: 1,
        subcategoriaId: 1
      },
      {
        id: 12,
        nome: "Mini Brownie Tradicional Congelado 2kg",
        descricao: "Mini brownies tradicionais congelados - pacote 2kg",
        precoVenda: 45.00,
        custoTotal: 22.50,
        margemLucro: 50.0,
        componentes: [],
        ativo: true,
        pesoUnitario: 2000,
        custoUnitario: 22.50,
        unidadesProducao: 1,
        categoria: "Food Service",
        estoqueMinimo: 5,
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
          
          // Recalcular custo parcial
          const componente = state.produtos[produtoIndex].componentes[componenteIndex];
          componente.custoParcial = componente.custo * quantidade;
          
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
        state.produtos[produtoIndex] = { ...state.produtos[produtoIndex], ...produto };
        
        // Update categoria field if categoriaId was changed
        if (produto.categoriaId) {
          // This is a simplified approach - in a real app, you'd fetch the category name from the category store
          const categoriaId = produto.categoriaId;
          if (categoriaId === 1) {
            state.produtos[produtoIndex].categoria = "Revenda Padrão";
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
