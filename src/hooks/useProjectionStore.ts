
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Cliente, DiaSemana } from '../types';
import { Channel, DREData, ChannelData, CostItem, InvestmentItem } from '../types/projections';

interface ProjectionStore {
  baseDRE: DREData | null;
  scenarios: DREData[];
  activeScenarioId: string | null;
  clientChannels: Record<number, Channel>;
  
  // Actions
  generateBaseDRE: (clientes: Cliente[]) => void;
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

// Default fixed costs
const defaultFixedCosts: CostItem[] = [
  { name: 'Aluguel', value: 3000 },
  { name: 'Energia', value: 1200 },
  { name: 'Água', value: 400 },
  { name: 'Internet/Telefone', value: 300 },
  { name: 'Manutenção', value: 500 },
];

// Default administrative costs
const defaultAdminCosts: CostItem[] = [
  { name: 'Folha de Pagamento', value: 12000 },
  { name: 'Pró-labore', value: 5000 },
  { name: 'Contabilidade', value: 800 },
  { name: 'Software/Sistemas', value: 400 },
  { name: 'Marketing', value: 1500 },
];

// Default investments
const defaultInvestments: InvestmentItem[] = [
  { name: 'Equipamentos de Produção', value: 50000, depreciationYears: 10, monthlyDepreciation: 416.67 },
  { name: 'Reformas', value: 20000, depreciationYears: 5, monthlyDepreciation: 333.33 },
  { name: 'Veículos', value: 40000, depreciationYears: 5, monthlyDepreciation: 666.67 },
];

// Helper function to assign default channels based on client characteristics
const assignDefaultChannel = (cliente: Cliente): Channel => {
  // Simple logic to assign channels based on client characteristics
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
  // Calculate weekly volume based on client's standard quantity and periodicity
  return cliente.quantidadePadrao * (7 / cliente.periodicidadePadrao);
};

// Helper to calculate monthly volume
const weeklyToMonthly = (weekly: number): number => weekly * 4.33;

export const useProjectionStore = create<ProjectionStore>()(
  devtools(
    (set, get) => ({
      baseDRE: null,
      scenarios: [],
      activeScenarioId: null,
      clientChannels: {},
      
      generateBaseDRE: (clientes) => {
        // Filter active clients that should be counted in average
        const activeClientes = clientes.filter(
          c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio
        );
        
        // Initialize client channels if not set
        const clientChannels = { ...get().clientChannels };
        activeClientes.forEach(cliente => {
          if (!clientChannels[cliente.id]) {
            clientChannels[cliente.id] = assignDefaultChannel(cliente);
          }
        });
        
        // Calculate volumes and group by channels
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
        
        // Calculate revenue, costs and margins for each channel
        const channelsData: ChannelData[] = Object.entries(channelVolumes).map(([channel, weeklyVolume]) => {
          const monthlyVolume = weeklyToMonthly(weeklyVolume);
          
          // Different pricing for different channels
          let unitPrice = 0;
          let unitCost = 0;
          
          switch (channel) {
            case 'B2B-Revenda':
              unitPrice = 4.50;  // Wholesale price
              unitCost = 2.00;   // Unit cost for wholesale
              break;
            case 'B2B-FoodService':
              unitPrice = 5.00;  // Food service price
              unitCost = 2.20;   // Unit cost for food service
              break;
            case 'B2C-UFCSPA':
              unitPrice = 5.50;  // Direct consumer price (UFCSPA)
              unitCost = 2.30;   // Unit cost
              break;
            case 'B2C-Personalizados':
              unitPrice = 6.00;  // Customized products price
              unitCost = 2.50;   // Unit cost for customized
              break;
            case 'B2C-Outros':
              unitPrice = 5.50;  // Other B2C price
              unitCost = 2.30;   // Unit cost for other B2C
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
        
        // Calculate totals
        const totalRevenue = channelsData.reduce((sum, c) => sum + c.revenue, 0);
        const totalVariableCosts = channelsData.reduce((sum, c) => sum + c.variableCosts, 0);
        const totalFixedCosts = defaultFixedCosts.reduce((sum, c) => sum + c.value, 0);
        const totalAdministrativeCosts = defaultAdminCosts.reduce((sum, c) => sum + c.value, 0);
        const totalCosts = totalVariableCosts + totalFixedCosts + totalAdministrativeCosts;
        const grossProfit = totalRevenue - totalVariableCosts;
        const grossMargin = grossProfit / totalRevenue * 100;
        const operationalResult = grossProfit - totalFixedCosts - totalAdministrativeCosts;
        const operationalMargin = operationalResult / totalRevenue * 100;
        
        const totalInvestment = defaultInvestments.reduce((sum, inv) => sum + inv.value, 0);
        const monthlyDepreciation = defaultInvestments.reduce((sum, inv) => sum + inv.monthlyDepreciation, 0);
        const ebitda = operationalResult + monthlyDepreciation;
        const ebitdaMargin = ebitda / totalRevenue * 100;
        
        // Break-even point calculation (monthly fixed costs / contribution margin percentage)
        const contributionMarginPercent = grossMargin / 100;
        const breakEvenPoint = (totalFixedCosts + totalAdministrativeCosts) / contributionMarginPercent;
        
        // Payback calculation in months (total investment / monthly operational result)
        const paybackMonths = operationalResult > 0 ? totalInvestment / operationalResult : 0;
        
        const baseDRE: DREData = {
          id: 'base',
          name: 'DRE Base',
          isBase: true,
          createdAt: new Date(),
          channelsData,
          fixedCosts: [...defaultFixedCosts],
          administrativeCosts: [...defaultAdminCosts],
          investments: [...defaultInvestments],
          totalRevenue,
          totalVariableCosts,
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
          paybackMonths
        };
        
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
