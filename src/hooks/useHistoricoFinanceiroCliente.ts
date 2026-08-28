import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hojeISO } from "@/utils/dataLocal";
import { motivoReal, tituloDeGC } from "@/utils/titulosGC";
import {
  calcularScoreFinanceiro,
  type ScoreFinanceiro,
  type TituloFinanceiro,
} from "@/utils/scoreFinanceiro";

/**
 * Histórico de títulos de UM cliente no GestãoClick, já virado em score.
 *
 * Busca sob demanda, por cliente: é uma chamada à API externa que só faz
 * sentido quando alguém abre a aba financeira daquele cliente. Para a LISTA de
 * clientes existe o `useScoresFinanceiros`, que faz uma varredura só — pedir
 * por cliente ali seria uma requisição por linha.
 */

export const MESES_HISTORICO = 12;

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
          meses: MESES_HISTORICO,
        },
      });

      // A mensagem real precisa chegar na tela. Um "não foi possível" genérico
      // esconde justamente o que resolve: função não publicada, integração não
      // configurada, cliente sem vínculo. Cada um tem uma saída diferente.
      if (error) throw new Error(await motivoReal(error));
      if (!data?.success) throw new Error(data?.error || "Resposta inesperada da integração");

      const titulos = (data.titulos || [])
        .map(tituloDeGC)
        .filter(Boolean) as TituloFinanceiro[];

      return calcularScoreFinanceiro(titulos, hojeISO());
    },
  });

  return {
    score: query.data ?? null,
    loading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    meses: MESES_HISTORICO,
  };
}
