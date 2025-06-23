

import { Cliente } from './index';

export type Channel = 'B2B-Revenda' | 'B2B-FoodService' | 'B2C-UFCSPA' | 'B2C-Personalizados' | 'B2C-Outros';

export interface ClienteChannel {
  idCliente: number;
  channel: Channel;
}

export interface ChannelData {
  channel: Channel;
  volume: number;
  revenue: number;
  variableCosts: number;
  margin: number;
  marginPercent: number;
}

export interface CostItem {
  name: string;
  value: number;
  isPercentage?: boolean;
}

export interface InvestmentItem {
  name: string;
  value: number;
  depreciationYears: number;
  monthlyDepreciation: number;
}

export interface DetailedBreakdown {
  revendaPadraoFaturamento: number;
  foodServiceFaturamento: number;
  totalInsumosRevenda: number;
  totalInsumosFoodService: number;
  totalLogistica: number;
  aquisicaoClientes: number;
}

export interface DREData {
  id: string;
  name: string;
  isBase: boolean;
  createdAt: Date;
  channelsData: ChannelData[];
  fixedCosts: CostItem[];
  administrativeCosts: CostItem[];
  investments: InvestmentItem[];
  // Calculated fields
  totalRevenue: number;
  totalVariableCosts: number;
  totalFixedCosts: number;
  totalAdministrativeCosts: number;
  totalCosts: number;
  grossProfit: number;
  grossMargin: number;
  operationalResult: number;
  operationalMargin: number;
  totalInvestment: number;
  monthlyDepreciation: number;
  ebitda: number;
  ebitdaMargin: number;
  breakEvenPoint: number;
  paybackMonths: number;
  // Included/excluded clients for scenarios
  includedClients?: number[];
  excludedClients?: number[];
  // Growth factors for scenarios
  channelGrowthFactors?: Record<Channel, { type: 'percentage' | 'absolute', value: number }>;
  // Detailed breakdown for DRE display
  detailedBreakdown?: DetailedBreakdown;
}

