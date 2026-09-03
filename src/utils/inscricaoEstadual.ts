/**
 * Inscrição estadual do RS: dez dígitos, no formato `000/0000000`.
 *
 * Vale a pena mascarar mesmo com o campo sendo texto livre: dos clientes que já
 * têm inscrição preenchida, quase todos foram digitados nesse formato à mão. A
 * máscara passa a garantir o que já era a praxe, em vez de inventar um padrão.
 */

const DIGITOS = 10;

export const digitosDaIE = (valor: string): string =>
  (valor || "").replace(/\D/g, "").slice(0, DIGITOS);

/** `0330000000` -> `033/0000000`. Formata enquanto a pessoa digita. */
export const formatarIE = (valor: string): string => {
  const d = digitosDaIE(valor);
  return d.length > 3 ? `${d.slice(0, 3)}/${d.slice(3)}` : d;
};

export const ieCompleta = (valor: string): boolean =>
  digitosDaIE(valor).length === DIGITOS;

/**
 * Só formata o que dá para formatar.
 *
 * Existe cadastro antigo com uma quantidade de dígitos diferente de dez. Passar
 * a máscara nele truncaria o valor e apagaria informação — então um valor que
 * não bate com o formato esperado é devolvido como está, e só muda se alguém
 * reescrever aquele campo.
 */
export const formatarIESeDerConta = (valor?: string | null): string => {
  const original = (valor || "").trim();
  if (!original) return "";
  return digitosDaIE(original).length === DIGITOS ? formatarIE(original) : original;
};
