
import { Cliente, StatusCliente, TipoLogisticaNome, TipoCobranca, FormaPagamentoNome } from '../types';

export const createClienteData = (
  baseData: Partial<Cliente> & { nome: string }
): Omit<Cliente, 'id'> => {
  const now = new Date();
  
  return {
    nome: baseData.nome,
    cnpjCpf: baseData.cnpjCpf || '',
    enderecoEntrega: baseData.enderecoEntrega || '',
    contatoNome: baseData.contatoNome || '',
    contatoTelefone: baseData.contatoTelefone || '',
    contatoEmail: baseData.contatoEmail || '',
    quantidadePadrao: baseData.quantidadePadrao || 0,
    periodicidadePadrao: baseData.periodicidadePadrao || 7,
    statusCliente: (baseData.statusCliente as StatusCliente) || 'Ativo',
    metaGiroSemanal: baseData.metaGiroSemanal || 0,
    categoriaEstabelecimentoId: baseData.categoriaEstabelecimentoId || null,
    janelasEntrega: baseData.janelasEntrega || [],
    instrucoesEntrega: baseData.instrucoesEntrega || '',
    tipoLogistica: (baseData.tipoLogistica as TipoLogisticaNome) || 'Própria',
    contabilizarGiroMedio: baseData.contabilizarGiroMedio ?? true,
    emiteNotaFiscal: baseData.emiteNotaFiscal ?? true,
    tipoCobranca: (baseData.tipoCobranca as TipoCobranca) || 'À vista',
    formaPagamento: (baseData.formaPagamento as FormaPagamentoNome) || 'Boleto',
    observacoes: baseData.observacoes || '',
    categoriasHabilitadas: baseData.categoriasHabilitadas || [],
    ativo: baseData.ativo ?? true,
    giroMedioSemanal: baseData.giroMedioSemanal || 0,
    ultimaDataReposicaoEfetiva: baseData.ultimaDataReposicaoEfetiva,
    statusAgendamento: baseData.statusAgendamento || 'Não Agendado',
    proximaDataReposicao: baseData.proximaDataReposicao,
    dataCadastro: now,
    categoriaId: baseData.categoriaId || 1,
    subcategoriaId: baseData.subcategoriaId || 1
  };
};
