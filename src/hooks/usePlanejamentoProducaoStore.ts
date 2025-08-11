
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { PlanejamentoProducao, Pedido, Sabor, ItemPedido } from "../types";

// Interface for expanded PlanejamentoProducaoStore state
interface PlanejamentoProducaoState {
  planejamentos: PlanejamentoProducao[];
  periodoInicio: Date;
  periodoFim: Date;
  incluirPedidosPrevistos: boolean;
  percentualPrevistos: number;
  capacidadeForma: number;
  formasPorLote: number;
  retrospectivaDias: number;

  // Actions
  adicionarPlanejamento: (planejamento: Omit<PlanejamentoProducao, "id">) => void;
  atualizarPlanejamento: (id: number, status: 'Pendente' | 'Em Produção' | 'Concluído' | 'Cancelado', quantidades?: Record<number, number>) => void;
  removerPlanejamento: (id: number) => void;
  
  // Settings methods
  setPeriodo: (inicio: Date, fim: Date) => void;
  setIncluirPedidosPrevistos: (incluir: boolean) => void;
  setPercentualPrevistos: (percentual: number) => void;
  setCapacidadeForma: (capacidade: number) => void;
  setFormasPorLote: (formas: number) => void;
  setRetrospectivaDias: (dias: number) => void;
  
  // Calculation methods
  calcularPlanejamento: (pedidos: Pedido[], sabores: Sabor[]) => void;
  calcularNecessidadeFormas: (totalUnidades: number) => number;
  calcularTempoProducao: (totalUnidades: number) => { horas: number; minutos: number };
  calcularNecessidadeDiaria: (pedidos: Pedido[], sabores: Sabor[]) => any[];
  calcularRetrospectiva: (pedidos: Pedido[], sabores: Sabor[]) => any[];
  
  // Getters
  getPlanejamento: () => any[];
  getTotalFormasNecessarias: () => number;
  getTotalUnidadesAgendadas: () => number;
  getTotalLotesNecessarios: () => number;
  getNecessidadeDiaria: () => any[];
  getRetrospectiva: () => any[];
  getSobrasProducao: (estoqueAtual: Record<number, number>) => any[];
}

