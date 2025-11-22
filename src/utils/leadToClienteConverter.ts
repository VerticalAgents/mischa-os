import { Lead } from '@/types/lead';
import { Cliente } from '@/types';

export function convertLeadToCliente(lead: Lead): Partial<Cliente> {
  return {
    nome: lead.nome,
    cnpjCpf: lead.cnpjCpf || undefined,
    enderecoEntrega: lead.enderecoEntrega || undefined,
    linkGoogleMaps: lead.linkGoogleMaps || undefined,
    contatoNome: lead.contatoNome || undefined,
    contatoTelefone: lead.contatoTelefone || undefined,
    contatoEmail: lead.contatoEmail || undefined,
    representanteId: lead.representanteId || undefined,
    categoriaEstabelecimentoId: lead.categoriaEstabelecimentoId || undefined,
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
