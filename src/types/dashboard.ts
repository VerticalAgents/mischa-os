
import { Cliente } from './cliente';

export type TipoAlerta = 
  | 'EstoqueAbaixoMinimo' 
  | 'ProximasEntregas' 
  | 'DeltaForaTolerancia' 
  | 'PedidoAgendado' 
  | 'PedidoPronto';

export interface Alerta {
  id: number;
  tipo: TipoAlerta;
  mensagem: string;
  dataAlerta: Date;
  lida: boolean;
  dados: Record<string, any>;
}

export interface DashboardData {
  contadoresStatus: {
    ativos: number;
    emAnalise: number;
    inativos: number;
    aAtivar: number;
    standby: number;
  };
  giroMedioSemanalPorPDV: {
    idCliente: number;
    nomeCliente: string;
    giroSemanal: number;
  }[];
  giroMedioSemanalGeral: number;
  previsaoGiroTotalSemanal: number;
  previsaoGiroTotalMensal: number;
}
