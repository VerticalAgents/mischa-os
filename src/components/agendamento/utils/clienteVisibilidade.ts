
/**
 * Verifica se um cliente deve ser visível no dashboard de agendamento.
 * Inclui clientes ativos, em Standby e A ativar. Exclui inativos.
 */
export const isClienteVisivelAgendamento = (cliente: { ativo?: boolean | null; statusCliente?: string | null }) => {
  if (cliente.statusCliente === 'INATIVO') return false;
  return cliente.ativo === true || 
    cliente.statusCliente === 'STANDBY' || 
    cliente.statusCliente === 'A_ATIVAR';
};
