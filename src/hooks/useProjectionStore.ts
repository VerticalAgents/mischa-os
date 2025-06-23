import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Cliente, DiaSemana } from '../types';
import { Channel, DREData, ChannelData, CostItem, InvestmentItem } from '../types/projections';
import { CustoFixo } from './useSupabaseCustosFixos';
import { CustoVariavel } from './useSupabaseCustosVariaveis';

interface ProjectionStore {
  baseDRE: DREData | null;
  scenarios: DREData[];
  activeScenarioId: string | null;
  clientChannels: Record<number, Channel>;
  
  // Actions
  generateBaseDRE: (clientes: Cliente[], custosFixos?: CustoFixo[], custosVariaveis?: CustoVariavel[]) => void;
  createScenario: (name: string) => void;
  duplicateScenario: (id: string) => void;
  updateScenario: (id: string, data: Partial<DREData>) => void;
  deleteScenario: (id: string) => void;
  setActiveScenario: (id: string | null) => void;
  setClientChannel: (clienteId: number, channel: Channel) => void;
  
  // Getters
  getBaseDRE: () => DREData | null;
  getScenarios: () => DREData[];
  getActiveScenario: () => DREData | null;
  getClientChannel: (clienteId: number) => Channel;
}

// Helper function to convert frequency to monthly value
const convertToMonthlyValue = (value: number, frequency: string): number => {
  switch (frequency) {
    case 'semanal': return value * 4.33;
    case 'trimestral': return value / 3;
    case 'semestral': return value / 6;
    case 'anual': return value / 12;
    case 'mensal':
    default: return value;
  }
};

// Helper function to assign default channels based on client characteristics
const assignDefaultChannel = (cliente: Cliente): Channel => {
  if (cliente.tipoLogistica === 'Distribuição') {
    return 'B2B-Revenda';
  } else if (cliente.nome.includes('UFCSPA')) {
    return 'B2C-UFCSPA';
  } else if (cliente.nome.toLowerCase().includes('personalizado')) {
    return 'B2C-Personalizados';
  } else if (cliente.quantidadePadrao > 50) {
    return 'B2B-FoodService';
  } else {
    return 'B2C-Outros';
  }
};

// Helper function to calculate weekly volume for a client
const calculateWeeklyVolume = (cliente: Cliente): number => {
  return cliente.quantidadePadrao * (7 / cliente.periodicidadePadrao);
};

// Helper to calculate monthly volume
const weeklyToMonthly = (weekly: number): number => weekly * 4.33;

// Helper to categorize client by name/characteristics for DRE calculations
const getClientCategory = (cliente: Cliente): 'revenda padrão' | 'food service' => {
  const nome = cliente.nome.toLowerCase();
  if (nome.includes('food service') || nome.includes('restaurante') || nome.includes('lanchonete') || cliente.quantidadePadrao > 50) {
    return 'food service';
  }
  return 'revenda padrão';
};

