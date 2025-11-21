import { Lead } from '@/types/lead';
import { Cliente } from '@/types';

export function convertLeadToCliente(lead: Lead): Partial<Cliente> {
  return {
    nome: lead.nome,
    cnpjCpf: lead.cnpjCpf,
    enderecoEntrega: lead.enderecoEntrega,
    linkGoogleMaps: lead.linkGoogleMaps,
    contatoNome: lead.contatoNome,
    contatoTelefone: lead.contatoTelefone,
    contatoEmail: lead.contatoEmail,
    representanteId: lead.representanteId,
    categoriaEstabelecimentoId: lead.categoriaEstabelecimentoId,
    quantidadePadrao: lead.quantidadeEstimada || 0,
    periodicidadePadrao: lead.periodicidadeEstimada || 7,
    // Valores padrão
    statusCliente: 'A ativar',
    tipoLogistica: 'Própria',
    tipoCobranca: 'À vista',
    formaPagamento: 'Boleto',
    emiteNotaFiscal: true,
    contabilizarGiroMedio: true,
    observacoes: lead.observacoes 
      ? `Lead convertido - Origem: ${lead.origem}\n\nObservações do lead:\n${lead.observacoes}`
      : `Lead convertido - Origem: ${lead.origem}`
  };
}
