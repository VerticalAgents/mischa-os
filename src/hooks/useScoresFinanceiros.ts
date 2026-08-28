import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hojeISO } from "@/utils/dataLocal";
import { motivoReal, tituloDeGC } from "@/utils/titulosGC";
import {
  calcularScoreFinanceiro,
  type ScoreFinanceiro,
  type TituloFinanceiro,
} from "@/utils/scoreFinanceiro";
import { MESES_HISTORICO } from "@/hooks/useHistoricoFinanceiroCliente";

/**
 * A nota de pagamento de TODOS os clientes, numa varredura só.
 *
 * A alternativa seria chamar o histórico por cliente, uma requisição por linha
 * da tabela — com o limite de 3 por segundo da API, uma lista de cem clientes
 * levaria mais de meio minuto só de espera. Aqui a busca traz os títulos do
 * período inteiro e o agrupamento por cliente é feito aqui, de graça.
 *
 * A nota sai da MESMA `calcularScoreFinanceiro` da aba do cliente. É o que
 * garante que a lista e o detalhe nunca mostrem números diferentes da mesma
 * pessoa.
 */

export function useScoresFinanceiros(habilitado = true) {
  const query = useQuery({
    queryKey: ["scores-financeiros"],
    enabled: habilitado,
    // Janela larga: é uma varredura pesada e a nota não muda de minuto a minuto.
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<Record<string, ScoreFinanceiro>> => {
      const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
        body: { action: "historico_financeiro_geral", meses: MESES_HISTORICO },
      });

      if (error) throw new Error(await motivoReal(error));
      if (!data?.success) throw new Error(data?.error || "Resposta inesperada da integração");

      const porCliente = new Map<string, TituloFinanceiro[]>();
      (data.titulos || []).forEach((cru: any) => {
        const titulo = tituloDeGC(cru);
        if (!titulo) return;
        const chave = String(cru.cliente_id);
        const lista = porCliente.get(chave);
        if (lista) lista.push(titulo);
        else porCliente.set(chave, [titulo]);
      });

      const hoje = hojeISO();
      const scores: Record<string, ScoreFinanceiro> = {};
      porCliente.forEach((titulos, gcId) => {
        scores[gcId] = calcularScoreFinanceiro(titulos, hoje);
      });

      return scores;
    },
  });

  return {
    scores: query.data ?? {},
    loading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
