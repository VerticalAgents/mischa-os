import { addDays } from 'date-fns';
import { registrarReagendamentoEntreSemanas } from './reagendamentoUtils';

/**
 * Adia um agendamento em N dias (default 7), mantendo o status "Previsto"
 * e preservando todos os demais dados do pedido.
 */
export async function adiarAgendamentoDias(
  clienteId: string,
  obterAgendamento: (clienteId: string) => Promise<any>,
  salvarAgendamento: (clienteId: string, dados: any) => Promise<any>,
  dias: number = 7
): Promise<Date | null> {
  const atual = await obterAgendamento(clienteId);
  if (!atual) return null;

  const raw = atual.data_proxima_reposicao;
  const dataOriginal = raw
    ? new Date(typeof raw === 'string' && raw.length === 10 ? `${raw}T12:00:00` : raw)
    : new Date();
  const novaData = addDays(dataOriginal, dias);

  await registrarReagendamentoEntreSemanas(clienteId, dataOriginal, novaData);

  await salvarAgendamento(clienteId, {
    data_proxima_reposicao: novaData,
    status_agendamento: 'Previsto',
    tipo_pedido: atual.tipo_pedido,
    quantidade_total: atual.quantidade_total,
    itens_personalizados: atual.itens_personalizados,
  });

  return novaData;
}
