
export type Channel = 'Delivery' | 'B2B' | 'Eventos' | 'Varejo' | 'B2B-Revenda' | 'B2B-FoodService' | 'B2C-UFCSPA' | 'B2C-Personalizados' | 'B2C-Outros';

export interface ProjectionParams {
  startDate: Date;
  endDate: Date;
  initialValue: number;
  growthRate: number;
  seasonality: boolean;
}

export interface ProjectionScenario {
  id: string;
  name: string;
  params: ProjectionParams;
  channels: {
    channel: Channel;
    percentage: number;
  }[];
  data: ProjectionData[];
}

export interface ProjectionData {
  month: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  channelRevenues: {
    channel: Channel;
    revenue: number;
  }[];
}

export interface DREData {
  id: string;
  name: string;
  totalRevenue: number;
  channelsData: {
    channel: Channel;
    revenue: number;
    percentage: number;
    volume?: number;
    variableCosts?: number;
    margin?: number;
    marginPercent?: number;
  }[];
  grossProfit?: number;
  grossMargin?: number;
  totalVariableCosts?: number;
  totalFixedCosts?: number;
  totalCosts?: number;
  fixedCosts?: CostItem[];
  totalAdministrativeCosts?: number;
  administrativeCosts?: CostItem[];
  operationalResult?: number;
  operationalMargin?: number;
  monthlyDepreciation?: number;
  ebitda?: number;
  ebitdaMargin?: number;
  totalInvestment?: number;
  paybackMonths?: number;
  breakEvenPoint?: number;
  channelGrowthFactors?: Record<string, { type: "percentage" | "absolute", value: number }>;
  investments?: InvestmentItem[];
}

export interface CostItem {
  name: string;
  value: number;
}

export interface InvestmentItem {
  name: string;
  value: number;
  depreciationMonths: number;
  depreciationYears?: number;
  monthlyDepreciation?: number;
}
