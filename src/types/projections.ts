
export type Channel = 'Delivery' | 'B2B' | 'Eventos' | 'Varejo';

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
  }[];
}
