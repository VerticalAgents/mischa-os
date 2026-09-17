/**
 * Normalização de telefone brasileiro.
 *
 * Existiam duas cópias desta regra no app — uma em AgendamentoActions (link do
 * WhatsApp) e outra em ClientesBulkActions (exportação em E.164) — e elas não
 * concordavam entre si. Agora é uma só.
 *
 * A extensão do WhatsApp depende disso para descobrir de quem é a conversa:
 * o telefone do cadastro é digitado de qualquer jeito, e o que vem do navegador
 * é só dígito. Sem uma normalização única, os dois nunca se encontram.
 */

export interface TelefoneNormalizado {
  /** `+5551999999999`, ou `null` quando não dá para reconhecer. */
  e164: string | null;
  /** Só os dígitos, com o país: `5551999999999`. `null` no mesmo caso. */
  digitos: string | null;
  /** O que estava escrito no cadastro, sem espaço nas pontas. */
  original: string;
}

const VAZIO: TelefoneNormalizado = { e164: null, digitos: null, original: '' };

export function normalizarTelefoneBR(bruto?: string | null): TelefoneNormalizado {
  if (!bruto) return VAZIO;

  const original = bruto.trim();
  let limpo = original.replace(/\D/g, '');

  // Escrito em formato internacional e não é Brasil: não adivinhe. Um número
  // americano tem 11 dígitos e passaria por celular brasileiro sem esta trava.
  if (original.startsWith('+') && !limpo.startsWith('55')) {
    return { e164: null, digitos: null, original };
  }

  // "0 51 99999..." — o zero de operadora não faz parte do número.
  if (limpo.startsWith('0')) limpo = limpo.slice(1);

  const comPais = (digitos: string): TelefoneNormalizado => ({
    e164: `+${digitos}`,
    digitos,
    original,
  });

  // Já veio com o país: 55 + DDD (2) + número (8 ou 9).
  if (limpo.startsWith('55') && (limpo.length === 12 || limpo.length === 13)) {
    return comPais(limpo);
  }

  // DDD + celular de 9 dígitos.
  // A versão antiga exigia que o primeiro dígito fosse 9, mas o primeiro dígito
  // é o do DDD — e nenhum DDD começa com 9. Na prática, nenhum celular passava.
  if (limpo.length === 11) return comPais(`55${limpo}`);

  // DDD + fixo de 8 dígitos.
  if (limpo.length === 10) return comPais(`55${limpo}`);

  return { e164: null, digitos: null, original };
}

/** Formato que o link `wa.me/` espera: só dígitos, com o país, sem `+`. */
export function paraWaMe(bruto?: string | null): string | null {
  return normalizarTelefoneBR(bruto).digitos;
}

/** Dois telefones escritos de jeitos diferentes são o mesmo número? */
export function mesmoTelefone(a?: string | null, b?: string | null): boolean {
  const da = normalizarTelefoneBR(a).digitos;
  const db = normalizarTelefoneBR(b).digitos;
  return da !== null && da === db;
}
