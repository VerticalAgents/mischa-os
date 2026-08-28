import type { ProporcaoPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { calcularQuantidadesPadrao } from "@/utils/proporcoesPadrao";

/**
 * Proporção definida na hora, sem passar pela proporção padrão global.
 *
 * A proporção padrão vive em `proporcoes_padrao` e vale para todo pedido do
 * tipo "Padrão" — não se guarda nada no pedido, a conta é feita na leitura.
 * Aqui é o contrário: a proporção é de uso único, então as quantidades
 * precisam ser gravadas no próprio pedido (`itens_personalizados`), o que faz
 * dele um pedido "Alterado".
 *
 * Regra de negócio: isto só se aplica a clientes com a categoria
 * "Revenda Padrão" acionada no cadastro. Fora dela, a proporção não faz
 * sentido — o cliente compra outra coisa.
 */

export const CATEGORIA_REVENDA_PADRAO = "Revenda Padrão";

/** Uma fatia da proporção montada na tela. */
export interface FatiaProporcao {
  produto_id: string;
  produto_nome: string;
  percentual: number;
}

/** Item como o resto do app grava em `itens_personalizados`. */
export interface ItemPersonalizado {
  produto: string;
  quantidade: number;
}

const SOMA_ALVO = 100;
const TOLERANCIA = 0.01;

/** A soma bate 100%? É o mesmo critério que `calcularQuantidadesPadrao` exige. */
export const somaFecha = (fatias: FatiaProporcao[]): boolean =>
  Math.abs(fatias.reduce((s, f) => s + (Number(f.percentual) || 0), 0) - SOMA_ALVO) <= TOLERANCIA;

export const somarPercentuais = (fatias: FatiaProporcao[]): number =>
  fatias.reduce((s, f) => s + (Number(f.percentual) || 0), 0);

/**
 * Deriva uma proporção da composição do estoque.
 *
 * O produto que tem mais em estoque recebe a maior fatia — o efeito prático é
 * escoar o estoque de forma pareja, em vez de puxar sempre do mesmo produto.
 *
 * Só entram saldos positivos: produto zerado ou negativo (já comprometido com
 * outro pedido) não tem o que distribuir, e incluí-lo com 0% só sujaria a tela.
 */
export function proporcaoDoEstoque(
  produtos: { produto_id: string; produto_nome: string; disponivel: number }[]
): FatiaProporcao[] {
  const comSaldo = produtos.filter((p) => p.disponivel > 0);
  const total = comSaldo.reduce((s, p) => s + p.disponivel, 0);
  if (total <= 0) return [];

  const fatias = comSaldo.map((p) => ({
    produto_id: p.produto_id,
    produto_nome: p.produto_nome,
    // Percentual inteiro: "59%" se lê e se corrige na hora; "59.3%" é ruído
    // numa proporção que a pessoa vai ajustar no olho antes de aplicar.
    percentual: Math.round((p.disponivel / total) * SOMA_ALVO),
  }));

  // O arredondamento quase nunca fecha em 100 exato. A sobra (ou a falta) vai
  // para a maior fatia, onde ela é proporcionalmente menos perceptível — mesma
  // lógica que `calcularQuantidadesPadrao` usa para o resíduo das unidades.
  const residual = SOMA_ALVO - somarPercentuais(fatias);
  if (residual !== 0 && fatias.length > 0) {
    const maior = fatias.reduce((a, b) => (b.percentual > a.percentual ? b : a));
    maior.percentual += residual;
  }

  return fatias.sort((a, b) => b.percentual - a.percentual);
}

/**
 * Converte a proporção da tela nos itens de um pedido.
 *
 * Reaproveita `calcularQuantidadesPadrao` de propósito: é ela que decide como
 * arredondar e onde jogar o resíduo de unidades. Se a conta divergisse daqui,
 * um pedido "Padrão" e um "Alterado" com a mesma proporção dariam números
 * diferentes — e ninguém entenderia por quê.
 */
export function itensDaProporcao(
  quantidadeTotal: number,
  fatias: FatiaProporcao[]
): ItemPersonalizado[] {
  const comoProporcao: ProporcaoPadrao[] = fatias.map((f) => ({
    id: f.produto_id,
    produto_id: f.produto_id,
    produto_nome: f.produto_nome,
    percentual: Number(f.percentual),
    ativo: true,
    ordem_categoria: null,
  }));

  return calcularQuantidadesPadrao(quantidadeTotal, comoProporcao).map((q) => ({
    produto: q.produto_nome,
    quantidade: q.quantidade,
  }));
}
