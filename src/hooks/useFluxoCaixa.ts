import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSaldosContasBancarias } from "@/hooks/useSaldosContasBancarias";

export type HorizonteFluxo = 30 | 60 | 90;

export interface LancamentoPrevisto {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  contraparte?: string;
  contaBancariaId: string | null;
  nomeContaBancaria?: string | null;
  valor: number;
  dataVencimento: string; // yyyy-mm-dd
  atrasado: boolean;
  diasAtraso: number;
}

export interface DiaFluxo {
  data: string; // yyyy-mm-dd
  entradas: number;
  saidas: number;
  liquido: number;
  saldo: number;
  contemAtrasados: boolean;
}

export interface ContaFluxo {
  contaBancariaId: string;
  nome: string;
  saldoInicial: number;
  dataReferencia: string | null;
  movimentoLiquidado: number;
  entradasLiquidadas: number;
  saidasLiquidadas: number;
  saldoAtual: number;
  configurada: boolean;
}

const hojeISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return isoOf(d);
};

const isoOf = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const addDaysISO = (iso: string, dias: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return isoOf(d);
};

const diffDiasISO = (a: string, b: string) =>
  Math.floor(
    (new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime()) / 86400000
  );

function parseDataGC(valor?: string): string | null {
  if (!valor) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [d, m, y] = valor.split("/");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10);
  return null;
}

const num = (v: any) => parseFloat(String(v ?? "0").replace(",", ".")) || 0;