export const useProjectionStore = create<ProjectionStore>()(
  devtools(
    (set, get) => ({
      baseDRE: null,
      scenarios: [],
      activeScenarioId: null,
      clientChannels: {},
      
      generateBaseDRE: (clientes, custosFixos = [], custosVariaveis = []) => {
        console.log('Generating Base DRE with clients:', clientes.length);
        
        // Filter active clients that should be counted in average
        const activeClientes = clientes.filter(
          c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio
        );
        
        console.log('Active clients for DRE:', activeClientes.length);
        
        // Initialize client channels if not set
        const clientChannels = { ...get().clientChannels };
        activeClientes.forEach(cliente => {
          if (!clientChannels[cliente.id]) {
            clientChannels[cliente.id] = assignDefaultChannel(cliente);
          }
        });
        
        // Calculate values by client category using exact PDV projection logic
        let revendaPadraoFaturamento = 0;
        let revendaPadraoCusto = 0;
        let foodServiceFaturamento = 0;
        let foodServiceCusto = 0;
        let totalLogistica = 0;
        
        activeClientes.forEach(cliente => {
          const categoria = getClientCategory(cliente);
          const giroSemanal = calculateWeeklyVolume(cliente);
          const faturamentoMensal = giroSemanal * 4.33;
          
          // Different pricing for different categories (same as PDV projection)
          let precoMedio = 0;
          if (categoria === 'food service') {
            precoMedio = 70.00;
          } else {
            precoMedio = 4.50;
          }
          
          const faturamento = faturamentoMensal * precoMedio;
          
          // Calculate input costs using the same logic as PDV projection
          const custoUnitario = categoria === 'food service' ? 29.17 : 1.32;
          const custoInsumos = faturamentoMensal * custoUnitario;
          
          if (categoria === 'revenda padrão') {
            revendaPadraoFaturamento += faturamento;
            revendaPadraoCusto += custoInsumos;
          } else {
            foodServiceFaturamento += faturamento;
            foodServiceCusto += custoInsumos;
          }
          
          // Calculate logistics costs based on client type
          let percentualLogistico = 0;
          if (cliente.tipoLogistica === 'Distribuição') {
            percentualLogistico = 0.08; // 8%
          } else if (cliente.tipoLogistica === 'Própria') {
            percentualLogistico = 0.03; // 3%
          } else {
            percentualLogistico = 0.05; // 5%
          }
          totalLogistica += faturamento * percentualLogistico;
        });
        
        // Calculate totals matching PDV projection exactly
        const totalReceita = revendaPadraoFaturamento + foodServiceFaturamento;
        const totalInsumosRevenda = revendaPadraoCusto;
        const totalInsumosFoodService = foodServiceCusto;
        const totalInsumos = totalInsumosRevenda + totalInsumosFoodService;
        
        // Calculate acquisition costs (8% of total revenue)
        const aquisicaoClientes = totalReceita * 0.08;
        
        // Calculate totals for DRE structure
        const totalVariableCosts = totalInsumos + totalLogistica + aquisicaoClientes;
        
        console.log('DRE Calculated Values:', {
          totalReceita,
          revendaPadraoFaturamento,
          foodServiceFaturamento,
          totalInsumos,
          totalInsumosRevenda,
          totalInsumosFoodService,
          totalLogistica,
          aquisicaoClientes,
          totalVariableCosts
        });
        
        // Calculate volumes and group by channels for compatibility
        const channelVolumes: Record<Channel, number> = {
          'B2B-Revenda': 0,
          'B2B-FoodService': 0,
          'B2C-UFCSPA': 0,
          'B2C-Personalizados': 0,
          'B2C-Outros': 0
        };
        
        activeClientes.forEach(cliente => {
          const channel = clientChannels[cliente.id];
          channelVolumes[channel] += calculateWeeklyVolume(cliente);
        });
        
        // Calculate revenue, costs and margins for each channel (for compatibility)
        const channelsData: ChannelData[] = Object.entries(channelVolumes).map(([channel, weeklyVolume]) => {
          const monthlyVolume = weeklyToMonthly(weeklyVolume);
          
          // Different pricing for different channels
          let unitPrice = 0;
          let unitCost = 0;
          
          switch (channel) {
            case 'B2B-Revenda':
              unitPrice = 4.50;
              unitCost = 1.32;
              break;
            case 'B2B-FoodService':
              unitPrice = 70.00;
              unitCost = 29.17;
              break;
            case 'B2C-UFCSPA':
              unitPrice = 5.50;
              unitCost = 2.30;
              break;
            case 'B2C-Personalizados':
              unitPrice = 6.00;
              unitCost = 2.50;
              break;
            case 'B2C-Outros':
              unitPrice = 5.50;
              unitCost = 2.30;
              break;
          }
          
          const revenue = monthlyVolume * unitPrice;
          const variableCosts = monthlyVolume * unitCost;
          const margin = revenue - variableCosts;
          const marginPercent = margin / revenue * 100;
          
          return {
            channel: channel as Channel,
            volume: monthlyVolume,
            revenue,
            variableCosts,
            margin,
            marginPercent
          };
        });
        
        // Convert real fixed costs from database
        const fixedCosts: CostItem[] = custosFixos.map(custo => ({
          name: custo.nome,
          value: convertToMonthlyValue(custo.valor, custo.frequencia)
        }));
        
        // Convert real variable costs from database (administrative costs)
        const administrativeCosts: CostItem[] = custosVariaveis.map(custo => ({
          name: custo.nome,
          value: convertToMonthlyValue(custo.valor, custo.frequencia)
        }));
        
        // Default investments (keeping these as before since they're not in database yet)
        const defaultInvestments: InvestmentItem[] = [
          { name: 'Equipamentos de Produção', value: 50000, depreciationYears: 10, monthlyDepreciation: 416.67 },
          { name: 'Reformas', value: 20000, depreciationYears: 5, monthlyDepreciation: 333.33 },
          { name: 'Veículos', value: 40000, depreciationYears: 5, monthlyDepreciation: 666.67 },
        ];
        
        // Calculate totals using corrected values
        const totalRevenue = totalReceita; // This MUST be R$ 36.246,00
        const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + c.value, 0);
        const totalAdministrativeCosts = administrativeCosts.reduce((sum, c) => sum + c.value, 0);
        const totalCosts = totalVariableCosts + totalFixedCosts + totalAdministrativeCosts;
        const grossProfit = totalRevenue - totalVariableCosts;
        const grossMargin = grossProfit / totalRevenue * 100;
        const operationalResult = grossProfit - totalFixedCosts - totalAdministrativeCosts;
        const operationalMargin = operationalResult / totalRevenue * 100;
        
        const totalInvestment = defaultInvestments.reduce((sum, inv) => sum + inv.value, 0);
        const monthlyDepreciation = defaultInvestments.reduce((sum, inv) => sum + inv.monthlyDepreciation, 0);
        const ebitda = operationalResult + monthlyDepreciation;
        const ebitdaMargin = ebitda / totalRevenue * 100;
        
        // Break-even point calculation
        const contributionMarginPercent = grossMargin / 100;
        const breakEvenPoint = (totalFixedCosts + totalAdministrativeCosts) / contributionMarginPercent;
        
        // Payback calculation in months
        const paybackMonths = operationalResult > 0 ? totalInvestment / operationalResult : 0;
        
        const baseDRE: DREData = {
          id: 'base',
          name: 'DRE Base',
          isBase: true,
          createdAt: new Date(),
          channelsData,
          fixedCosts,
          administrativeCosts,
          investments: defaultInvestments,
          totalRevenue, // This should be R$ 36.246,00
          totalVariableCosts, // This should be R$ 12.807,48
          totalFixedCosts,
          totalAdministrativeCosts,
          totalCosts,
          grossProfit,
          grossMargin,
          operationalResult,
          operationalMargin,
          totalInvestment,
          monthlyDepreciation,
          ebitda,
          ebitdaMargin,
          breakEvenPoint,
          paybackMonths,
          // Adding detailed breakdown for DRE display
          detailedBreakdown: {
            revendaPadraoFaturamento, // Should be R$ 30.366,00
            foodServiceFaturamento, // Should be R$ 5.880,00
            totalInsumosRevenda, // Should be R$ 8.907,36
            totalInsumosFoodService, // Should be R$ 2.450,28
            totalLogistica, // Should be R$ 1.449,84
            aquisicaoClientes // Should be R$ 2.899,68
          }
        };
        
        console.log('Final DRE Base:', baseDRE);
        
        set({
          baseDRE,
          clientChannels
        });
      },
      
      createScenario: (name) => {
        const baseDRE = get().baseDRE;
        if (!baseDRE) return;
        
        const newScenario: DREData = {
          ...JSON.parse(JSON.stringify(baseDRE)), // Deep copy
          id: uuidv4(),
          name,
          isBase: false,
          createdAt: new Date(),
          includedClients: [],
          excludedClients: [],
          channelGrowthFactors: {
            'B2B-Revenda': { type: 'percentage', value: 0 },
            'B2B-FoodService': { type: 'percentage', value: 0 },
            'B2C-UFCSPA': { type: 'percentage', value: 0 },
            'B2C-Personalizados': { type: 'percentage', value: 0 },
            'B2C-Outros': { type: 'percentage', value: 0 }
          }
        };
        
        set(state => ({
          scenarios: [...state.scenarios, newScenario],
          activeScenarioId: newScenario.id
        }));
      },
      
      duplicateScenario: (id) => {
        const scenario = [get().baseDRE, ...get().scenarios].find(s => s?.id === id);
        if (!scenario) return;
        
        const newScenario: DREData = {
          ...JSON.parse(JSON.stringify(scenario)), // Deep copy
          id: uuidv4(),
          name: `${scenario.name} (Cópia)`,
          isBase: false,
          createdAt: new Date()
        };
        
        set(state => ({
          scenarios: [...state.scenarios, newScenario],
          activeScenarioId: newScenario.id
        }));
      },
      
      updateScenario: (id, data) => {
        if (id === 'base') {
          set(state => ({
            baseDRE: state.baseDRE ? { ...state.baseDRE, ...data } : null
          }));
          return;
        }
        
        set(state => ({
          scenarios: state.scenarios.map(scenario => 
            scenario.id === id ? { ...scenario, ...data } : scenario
          )
        }));
      },
      
      deleteScenario: (id) => {
        set(state => {
          const newScenarios = state.scenarios.filter(s => s.id !== id);
          const newActiveId = state.activeScenarioId === id
            ? (newScenarios.length > 0 ? newScenarios[0].id : 'base')
            : state.activeScenarioId;
            
          return {
            scenarios: newScenarios,
            activeScenarioId: newActiveId
          };
        });
      },
      
      setActiveScenario: (id) => {
        set({ activeScenarioId: id });
      },
      
      setClientChannel: (clienteId, channel) => {
        set(state => ({
          clientChannels: {
            ...state.clientChannels,
            [clienteId]: channel
          }
        }));
      },
      
      getBaseDRE: () => get().baseDRE,
      
      getScenarios: () => get().scenarios,
      
      getActiveScenario: () => {
        const { activeScenarioId, baseDRE, scenarios } = get();
        if (activeScenarioId === 'base' || activeScenarioId === null) return baseDRE;
        return scenarios.find(s => s.id === activeScenarioId) || baseDRE;
      },
      
      getClientChannel: (clienteId) => get().clientChannels[clienteId] || 'B2C-Outros'
    }),
    { name: 'projection-store' }
  )
);
