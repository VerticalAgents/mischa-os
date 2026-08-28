import type { TituloFinanceiro } from "@/utils/scoreFinanceiro";

/**
 * Leitura dos títulos como o GestãoClick os devolve.
 *
 * Mora aqui porque dois hooks leem o mesmo formato — o da aba de um cliente e o
 * da lista de clientes. Se cada um tivesse a sua conversão, um dia divergiriam
 * e a mesma pessoa teria notas diferentes em duas telas.
 */

/** A API devolve dd/mm/yyyy ou yyyy-mm-dd; aqui sai sempre yyyy-mm-dd. */
export const paraISO = (valor?: string | null): string | null => {
  if (!valor) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [d, m, a] = valor.split("/");
    return `${a}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10);
  return null;
};

export const paraNumero = (v: unknown): number =>
  parseFloat(String(v ?? "0").replace(",", ".")) || 0;

/** Converte um título cru da API. Devolve nulo se não der para datar. */
export const tituloDeGC = (t: any): TituloFinanceiro | null => {
  const vencimento = paraISO(t.data_vencimento);
  if (!vencimento) return null;

  const liquidacao = paraISO(t.data_liquidacao);
  // `liquidado` vem como "1"/"0"; a data de liquidação confirma.
  const pago = String(t.liquidado ?? "0") === "1" && !!liquidacao;

  return {
    id: String(t.id),
    descricao: t.descricao,
    valor: paraNumero(t.valor_total ?? t.valor),
    dataVencimento: vencimento,
    dataLiquidacao: liquidacao,
    pago,
    formaPagamento: t.nome_forma_pagamento || undefined,
  };
};

/**
 * O motivo que a função devolveu, e não a casca do cliente.
 *
 * Quando a edge function responde com status de erro, o supabase-js entrega
 * sempre "Edge Function returned a non-2xx status code" — o mesmo texto para
 * função não publicada, integração sem token ou erro do GestãoClick. A causa
 * está no CORPO da resposta, que vem em `error.context`.
 */
export const motivoReal = async (error: any): Promise<string> => {
  try {
    const resposta = error?.context;
    if (resposta && typeof resposta.json === "function") {
      const corpo = await resposta.clone().json();
      if (corpo?.error) return String(corpo.error);
    }
  } catch {
    // Corpo ilegível: fica a mensagem genérica mesmo.
  }
  return error?.message || "Falha ao chamar a integração";
};
