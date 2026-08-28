import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hojeISO } from "@/utils/dataLocal";
import {
  calcularScoreFinanceiro,
  type ScoreFinanceiro,
  type TituloFinanceiro,
} from "@/utils/scoreFinanceiro";

/**
 * Histórico de títulos de um cliente no GestãoClick, já virado em score.
 *
 * Busca sob demanda, por cliente: é uma chamada à API externa que só faz
 * sentido quando alguém abre a aba financeira daquele cliente. Puxar de todo
 * mundo de uma vez estouraria o limite de 3 requisições por segundo sem que
 * ninguém estivesse olhando.
 */

const MESES = 12;

/** GestãoClick devolve dd/mm/yyyy ou yyyy-mm-dd; aqui sai sempre yyyy-mm-dd. */
const paraISO = (valor?: string | null): string | null => {
  if (!valor) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [d, m, a] = valor.split("/");
    return `${a}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10);
  return null;
};

const paraNumero = (v: unknown): number =>
  parseFloat(String(v ?? "0").replace(",", ".")) || 0;

/**
 * O motivo que a função devolveu, e não a casca do cliente.
 *
 * Quando a edge function responde com status de erro, o supabase-js entrega
 * sempre "Edge Function returned a non-2xx status code" — o mesmo texto para
 * função não publicada, integração sem token ou erro do GestãoClick. A causa
 * está no CORPO da resposta, que vem em `error.context`.
 */
const motivoReal = async (error: any): Promise<string> => {
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

export function useHistoricoFinanceiroCliente(gestaoClickClienteId?: string | null) {
  const query = useQuery({
    queryKey: ["historico-financeiro-cliente", gestaoClickClienteId],
    enabled: !!gestaoClickClienteId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ScoreFinanceiro> => {
      const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
        body: {
          action: "historico_financeiro_cliente",
          cliente_id: gestaoClickClienteId,
          meses: MESES,
        },
      });

      // A mensagem real precisa chegar na tela. Um "não foi possível" genérico
      // esconde justamente o que resolve: função não publicada, integração não
      // configurada, cliente sem vínculo. Cada um tem uma saída diferente.
      if (error) throw new Error(await motivoReal(error));
      if (!data?.success) throw new Error(data?.error || "Resposta inesperada da integração");

      const titulos: TituloFinanceiro[] = (data.titulos || [])
        .map((t: any) => {
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
          } as TituloFinanceiro;
        })
        .filter(Boolean) as TituloFinanceiro[];

      return calcularScoreFinanceiro(titulos, hojeISO());
    },
  });

  return {
    score: query.data ?? null,
    loading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    meses: MESES,
  };
}
