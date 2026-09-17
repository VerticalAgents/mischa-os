/**
 * De quem é a conversa aberta?
 *
 * Função pura de propósito: é a decisão mais perigosa da extensão inteira.
 * Errar aqui significa mostrar o financeiro de um cliente na conversa de outro,
 * então tudo o que ela faz é testável, e ela sempre diz **como** chegou à
 * conclusão — o painel mostra isso na tela, junto de um "não é esse cliente".
 *
 * A ordem vai do mais confiável para o menos:
 *   1. vínculo que o Lucca fez à mão (por identificador, telefone ou nome)
 *   2. telefone que está no cadastro do cliente
 *   3. nome da conversa igual ao nome do cliente
 */
import { normalizarTelefoneBR } from '@/utils/telefone';

export interface ChatParaResolver {
  titulo: string | null;
  telefone: string | null;
  lid: string | null;
}

export interface ClienteResumido {
  id: string;
  nome: string;
  contato_telefone?: string | null;
}

export interface VinculoWhatsapp {
  id: string;
  cliente_id: string | null;
  lead_id: string | null;
  chat_titulo: string | null;
  telefone_e164: string | null;
  lid: string | null;
}

export type ComoAchou =
  | 'vinculo-identificador'
  | 'vinculo-telefone'
  | 'vinculo-nome'
  | 'telefone-do-cadastro'
  | 'nome-igual';

export interface ClienteDaConversa {
  clienteId: string;
  comoAchou: ComoAchou;
  vinculoId?: string;
}

export const EXPLICACAO: Record<ComoAchou, string> = {
  'vinculo-identificador': 'vinculado à mão',
  'vinculo-telefone': 'vinculado à mão, pelo telefone',
  'vinculo-nome': 'vinculado à mão, pelo nome da conversa',
  'telefone-do-cadastro': 'pelo telefone do cadastro',
  'nome-igual': 'pelo nome igual ao do cadastro',
};

/** Tira acento, espaço sobrando e caixa alta, para comparar nome com nome. */
export function simplificar(texto?: string | null): string {
  return (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolverCliente(
  chat: ChatParaResolver,
  vinculos: VinculoWhatsapp[],
  clientes: ClienteResumido[]
): ClienteDaConversa | null {
  const titulo = simplificar(chat.titulo);
  const telefone = normalizarTelefoneBR(chat.telefone).e164;

  const doVinculo = (v: VinculoWhatsapp, comoAchou: ComoAchou): ClienteDaConversa | null =>
    v.cliente_id ? { clienteId: v.cliente_id, comoAchou, vinculoId: v.id } : null;

  if (chat.lid) {
    const v = vinculos.find((x) => x.lid && x.lid === chat.lid);
    if (v) return doVinculo(v, 'vinculo-identificador');
  }

  if (telefone) {
    const v = vinculos.find((x) => x.telefone_e164 === telefone);
    if (v) return doVinculo(v, 'vinculo-telefone');
  }

  if (titulo) {
    const v = vinculos.find((x) => simplificar(x.chat_titulo) === titulo);
    if (v) return doVinculo(v, 'vinculo-nome');
  }

  if (telefone) {
    // O telefone do cadastro é digitado de qualquer jeito, então a comparação é
    // sempre entre números normalizados — nunca entre os textos.
    const cliente = clientes.find(
      (c) => normalizarTelefoneBR(c.contato_telefone).e164 === telefone
    );
    if (cliente) return { clienteId: cliente.id, comoAchou: 'telefone-do-cadastro' };
  }

  if (titulo) {
    // Só nome idêntico. Parecido não serve: "Padaria Central" e "Padaria
    // Central 2" são clientes diferentes, com dinheiro diferente.
    const iguais = clientes.filter((c) => simplificar(c.nome) === titulo);
    if (iguais.length === 1) return { clienteId: iguais[0].id, comoAchou: 'nome-igual' };
  }

  return null;
}
