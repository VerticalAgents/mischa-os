import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Cliente } from '../types';
import { Channel, DREData, ChannelData, CostItem, InvestmentItem } from '../types/projections';
import { CustoFixo } from './useSupabaseCustosFixos';
import { CustoVariavel } from './useSupabaseCustosVariaveis';

interface ProjectionStore {
  baseDRE: DREData | null;
  scenarios: DREData[];
  activeScenarioId: string | null;
  clientChannels: Record<number, Channel>;
  
  // Actions
  setBaseDRE: (dreData: DREData) => void;
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

export const useProjectionStore = create<ProjectionStore>()(
  devtools(
    (set, get) => ({
      baseDRE: null,
      scenarios: [],
      activeScenarioId: 'base',
      clientChannels: {},
      
      setBaseDRE: (dreData) => {
        console.log('🔄 Definindo DRE Base no store:', dreData);
        set({ baseDRE: dreData });
      },
      
      createScenario: (name) => {
        const baseDRE = get().baseDRE;
        if (!baseDRE) return;
        
        const newScenario: DREData = {
          ...JSON.parse(JSON.stringify(baseDRE)),
          id: uuidv4(),
          name,
          isBase: false,
          createdAt: new Date(),
          includedClients: [],
          excludedClients: [],
          channelGrowthFactors: {
            'revendaPadraoFaturamento': { type: 'percentage', value: 0 },
            'foodServiceFaturamento': { type: 'percentage', value: 0 },
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
          ...JSON.parse(JSON.stringify(scenario)),
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
