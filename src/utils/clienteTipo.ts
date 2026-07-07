import type { Cliente } from '@/types';

/**
 * Blindagem Private-Label: clientes puramente industriais (tipo_cliente = 'INDUSTRIAL')
 * NÃO devem aparecer em telas operacionais da Mischa's (agendamento, expedição, giro,
 * DRE, faturamento médio por PDV, indicadores de PDV, faturamento por representante).
 *
 * Clientes 'PDV' e 'AMBOS' são considerados operacionais.
 */
export const isClienteOperacional = (
  c: { tipoCliente?: string | null } | null | undefined
): boolean => {
  if (!c) return false;
  const tipo = c.tipoCliente ?? 'PDV';
  return tipo !== 'INDUSTRIAL';
};

export const isClienteIndustrialPuro = (
  c: { tipoCliente?: string | null } | null | undefined
): boolean => {
  return (c?.tipoCliente ?? 'PDV') === 'INDUSTRIAL';
};

/** Filtra uma lista de clientes removendo os industriais puros. */
export const apenasOperacionais = <T extends { tipoCliente?: string | null }>(
  clientes: T[]
): T[] => clientes.filter(isClienteOperacional);

/** Predicado para linhas cruas do banco (usa snake_case). */
export const isRowClienteOperacional = (
  row: { tipo_cliente?: string | null } | null | undefined
): boolean => {
  if (!row) return false;
  const tipo = row.tipo_cliente ?? 'PDV';
  return tipo !== 'INDUSTRIAL';
};