
import { AgendamentoCliente } from './types';

export const convertDbRowToAgendamento = (row: any): AgendamentoCliente => {
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    tipo_pedido: row.tipo_pedido || 'Padrão',
    status_agendamento: row.status_agendamento || 'Agendar',
    data_proxima_reposicao: row.data_proxima_reposicao ? new Date(row.data_proxima_reposicao) : undefined,
    quantidade_total: row.quantidade_total || 0,
    itens_personalizados: row.itens_personalizados || null,
    substatus_pedido: row.substatus_pedido,
    contatar_cliente: row.contatar_cliente || false,
    created_at: row.created_at ? new Date(row.created_at) : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
  };
};

export const convertToAgendamentoItem = (agendamento: any, cliente: any) => {
  const clienteFormatado = {
    id: parseInt(cliente.id) || 0,
    nome: cliente.nome || '',
    contatoNome: cliente.contato_nome,
    contatoTelefone: cliente.contato_telefone,
    quantidadePadrao: cliente.quantidade_padrao || agendamento.quantidade_total || 0
  };

  // Determinar se é pedido único baseado na presença de agendamento
  const isPedidoUnico = !agendamento || agendamento.status_agendamento === 'Agendar';

  return {
    cliente: clienteFormatado,
    pedido: agendamento ? {
      id: agendamento.id,
      tipoPedido: agendamento.tipo_pedido || 'Padrão',
      totalPedidoUnidades: agendamento.quantidade_total || clienteFormatado.quantidadePadrao,
      statusPedido: agendamento.substatus_pedido || 'Pendente',
      contatar_cliente: agendamento.contatar_cliente || false
    } : undefined,
    dataReposicao: agendamento?.data_proxima_reposicao 
      ? new Date(agendamento.data_proxima_reposicao) 
      : new Date(),
    statusAgendamento: agendamento?.status_agendamento || 'Agendar',
    substatus_pedido: agendamento?.substatus_pedido,
    isPedidoUnico,
    contatar_cliente: agendamento?.contatar_cliente || false
  };
};

export const convertAgendamentoToDbFormat = (agendamento: Partial<AgendamentoCliente>) => {
  const dbData: any = {};
  
  if (agendamento.tipo_pedido !== undefined) {
    dbData.tipo_pedido = agendamento.tipo_pedido;
  }
  
  if (agendamento.status_agendamento !== undefined) {
    dbData.status_agendamento = agendamento.status_agendamento;
  }
  
  if (agendamento.data_proxima_reposicao !== undefined) {
    dbData.data_proxima_reposicao = agendamento.data_proxima_reposicao instanceof Date 
      ? agendamento.data_proxima_reposicao.toISOString().split('T')[0]
      : agendamento.data_proxima_reposicao;
  }
  
  if (agendamento.quantidade_total !== undefined) {
    dbData.quantidade_total = agendamento.quantidade_total;
  }
  
  if (agendamento.itens_personalizados !== undefined) {
    dbData.itens_personalizados = agendamento.itens_personalizados;
  }
  
  if (agendamento.substatus_pedido !== undefined) {
    dbData.substatus_pedido = agendamento.substatus_pedido;
  }

  if (agendamento.contatar_cliente !== undefined) {
    dbData.contatar_cliente = agendamento.contatar_cliente;
  }
  
  return dbData;
};