export function useFluxoCaixa(horizonte: HorizonteFluxo = 30) {
  const { saldos, loading: loadingSaldos, salvar, salvando } = useSaldosContasBancarias();

  const chaveSaldos = saldos
    .map((s) => `${s.contaBancariaId}:${s.saldoInicial}:${s.dataReferencia}`)
    .sort()
    .join("|");

  const query = useQuery({
    queryKey: ["fluxo-caixa-gc", horizonte, chaveSaldos],
    enabled: !loadingSaldos,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: configData, error: configError } = await supabase
        .from("integracoes_config")
        .select("config")
        .eq("integracao", "gestaoclick")
        .maybeSingle();
      if (configError) throw configError;

      const config = (configData?.config || {}) as {
        access_token?: string;
        secret_token?: string;
      };
      if (!config.access_token || !config.secret_token) {
        throw new Error("Integração com o GestãoClick não configurada");
      }

      const auth = {
        access_token: config.access_token,
        secret_token: config.secret_token,
      };

      const [contasRes, recRes, pagRes] = await Promise.all([
        supabase.functions.invoke("gestaoclick-proxy", {
          body: { action: "listar_contas_bancarias", ...auth },
        }),
        supabase.functions.invoke("gestaoclick-proxy", {
          body: { action: "buscar_recebimentos_abertos", ...auth, meses_retroativos: 12 },
        }),
        supabase.functions.invoke("gestaoclick-proxy", {
          body: {
            action: "buscar_pagamentos_abertos",
            ...auth,
            meses_retroativos: 12,
            dias_futuros: 180,
          },
        }),
      ]);

      for (const r of [contasRes, recRes, pagRes]) {
        if (r.error) throw r.error;
        if (!(r.data as any)?.success) {
          throw new Error((r.data as any)?.error || "Erro ao consultar o GestãoClick");
        }
      }

      // Movimentos liquidados por data de referência (agrupando contas com a mesma data)
      const datasRef = Array.from(new Set(saldos.map((s) => s.dataReferencia))).filter(Boolean);
      const liquidadosPorConta = new Map<string, { entradas: number; saidas: number }>();

      await Promise.all(
        datasRef.map(async (dataRef) => {
          const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
            body: { action: "buscar_movimentos_liquidados", ...auth, data_referencia: dataRef },
          });
          if (error || !(data as any)?.success) return;
          const contasDestaData = new Set(
            saldos.filter((s) => s.dataReferencia === dataRef).map((s) => s.contaBancariaId)
          );
          ((data as any).por_conta || []).forEach((c: any) => {
            const id = String(c.conta_bancaria_id);
            if (!contasDestaData.has(id)) return;
            liquidadosPorConta.set(id, {
              entradas: Number(c.entradas) || 0,
              saidas: Number(c.saidas) || 0,
            });
          });
        })
      );

      const contasGC: { id: string; nome: string }[] = ((contasRes.data as any).contas || []).map(
        (c: any) => ({ id: String(c.id), nome: c.nome })
      );

      const contas: ContaFluxo[] = contasGC.map((c) => {
        const saldo = saldos.find((s) => s.contaBancariaId === c.id);
        const liq = liquidadosPorConta.get(c.id) || { entradas: 0, saidas: 0 };
        const movimento = saldo ? liq.entradas - liq.saidas : 0;
        return {
          contaBancariaId: c.id,
          nome: c.nome,
          saldoInicial: saldo?.saldoInicial ?? 0,
          dataReferencia: saldo?.dataReferencia ?? null,
          entradasLiquidadas: saldo ? liq.entradas : 0,
          saidasLiquidadas: saldo ? liq.saidas : 0,
          movimentoLiquidado: movimento,
          saldoAtual: (saldo?.saldoInicial ?? 0) + movimento,
          configurada: !!saldo,
        };
      });

      const saldoAtualTotal = contas.reduce((s, c) => s + c.saldoAtual, 0);

      const hoje = hojeISO();
      const fim = addDaysISO(hoje, horizonte);

      const lancamentos: LancamentoPrevisto[] = [];

      ((recRes.data as any).recebimentos || []).forEach((rec: any) => {
        const iso = parseDataGC(rec.data_vencimento);
        if (!iso) return;
        const dias = diffDiasISO(hoje, iso);
        lancamentos.push({
          id: `r-${rec.id}`,
          tipo: "entrada",
          descricao: rec.descricao || `Recebimento ${rec.codigo || rec.id}`,
          contraparte: rec.nome_cliente || undefined,
          contaBancariaId: rec.conta_bancaria_id ? String(rec.conta_bancaria_id) : null,
          nomeContaBancaria: rec.nome_conta_bancaria,
          valor: num(rec.valor_total ?? rec.valor),
          dataVencimento: iso,
          atrasado: dias > 0,
          diasAtraso: dias > 0 ? dias : 0,
        });
      });

      ((pagRes.data as any).pagamentos || []).forEach((pag: any) => {
        const iso = parseDataGC(pag.data_vencimento);
        if (!iso) return;
        const dias = diffDiasISO(hoje, iso);
        lancamentos.push({
          id: `p-${pag.id}`,
          tipo: "saida",
          descricao: pag.descricao || `Pagamento ${pag.codigo || pag.id}`,
          contraparte: pag.nome_fornecedor || pag.nome_cliente || pag.nome_plano_conta || undefined,
          contaBancariaId: pag.conta_bancaria_id ? String(pag.conta_bancaria_id) : null,
          nomeContaBancaria: pag.nome_conta_bancaria,
          valor: num(pag.valor_total ?? pag.valor),
          dataVencimento: iso,
          atrasado: dias > 0,
          diasAtraso: dias > 0 ? dias : 0,
        });
      });

      /*
        Vencido NÃO entra na curva.

        Antes, todo título vencido era lançado no dia de hoje — ou seja, a
        projeção assumia que a inadimplência inteira seria recebida hoje, e o
        saldo de todos os dias seguintes carregava esse otimismo. Com atraso
        relevante, a curva ficava alta demais para servir de decisão.

        Agora a projeção conta só o que ainda vai vencer. O que está atrasado
        aparece à parte, como valor fora da curva: se entrar, é a mais.
      */
      const vencidos = lancamentos.filter((l) => l.atrasado);
      const noHorizonte = lancamentos.filter(
        (l) => !l.atrasado && l.dataVencimento <= fim
      );

      const vencidoAReceber = vencidos
        .filter((l) => l.tipo === "entrada")
        .reduce((s, l) => s + l.valor, 0);
      const vencidoAPagar = vencidos
        .filter((l) => l.tipo === "saida")
        .reduce((s, l) => s + l.valor, 0);

      const porDia = new Map<string, { entradas: number; saidas: number; atrasados: boolean }>();
      for (let i = 0; i <= horizonte; i++) {
        porDia.set(addDaysISO(hoje, i), { entradas: 0, saidas: 0, atrasados: false });
      }

      noHorizonte.forEach((l) => {
        const registro = porDia.get(l.dataVencimento);
        if (!registro) return;
        if (l.tipo === "entrada") registro.entradas += l.valor;
        else registro.saidas += l.valor;
        if (l.atrasado) registro.atrasados = true;
      });

      let acumulado = saldoAtualTotal;
      const serie: DiaFluxo[] = Array.from(porDia.entries()).map(([data, v]) => {
        const liquido = v.entradas - v.saidas;
        acumulado += liquido;
        return {
          data,
          entradas: v.entradas,
          saidas: v.saidas,
          liquido,
          saldo: acumulado,
          contemAtrasados: v.atrasados,
        };
      });

      const totalReceber = noHorizonte
        .filter((l) => l.tipo === "entrada")
        .reduce((s, l) => s + l.valor, 0);
      const totalPagar = noHorizonte
        .filter((l) => l.tipo === "saida")
        .reduce((s, l) => s + l.valor, 0);

      const menorSaldo = serie.reduce(
        (min, d) => (d.saldo < min.saldo ? d : min),
        serie[0] || { data: hoje, saldo: saldoAtualTotal } as DiaFluxo
      );

      return {
        contas,
        serie,
        lancamentos: noHorizonte.sort((a, b) =>
          a.dataVencimento.localeCompare(b.dataVencimento)
        ),
        kpis: {
          saldoAtual: saldoAtualTotal,
          totalReceber,
          totalPagar,
          saldoProjetado: serie.length ? serie[serie.length - 1].saldo : saldoAtualTotal,
          menorSaldo: menorSaldo.saldo,
          menorSaldoData: menorSaldo.data,
          contasSemSaldo: contas.filter((c) => !c.configurada).length,
          atrasados: vencidos.length,
          vencidoAReceber,
          vencidoAPagar,
          vencidos: vencidos.sort((a, b) => b.diasAtraso - a.diasAtraso),
        },
        periodo: { inicio: hoje, fim },
      };
    },
  });

  return {
    dados: query.data,
    loading: query.isLoading || loadingSaldos,
    error: query.error as Error | null,
    refetch: query.refetch,
    salvarSaldo: salvar,
    salvandoSaldo: salvando,
  };
}