
import { Cliente } from './cliente';
import { TipoPedido } from './pedido';

// Export data for export functionality
export interface ClienteExportacao extends Cliente {
  statusConfirmacao?: string;
  dataReposicao?: Date;
  tipoPedido?: TipoPedido;
  observacoes?: string;
}
