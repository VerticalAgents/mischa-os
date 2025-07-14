import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Cliente } from '../types';
import { Channel, DREData, ChannelData, CostItem, InvestmentItem } from '../types/projections';
import { CustoFixo } from './useSupabaseCustosFixos';
import { CustoVariavel } from './useSupabaseCustosVariaveis';
import { calculateDREFromRealData } from '@/services/dreCalculations';

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
      activeScenarioId: null,
      clientChannels: {},
      
      generateBaseDRE: async (clientes, custosFixos = [], custosVariaveis = []) => {
        console.log('🔄 Gerando DRE Base com dados reais...');
        console.log('Clientes recebidos:', clientes.length);
        console.log('Custos fixos recebidos:', custosFixos.length);
        console.log('Custos variáveis recebidos:', custosVariaveis.length);
        
        try {
          // Usar o novo sistema de cálculo
          const calculationResult = await calculateDREFromRealData(
            clientes,
            custosFixos,
            custosVariaveis
          );
          
          // Converter para formato DREData
          const channelsData: ChannelData[] = calculationResult.detalhesCalculos.faturamentoPorCategoria.map(cat => ({
            channel: mapCategoryToChannel(cat.categoria) as Channel,
            volume: 0,
            revenue: cat.faturamento,
            variableCosts: cat.custoInsumos,
            margin: cat.margem,
            marginPercent: cat.faturamento > 0 ? (cat.margem / cat.faturamento) * 100 : 0
          }));
          
          const baseDRE: DREData = {
            id: 'base',
            name: 'DRE Base (Dados Reais)',
            isBase: true,
            createdAt: new Date(),
            channelsData,
            fixedCosts: calculationResult.custosFixosDetalhados.map(c => ({ name: c.nome, value: c.valor })),
            administrativeCosts: calculationResult.custosAdministrativosDetalhados.map(c => ({ name: c.nome, value: c.valor })),
            investments: [], // Não usado no novo sistema
            totalRevenue: calculationResult.totalReceita,
            totalVariableCosts: calculationResult.totalCustosVariaveis,
            totalFixedCosts: calculationResult.totalCustosFixos,
            totalAdministrativeCosts: calculationResult.totalCustosAdministrativos,
            totalCosts: calculationResult.totalCustosVariaveis + calculationResult.totalCustosFixos + calculationResult.totalCustosAdministrativos,
            grossProfit: calculationResult.totalReceita - calculationResult.totalCustosVariaveis,
            grossMargin: calculationResult.margemBruta,
            operationalResult: calculationResult.lucroOperacional,
            operationalMargin: calculationResult.margemOperacional,
            totalInvestment: 0,
            monthlyDepreciation: 0,
            ebitda: calculationResult.ebitda,
            ebitdaMargin: calculationResult.totalReceita > 0 ? (calculationResult.ebitda / calculationResult.totalReceita) * 100 : 0,
            breakEvenPoint: calculationResult.pontoEquilibrio,
            paybackMonths: 0,
            detailedBreakdown: {
              revendaPadraoFaturamento: calculationResult.receitaRevendaPadrao,
              foodServiceFaturamento: calculationResult.receitaFoodService,
              totalInsumosRevenda: calculationResult.custosInsumos * (calculationResult.receitaRevendaPadrao / calculationResult.totalReceita),
              totalInsumosFoodService: calculationResult.custosInsumos * (calculationResult.receitaFoodService / calculationResult.totalReceita),
              totalLogistica: calculationResult.custosLogisticos,
              aquisicaoClientes: calculationResult.custosAquisicaoClientes
            }
          };
          
          console.log('✅ DRE Base gerada com sucesso:', baseDRE);
          
          // Initialize client channels
          const clientChannels = { ...get().clientChannels };
          const activeClientes = clientes.filter(c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio);
          
          activeClientes.forEach(cliente => {
            if (!clientChannels[cliente.id]) {
              clientChannels[cliente.id] = assignDefaultChannel(cliente);
            }
          });
          
          set({
            baseDRE,
            clientChannels
          });
          
        } catch (error) {
          console.error('❌ Erro ao gerar DRE Base:', error);
          // Fallback para o sistema antigo em caso de erro
          set({
            baseDRE: null
          });
        }
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

// Helper para mapear categorias para canais
const mapCategoryToChannel = (category: string): string => {
  switch (category) {
    case 'revenda padrão': return 'B2B-Revenda';
    case 'food service': return 'B2B-FoodService';
    case 'ufcspa': return 'B2C-UFCSPA';
    case 'personalizados': return 'B2C-Personalizados';
    case 'outros': return 'B2C-Outros';
    default: return 'B2C-Outros';
  }
};
