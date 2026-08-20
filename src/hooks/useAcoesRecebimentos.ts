import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Auth = { access_token: string; secret_token: string };

async function obterAuth(): Promise<Auth> {
  const { data } = await supabase
    .from("integracoes_config")
    .select("config")
    .eq("integracao", "gestaoclick")
    .maybeSingle();

  const config = (data?.config || {}) as Partial<Auth>;
  if (!config.access_token || !config.secret_token) {
    throw new Error("Integração com o GestãoClick não configurada");
  }
  return { access_token: config.access_token, secret_token: config.secret_token };
}

export type SituacaoRecebimento = "recebido" | "em_aberto";

export interface ResultadoLote {
  ok: string[];
  falhas: { id: string; motivo: string }[];
}

/** Ações de escrita em títulos a receber do GestãoClick (vencimento e situação). */
export function useAcoesRecebimentos() {
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState<{ feitos: number; total: number } | null>(null);

  const chamar = useCallback(async (body: Record<string, unknown>) => {
    const auth = await obterAuth();
    const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
      body: { ...auth, ...body },
    });
    if (error || !(data as any)?.success) {
      throw new Error((data as any)?.error || error?.message || "Erro no GestãoClick");
    }
    return data as any;
  }, []);

  const alterarVencimento = useCallback(
    (recebimentoId: string, dataVencimento: string) =>
      chamar({
        action: "atualizar_vencimento_recebimento",
        recebimento_id: recebimentoId,
        data_vencimento: dataVencimento,
      }),
    [chamar]
  );

  const alterarSituacao = useCallback(
    (
      recebimentoId: string,
      situacao: SituacaoRecebimento,
      dataLiquidacao?: string,
      formaPagamentoId?: string
    ) =>
      chamar({
        action: "atualizar_situacao_recebimento",
        recebimento_id: recebimentoId,
        situacao,
        data_liquidacao: dataLiquidacao,
        forma_pagamento_id: formaPagamentoId || undefined,
      }),
    [chamar]
  );

  /** Lista as formas de pagamento cadastradas no GestãoClick. */
  const listarFormasPagamento = useCallback(async (): Promise<
    { id: string; nome: string }[]
  > => {
    const data = await chamar({ action: "listar_formas_pagamento_gc" });
    return (data?.formas_pagamento || []) as { id: string; nome: string }[];
  }, [chamar]);

  /** Executa uma ação em vários títulos, um a um, coletando falhas. */
  const executarLote = useCallback(
    async (ids: string[], acao: (id: string) => Promise<unknown>): Promise<ResultadoLote> => {
      setProcessando(true);
      setProgresso({ feitos: 0, total: ids.length });
      const resultado: ResultadoLote = { ok: [], falhas: [] };
      try {
        for (const id of ids) {
          try {
            await acao(id);
            resultado.ok.push(id);
          } catch (e: any) {
            resultado.falhas.push({ id, motivo: e?.message || "Erro desconhecido" });
          }
          setProgresso((p) => (p ? { ...p, feitos: p.feitos + 1 } : p));
        }
        return resultado;
      } finally {
        setProcessando(false);
        setProgresso(null);
      }
    },
    []
  );

  return {
    alterarVencimento,
    alterarSituacao,
    listarFormasPagamento,
    executarLote,
    processando,
    progresso,
  };
}