// Create the store
export const usePlanejamentoProducaoStore = create<PlanejamentoProducaoState>()(
  immer((set, get) => ({
    planejamentos: [
      {
        id: 1,
        dataPlanejamento: new Date(),
        dataProducao: new Date(new Date().setDate(new Date().getDate() + 1)),
        status: 'Pendente',
        itensPlanejamento: [
          { idSabor: 1, nomeSabor: 'Tradicional', quantidadePlanejada: 100 },
          { idSabor: 2, nomeSabor: 'Choco Duo', quantidadePlanejada: 150 },
          { idSabor: 5, nomeSabor: 'Avelã', quantidadePlanejada: 80 }
        ],
        observacoes: 'Planejamento para o fim de semana',
        totalUnidades: 330,
        // Additional properties
        totalUnidadesAgendadas: 330,
        formasNecessarias: 11
      }
    ],
    periodoInicio: new Date(),
    periodoFim: new Date(new Date().setDate(new Date().getDate() + 7)),
    incluirPedidosPrevistos: false,
    percentualPrevistos: 50,
    capacidadeForma: 30,
    formasPorLote: 10,
    retrospectivaDias: 30,
    
    // Action to add a new planning
    adicionarPlanejamento: (planejamento) => set(state => {
      const novoId = state.planejamentos.length > 0 
        ? Math.max(...state.planejamentos.map(p => p.id)) + 1 
        : 1;
      
      const totalUnidades = planejamento.itensPlanejamento.reduce(
        (total, item) => total + item.quantidadePlanejada, 0);
      
      const formasNecessarias = state.calcularNecessidadeFormas(totalUnidades);
      
      state.planejamentos.push({
        ...planejamento,
        id: novoId,
        totalUnidades,
        totalUnidadesAgendadas: totalUnidades,
        formasNecessarias
      });
    }),
    
    // Action to update an existing planning
    atualizarPlanejamento: (id, status, quantidades) => set(state => {
      const index = state.planejamentos.findIndex(p => p.id === id);
      if (index !== -1) {
        state.planejamentos[index].status = status;
        
        // If we have produced quantities, update the planning items
        if (quantidades) {
          state.planejamentos[index].itensPlanejamento.forEach(item => {
            if (quantidades[item.idSabor] !== undefined) {
              item.quantidadeProduzida = quantidades[item.idSabor];
            }
          });
        }
      }
    }),
    
    // Action to remove a planning
    removerPlanejamento: (id) => set(state => {
      state.planejamentos = state.planejamentos.filter(p => p.id !== id);
    }),
    
    // Setting methods
    setPeriodo: (inicio, fim) => set(state => {
      state.periodoInicio = inicio;
      state.periodoFim = fim;
    }),
    
    setIncluirPedidosPrevistos: (incluir) => set(state => {
      state.incluirPedidosPrevistos = incluir;
    }),
    
    setPercentualPrevistos: (percentual) => set(state => {
      state.percentualPrevistos = percentual;
    }),
    
    setCapacidadeForma: (capacidade) => set(state => {
      state.capacidadeForma = capacidade;
    }),
    
    setFormasPorLote: (formas) => set(state => {
      state.formasPorLote = formas;
    }),
    
    setRetrospectivaDias: (dias) => set(state => {
      state.retrospectivaDias = dias;
    }),
    
    // Calculation methods
    calcularNecessidadeFormas: (totalUnidades) => {
      const capacidade = get().capacidadeForma;
      return Math.ceil(totalUnidades / capacidade);
    },
    
    calcularTempoProducao: (totalUnidades) => {
      // Estimate: 1 minute per unit + 30 minutes of setup
      const minutosTotais = totalUnidades + 30;
      const horas = Math.floor(minutosTotais / 60);
      const minutos = minutosTotais % 60;
      return { horas, minutos };
    },
    
    calcularPlanejamento: (pedidos, sabores) => {
      const { periodoInicio, periodoFim, incluirPedidosPrevistos, percentualPrevistos } = get();
      
      // Filter orders in the selected period
      const pedidosNoPeriodo = pedidos.filter(pedido => {
        const dataPedido = new Date(pedido.dataPrevistaEntrega);
        return (
          (pedido.statusPedido === "Agendado" || 
          pedido.statusPedido === "Em Separação") &&
          !pedido.dataEfetivaEntrega &&
          dataPedido >= periodoInicio &&
          dataPedido <= periodoFim
        );
      });
      
      // Initialize counting structures
      const saboresTotais: Record<number, { 
        idSabor: number, 
        nomeSabor: string, 
        totalUnidades: number,
        formasNecessarias: number,
        percentualTotal: number,
        ativo: boolean // true if ordered in the last 30 days
      }> = {};
      
      // Initialize all flavors with zero
      sabores.forEach(sabor => {
        saboresTotais[sabor.id] = {
          idSabor: sabor.id,
          nomeSabor: sabor.nome,
          totalUnidades: 0,
          formasNecessarias: 0,
          percentualTotal: 0,
          ativo: false
        };
      });
      
      // Count units by flavor from orders
      let totalGeral = 0;
      
      // Count all ordered items
      pedidosNoPeriodo.forEach(pedido => {
        pedido.itensPedido.forEach(item => {
          if (!saboresTotais[item.idSabor]) return;
          
          saboresTotais[item.idSabor].totalUnidades += item.quantidadeSabor;
          saboresTotais[item.idSabor].ativo = true;
          totalGeral += item.quantidadeSabor;
        });
      });
      
      // If including forecasted orders (based on average distribution)
      if (incluirPedidosPrevistos) {
        // Calculate forecasted units based on percentage
        const pedidosPrevistos = pedidosNoPeriodo.length * (percentualPrevistos / 100);
        
        // Get active flavors for distribution
        const saboresAtivos = sabores.filter(s => s.ativo && s.percentualPadraoDist > 0);
        
        // Calculate total units forecasted
        const totalUnidadesPrevisao = Math.round(totalGeral * (percentualPrevistos / 100));
        
        // Distribute by standard percentage
        saboresAtivos.forEach(sabor => {
          const unidadesPrevisao = Math.round(totalUnidadesPrevisao * (sabor.percentualPadraoDist / 100));
          saboresTotais[sabor.id].totalUnidades += unidadesPrevisao;
          totalGeral += unidadesPrevisao;
        });
      }
      
      // Calculate percentages and forms needed
      Object.values(saboresTotais).forEach(item => {
        if (totalGeral > 0) {
          item.percentualTotal = (item.totalUnidades / totalGeral) * 100;
        }
        item.formasNecessarias = get().calcularNecessidadeFormas(item.totalUnidades);
      });
      
      // Create planning
      const novoId = get().planejamentos.length > 0 
        ? Math.max(...get().planejamentos.map(p => p.id)) + 1 
        : 1;
      
      // Create items for planning
      const itensPlanejamento = Object.values(saboresTotais)
        .filter(item => item.totalUnidades > 0)
        .map(item => ({
          idSabor: item.idSabor,
          nomeSabor: item.nomeSabor,
          quantidadePlanejada: item.totalUnidades
        }));
      
      // Create planning object
      const planejamento: PlanejamentoProducao = {
        id: novoId,
        dataPlanejamento: new Date(),
        dataProducao: new Date(periodoInicio),
        status: 'Pendente',
        itensPlanejamento,
        totalUnidades: totalGeral,
        totalUnidadesAgendadas: totalGeral,
        formasNecessarias: get().calcularNecessidadeFormas(totalGeral)
      };
      
      // Save planning
      set(state => {
        // Remove previous planning if exists
        state.planejamentos = state.planejamentos.filter(p => 
          p.dataProducao.getTime() !== planejamento.dataProducao.getTime()
        );
        
        // Add new planning
        state.planejamentos.push(planejamento);
      });
    },
    
    calcularNecessidadeDiaria: (pedidos, sabores) => {
      const { periodoInicio, periodoFim, incluirPedidosPrevistos, percentualPrevistos, capacidadeForma } = get();
      
      // Create a map of dates in the period
      const datas: Record<string, {
        data: Date,
        diaSemana: string,
        totalUnidades: number,
        sabores: Record<number, number>
      }> = {};
      
      // Initialize dates in the period
      let dataAtual = new Date(periodoInicio);
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      while (dataAtual <= periodoFim) {
        const dataStr = dataAtual.toISOString().split('T')[0]; // YYYY-MM-DD
        datas[dataStr] = {
          data: new Date(dataAtual),
          diaSemana: diasSemana[dataAtual.getDay()],
          totalUnidades: 0,
          sabores: {}
        };
        
        // Initialize all flavors with zero
        sabores.forEach(sabor => {
          datas[dataStr].sabores[sabor.id] = 0;
        });
        
        // Next day
        dataAtual = new Date(dataAtual);
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
      
      // Filter orders in the period
      const pedidosNoPeriodo = pedidos.filter(pedido => {
        const dataPedido = new Date(pedido.dataPrevistaEntrega);
        const dataStr = dataPedido.toISOString().split('T')[0];
        
        return (
          (pedido.statusPedido === "Agendado" || 
          pedido.statusPedido === "Em Separação") &&
          !pedido.dataEfetivaEntrega &&
          datas[dataStr] !== undefined
        );
      });
      
      // Count units by flavor and date
      pedidosNoPeriodo.forEach(pedido => {
        const dataPedido = new Date(pedido.dataPrevistaEntrega);
        const dataStr = dataPedido.toISOString().split('T')[0];
        
        if (!datas[dataStr]) return;
        
        pedido.itensPedido.forEach(item => {
          if (datas[dataStr].sabores[item.idSabor] !== undefined) {
            datas[dataStr].sabores[item.idSabor] += item.quantidadeSabor;
            datas[dataStr].totalUnidades += item.quantidadeSabor;
          }
        });
      });
      
      // If including forecasted orders
      if (incluirPedidosPrevistos) {
        // For each date, add forecasted units based on standard distribution
        Object.values(datas).forEach(dia => {
          const totalPrevisao = Math.round(dia.totalUnidades * (percentualPrevistos / 100));
          
          // Get active flavors for distribution
          const saboresAtivos = sabores.filter(s => s.ativo && s.percentualPadraoDist > 0);
          
          // Distribute forecasted units by standard percentage
          saboresAtivos.forEach(sabor => {
            const unidadesPrevisao = Math.round(totalPrevisao * (sabor.percentualPadraoDist / 100));
            dia.sabores[sabor.id] += unidadesPrevisao;
            dia.totalUnidades += unidadesPrevisao;
          });
        });
      }
      
      // Convert to array and sort by date
      return Object.values(datas).map(dia => ({
        ...dia,
        formasNecessarias: Math.ceil(dia.totalUnidades / capacidadeForma),
        saboresArray: Object.entries(dia.sabores).map(([idSabor, quantidade]) => ({
          idSabor: Number(idSabor),
          nomeSabor: sabores.find(s => s.id === Number(idSabor))?.nome || 'Desconhecido',
          quantidade
        }))
      })).sort((a, b) => a.data.getTime() - b.data.getTime());
    },
    
    calcularRetrospectiva: (pedidos, sabores) => {
      const { retrospectivaDias } = get();
      
      // Calculate the start date for retrospective
      const hoje = new Date();
      const inicioRetrospectiva = new Date(hoje);
      inicioRetrospectiva.setDate(inicioRetrospectiva.getDate() - retrospectivaDias);
      
      // Calculate the start date for the previous period (for comparison)
      const inicioPeriodoAnterior = new Date(inicioRetrospectiva);
      inicioPeriodoAnterior.setDate(inicioPeriodoAnterior.getDate() - retrospectivaDias);
      
      // Filter orders in the retrospective period
      const pedidosRetrospectiva = pedidos.filter(pedido => {
        const dataPedido = new Date(pedido.dataEfetivaEntrega || pedido.dataPrevistaEntrega);
        return (
          pedido.statusPedido === "Entregue" &&
          dataPedido >= inicioRetrospectiva &&
          dataPedido <= hoje
        );
      });
      
      // Filter orders in the previous period
      const pedidosPeriodoAnterior = pedidos.filter(pedido => {
        const dataPedido = new Date(pedido.dataEfetivaEntrega || pedido.dataPrevistaEntrega);
        return (
          pedido.statusPedido === "Entregue" &&
          dataPedido >= inicioPeriodoAnterior &&
          dataPedido < inicioRetrospectiva
        );
      });
      
      // Initialize counting structures
      const saboresRetrospectiva: Record<number, { 
        idSabor: number, 
        nomeSabor: string, 
        totalUnidades: number,
        formasNecessarias: number,
        percentualTotal: number,
        totalPeriodoAnterior: number,
        crescimento: number
      }> = {};
      
      // Initialize all flavors with zero
      sabores.forEach(sabor => {
        saboresRetrospectiva[sabor.id] = {
          idSabor: sabor.id,
          nomeSabor: sabor.nome,
          totalUnidades: 0,
          formasNecessarias: 0,
          percentualTotal: 0,
          totalPeriodoAnterior: 0,
          crescimento: 0
        };
      });
      
      // Count units in retrospective period
      let totalGeral = 0;
      
      pedidosRetrospectiva.forEach(pedido => {
        pedido.itensPedido.forEach(item => {
          if (!saboresRetrospectiva[item.idSabor]) return;
          
          const quantidadeEntregue = item.quantidadeEntregue || item.quantidadeSabor;
          saboresRetrospectiva[item.idSabor].totalUnidades += quantidadeEntregue;
          totalGeral += quantidadeEntregue;
        });
      });
      
      // Count units in previous period
      let totalGeralAnterior = 0;
      
      pedidosPeriodoAnterior.forEach(pedido => {
        pedido.itensPedido.forEach(item => {
          if (!saboresRetrospectiva[item.idSabor]) return;
          
          const quantidadeEntregue = item.quantidadeEntregue || item.quantidadeSabor;
          saboresRetrospectiva[item.idSabor].totalPeriodoAnterior += quantidadeEntregue;
          totalGeralAnterior += quantidadeEntregue;
        });
      });
      
      // Calculate percentages, growth and forms needed
      Object.values(saboresRetrospectiva).forEach(item => {
        // Calculate percentage
        if (totalGeral > 0) {
          item.percentualTotal = (item.totalUnidades / totalGeral) * 100;
        }
        
        // Calculate growth
        if (item.totalPeriodoAnterior > 0) {
          item.crescimento = ((item.totalUnidades - item.totalPeriodoAnterior) / item.totalPeriodoAnterior) * 100;
        } else if (item.totalUnidades > 0) {
          item.crescimento = 100; // 100% growth if previously zero
        }
        
        // Calculate forms needed
        item.formasNecessarias = get().calcularNecessidadeFormas(item.totalUnidades);
      });
      
      // Return as array, sorted by units
      return Object.values(saboresRetrospectiva)
        .sort((a, b) => b.totalUnidades - a.totalUnidades);
    },
    
    // Getter methods
    getPlanejamento: () => {
      // Get the most recent planning or create an empty one
      const planejamentos = get().planejamentos;
      const planejamento = planejamentos.length > 0 
        ? planejamentos[planejamentos.length - 1] 
        : null;
      
      if (!planejamento) return [];
      
      const { capacidadeForma } = get();
      
      // Format items for display
      return planejamento.itensPlanejamento.map(item => ({
        ...item,
        totalUnidadesAgendadas: item.quantidadePlanejada,
        formasNecessarias: Math.ceil(item.quantidadePlanejada / capacidadeForma)
      }));
    },
    
    getTotalFormasNecessarias: () => {
      const planejamentos = get().planejamentos;
      const planejamento = planejamentos.length > 0 
        ? planejamentos[planejamentos.length - 1] 
        : null;
      
      if (!planejamento) return 0;
      
      return planejamento.formasNecessarias || 0;
    },
    
    getTotalUnidadesAgendadas: () => {
      const planejamentos = get().planejamentos;
      const planejamento = planejamentos.length > 0 
        ? planejamentos[planejamentos.length - 1] 
        : null;
      
      if (!planejamento) return 0;
      
      return planejamento.totalUnidades || 0;
    },
    
    getTotalLotesNecessarios: () => {
      const formasNecessarias = get().getTotalFormasNecessarias();
      const formasPorLote = get().formasPorLote;
      
      return Math.ceil(formasNecessarias / formasPorLote);
    },
    
    getNecessidadeDiaria: () => {
      // This would require the actual orders and flavors to be passed in,
      // but for demo purposes, let's return a placeholder
      return [];
    },
    
    getRetrospectiva: () => {
      // This would require the actual orders and flavors to be passed in,
      // but for demo purposes, let's return a placeholder
      return [];
    },
    
    getSobrasProducao: (estoqueAtual) => {
      const planejamento = get().getPlanejamento();
      
      // Calculate surplus or deficit for each flavor
      return planejamento.map(item => {
        const estoque = estoqueAtual[item.idSabor] || 0;
        const saldo = estoque - item.totalUnidadesAgendadas;
        
        return {
          ...item,
          estoqueAtual: estoque,
          saldo,
          status: saldo >= 0 ? 'Sobra' : 'Déficit'
        };
      });
    }
  }))
);
