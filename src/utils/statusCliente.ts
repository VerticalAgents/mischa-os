/**
 * Rótulo de status do cliente na tela.
 *
 * O valor guardado continua o mesmo — no banco `A_ATIVAR`, e a string interna da
 * UI segue sendo "A ativar". Só o texto exibido muda. Trocar o valor exigiria
 * migração e mexer nas dezenas de lugares que comparam a string; um rótulo
 * resolve o que era o pedido de verdade, que é a escrita esquisita.
 */
const ROTULOS: Record<string, string> = {
  "A ativar": "Ativar",
};

export const rotuloDeStatus = (status?: string | null): string => {
  const s = (status || "").trim();
  return ROTULOS[s] ?? s;
};

/**
 * "Em análise" saiu de circulação: não existe nenhum cliente com esse status e
 * ele não queria dizer nada de útil. Sai dos lugares onde dá para ESCOLHER, mas
 * continua sendo exibido se aparecer — um cliente antigo pode voltar por
 * sincronização do GestãoClick, e é melhor mostrar do que sumir com ele.
 */
export const STATUS_SELECIONAVEIS = [
  "Ativo",
  "Inativo",
  "A ativar",
  "Standby",
] as const;
