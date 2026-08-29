import type { TituloFinanceiro } from "@/utils/scoreFinanceiro";

/**
 * Leitura dos títulos como o GestãoClick os devolve.
 *
 * Mora aqui porque dois hooks leem o mesmo formato — o da aba de um cliente e o
 * da lista de clientes. Se cada um tivesse a sua conversão, um dia divergiriam
 * e a mesma pessoa teria notas diferentes em duas telas.
 */

/**
 * Uma data que EXISTE no calendário.
 *
 * O formato bater não basta: "2026-06-35" passa em qualquer expressão regular e
 * vira Data Inválida, que contamina a conta inteira — o atraso vira NaN, a nota
 * vira NaN e o título aparece no meio da lista ordenada, sem alarme nenhum.
 * Melhor descartar o título do que envenenar o score do cliente.
 */
const dataReal = (iso: string): boolean => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  // Um dia inexistente é "corrigido" pelo navegador (31/06 vira 01/07), então a
  // volta precisa bater com a ida.
  const [a, m, dia] = iso.split("-").map(Number);
  return d.getFullYear() === a && d.getMonth() + 1 === m && d.getDate() === dia;
};

/** A API devolve dd/mm/yyyy ou yyyy-mm-dd; aqui sai sempre yyyy-mm-dd. */
export const paraISO = (valor?: string | null): string | null => {
  if (!valor) return null;

  let iso: string | null = null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [d, m, a] = valor.split("/");
    iso = `${a}-${m}-${d}`;
  } else if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
    iso = valor.slice(0, 10);
  }

  return iso && dataReal(iso) ? iso : null;
};

/**
 * Valor em dinheiro, nos dois formatos que podem chegar.
 *
 * O GestãoClick manda "1599.99", com ponto decimal. Mas trocar a vírgula por
 * ponto às cegas quebra o formato brasileiro: "1.234,56" virava "1.234.56", que
 * o parseFloat lê como 1,23 — erro de mil vezes, em dinheiro, silencioso.
 *
 * Regra: se tem vírgula, ela é o decimal e os pontos são milhar. Se não tem,
 * o ponto é o decimal.
 */
export const paraNumero = (v: unknown): number => {
  const texto = String(v ?? "").trim();
  if (!texto) return 0;

  const limpo = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  return parseFloat(limpo) || 0;
};

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
