
/**
 * Verifica se um cliente deve ser visível no dashboard de agendamento.
 * Inclui clientes ativos E clientes em Standby. Exclui inativos.
 */
export const isClienteVisivelAgendamento = (cliente: { ativo?: boolean | null; statusCliente?: string | null }) => {
  if (cliente.statusCliente === 'Inativo') return false;
  return cliente.ativo === true || cliente.statusCliente === 'Standby';
};
