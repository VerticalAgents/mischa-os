
/**
 * Verifica se um cliente deve ser visível no dashboard de agendamento.
 * Inclui clientes ativos, em Standby e A ativar. Exclui inativos.
 */
export const isClienteVisivelAgendamento = (cliente: { ativo?: boolean | null; statusCliente?: string | null }) => {
  if (cliente.statusCliente === 'Inativo') return false;
  return cliente.ativo === true || 
    cliente.statusCliente === 'Standby' || 
    cliente.statusCliente === 'A ativar';
};
