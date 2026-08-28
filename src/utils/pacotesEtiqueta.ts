/**
 * Divisão de um pedido em pacotes, para as etiquetas da separação.
 *
 * A etiqueta não é do pedido: é do PACOTE. Como cabem no máximo 40 unidades por
 * pacote, um pedido de 50 sai em dois volumes — e cada um precisa da sua
 * etiqueta, dizendo qual é ("1 de 2") para quem recebe conferir se chegou tudo.
 *
 * O total do PEDIDO aparece em todas as etiquetas de propósito: quem está com
 * um volume na mão precisa saber quanto era o pedido inteiro sem ter que juntar
 * as etiquetas.
 */

/** Máximo de unidades que cabem num pacote. */
export const UNIDADES_POR_PACOTE = 40;

export interface PacoteEtiqueta {
  /** 1-based: é o que sai impresso. */
  numero: number;
  total: number;
  /** Unidades neste volume. */
  unidades: number;
  /** Unidades do pedido inteiro, repetido em toda etiqueta do pedido. */
  unidadesDoPedido: number;
  /** "1 de 2". Vazio quando o pedido cabe num volume só. */
  rotulo: string;
}

/**
 * Quantos pacotes um pedido ocupa.
 *
 * Pedido sem quantidade (ou com quantidade inválida) ainda rende UMA etiqueta:
 * o volume existe fisicamente e precisa ser identificado, mesmo que o número
 * esteja errado no sistema. Sumir com a etiqueta seria pior.
 */
export function dividirEmPacotes(quantidadeTotal: number): PacoteEtiqueta[] {
  const total = Number(quantidadeTotal);
  const unidadesDoPedido = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;

  const quantosPacotes = Math.max(1, Math.ceil(unidadesDoPedido / UNIDADES_POR_PACOTE));

  /*
    As unidades se repartem por IGUAL entre os pacotes, e não "enche 40, sobra o
    resto". Um pedido de 50 vira 25 + 25, não 40 + 10: dois volumes parecidos
    são mais fáceis de carregar e de conferir do que um cheio e um quase vazio.

    Quando a divisão não é exata, a sobra é distribuída de um em um pelos
    primeiros pacotes — 41 vira 21 + 20. Como o número de pacotes vem do teto de
    40, o maior deles nunca passa do limite.
  */
  const base = Math.floor(unidadesDoPedido / quantosPacotes);
  const sobra = unidadesDoPedido % quantosPacotes;

  return Array.from({ length: quantosPacotes }, (_, i) => {
    const unidades = base + (i < sobra ? 1 : 0);
    return {
      numero: i + 1,
      total: quantosPacotes,
      unidades,
      unidadesDoPedido,
      // Volume único não ganha rótulo: "1 de 1" só ocupa espaço e faz pensar
      // que existe outro pacote em algum lugar.
      rotulo: quantosPacotes > 1 ? `${i + 1} de ${quantosPacotes}` : "",
    };
  });
}
