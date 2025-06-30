import { AgendamentoCliente } from './types';
import { AgendamentoItem } from '@/components/agendamento/types';

// Função para converter data do banco preservando o valor local
export const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // Para strings no formato YYYY-MM-DD, forçar interpretação como horário local
  if (dateString.includes('-') && dateString.length === 10) {
    const [ano, mes, dia] = dateString.split('-');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  }
  
  // Para outros formatos, usar o padrão
  return new Date(dateString);
};

// Helper function to convert database row to AgendamentoCliente
export const convertDbRowToAgendamento = (row: any): AgendamentoCliente => {
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    tipo_pedido: row.tipo_pedido as 'Padrão' | 'Alterado',
    status_agendamento: row.status_agendamento as 'Agendar' | 'Previsto' | 'Agendado',
    data_proxima_reposicao: row.data_proxima_reposicao ? parseLocalDate(row.data_proxima_reposicao) : undefined,
    quantidade_total: row.quantidade_total,
    itens_personalizados: row.itens_personalizados as { produto: string; quantidade: number }[] | undefined,
    substatus_pedido: row.substatus_pedido,
    created_at: row.created_at ? new Date(row.created_at) : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
  };
};

export const convertToAgendamentoItem = (agendamento: any, cliente: any): AgendamentoItem => {
  return {
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      cnpjCpf: cliente.cnpj_cpf,
      enderecoEntrega: cliente.endereco_entrega,
      contatoNome: cliente.contato_nome,
      contatoTelefone: cliente.contato_telefone,
      contatoEmail: cliente.contato_email,
      quantidadePadrao: cliente.quantidade_padrao || 0,
      periodicidadePadrao: cliente.periodicidade_padrao || 7,
      statusCliente: cliente.status_cliente || 'Ativo',
      dataCadastro: new Date(cliente.created_at),
      metaGiroSemanal: cliente.meta_giro_semanal,
      ultimaDataReposicaoEfetiva: cliente.ultima_data_reposicao_efetiva ? parseLocalDate(cliente.ultima_data_reposicao_efetiva) : undefined,
      statusAgendamento: agendamento.status_agendamento,
      proximaDataReposicao: agendamento.data_proxima_reposicao ? parseLocalDate(agendamento.data_proxima_reposicao) : undefined,
      ativo: cliente.ativo !== false,
      giroMedioSemanal: cliente.giro_medio_semanal,
      janelasEntrega: cliente.janelas_entrega,
      representanteId: cliente.representante_id,
      rotaEntregaId: cliente.rota_entrega_id,
      categoriaEstabelecimentoId: cliente.categoria_estabelecimento_id,
      instrucoesEntrega: cliente.instrucoes_entrega,
      contabilizarGiroMedio: cliente.contabilizar_giro_medio !== false,
      tipoLogistica: cliente.tipo_logistica || 'Própria',
      emiteNotaFiscal: cliente.emite_nota_fiscal !== false,
      tipoCobranca: cliente.tipo_cobranca || 'À vista',
      formaPagamento: cliente.forma_pagamento || 'Boleto',
      observacoes: cliente.observacoes,
      categoriaId: cliente.categoria_id || 1,
      subcategoriaId: cliente.subcategoria_id || 1,
      categoriasHabilitadas: cliente.categorias_habilitadas
    },
    dataReposicao: agendamento.data_proxima_reposicao ? parseLocalDate(agendamento.data_proxima_reposicao) : new Date(),
    statusAgendamento: agendamento.status_agendamento,
    isPedidoUnico: false,
    pedido: {
      id: 0,
      idCliente: cliente.id,
      dataPedido: new Date(),
      dataPrevistaEntrega: agendamento.data_proxima_reposicao ? parseLocalDate(agendamento.data_proxima_reposicao) : new Date(),
      statusPedido: 'Agendado',
      itensPedido: agendamento.tipo_pedido === 'Alterado' ? [] : [],
      totalPedidoUnidades: agendamento.quantidade_total,
      tipoPedido: agendamento.tipo_pedido
    }
  };
};

// Função que converte Date para string no formato YYYY-MM-DD preservando o valor local
export const formatDateForDatabase = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formatted = `${year}-${month}-${day}`;
  console.log('🗓️ Data formatada para banco:', {
    original: date,
    dia_original: date.getDate(),
    mes_original: date.getMonth() + 1,
    ano_original: date.getFullYear(),
    formatted: formatted
  });
  return formatted;
};

export const convertAgendamentoToDbFormat = (agendamento: Partial<AgendamentoCliente>) => {
  const dbData: any = {};
  
  if (agendamento.cliente_id) dbData.cliente_id = agendamento.cliente_id;
  if (agendamento.tipo_pedido) dbData.tipo_pedido = agendamento.tipo_pedido;
  if (agendamento.status_agendamento) dbData.status_agendamento = agendamento.status_agendamento;
  
  // Conversão correta da data preservando o valor exato
  if (agendamento.data_proxima_reposicao) {
    dbData.data_proxima_reposicao = formatDateForDatabase(agendamento.data_proxima_reposicao);
  }
  
  if (agendamento.quantidade_total !== undefined) dbData.quantidade_total = agendamento.quantidade_total;
  if (agendamento.itens_personalizados !== undefined) dbData.itens_personalizados = agendamento.itens_personalizados;
  if (agendamento.substatus_pedido) dbData.substatus_pedido = agendamento.substatus_pedido;
  
  // Timestamps automáticos
  if (agendamento.created_at) dbData.created_at = agendamento.created_at.toISOString();
  if (agendamento.updated_at) dbData.updated_at = agendamento.updated_at.toISOString();
  
  return dbData;
};
