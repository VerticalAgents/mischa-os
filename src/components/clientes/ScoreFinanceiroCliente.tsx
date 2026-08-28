import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown, ChevronUp, Gauge } from "lucide-react";
import { useHistoricoFinanceiroCliente } from "@/hooks/useHistoricoFinanceiroCliente";
import {
  ROTULO_CLASSIFICACAO,
  atrasoEfetivo,
  type Classificacao,
} from "@/utils/scoreFinanceiro";
import { cn } from "@/lib/utils";

/**
 * Como o cliente paga: a nota e os números que a sustentam.
 *
 * O resto da aba financeira fala de margem e preço — ou seja, do que o cliente
 * vale. Este bloco fala de outra coisa: se o dinheiro entra na data
 * combinada, cruzando o vencimento de cada título com o dia em que foi pago.
 */

const ROTULO = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

/**
 * `text-destructive` no tema escuro é um vermelho fechado: sobre fundo escuro
 * ele quase somia. Toda marca de alerta passa por aqui para clarear no escuro.
 */
const TEXTO_ALERTA = "text-destructive dark:text-red-400";

/** Toda variante declara os dois temas (seção 12 do DESIGN.md). */
const CORES: Record<Classificacao, string> = {
  excelente:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  bom: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  atencao: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  risco: "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-400",
  "sem-historico": "border-border bg-muted/40 text-muted-foreground",
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataBR = (iso: string) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

const diasTexto = (d: number) => `${d} ${d === 1 ? "dia" : "dias"}`;

const Indicador = ({
  rotulo,
  valor,
  alerta,
}: {
  rotulo: string;
  valor: string;
  alerta?: boolean;
}) => (
  <div className="rounded-pilula border border-border p-3">
    <p className="text-[10px] font-semibold uppercase leading-tight tracking-[1px] text-muted-foreground">
      {rotulo}
    </p>
    <p
      className={cn(
        "mt-1 text-lg font-bold tabular-nums",
        alerta && TEXTO_ALERTA
      )}
    >
      {valor}
    </p>
  </div>
);

export default function ScoreFinanceiroCliente({
  gestaoClickClienteId,
}: {
  gestaoClickClienteId?: string | null;
}) {
  const { score, loading, error, meses } = useHistoricoFinanceiroCliente(gestaoClickClienteId);
  const [aberto, setAberto] = useState(false);

  // Sem vínculo com o GestãoClick não há título nenhum para ler — em vez de um
  // bloco vazio sem explicação, o motivo fica dito.
  if (!gestaoClickClienteId) {
    return (
      <Card className="shadow-tema">
        <CardContent className="flex items-center gap-3 py-5 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          Este cliente não está vinculado ao GestãoClick, então não há histórico de
          pagamentos para analisar.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="shadow-tema">
        <CardContent className="space-y-3 py-5">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !score) {
    return (
      <Card className="shadow-tema">
        <CardContent className="flex items-start gap-3 py-5 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <div className="min-w-0 space-y-1">
            <p>Não foi possível carregar o histórico de pagamentos.</p>
            {error?.message && (
              <p className="break-words font-mono text-xs opacity-70">{error.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const semHistorico = score.classificacao === "sem-historico";

  return (
    <Card className="shadow-tema">
      <CardContent className="space-y-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={cn(ROTULO, "flex items-center gap-2")}>
            <Gauge className="h-3.5 w-3.5" />
            Comportamento de pagamento · {meses} meses
          </h3>
          <Badge variant="outline" className={cn("rounded-pilula", CORES[score.classificacao])}>
            {ROTULO_CLASSIFICACAO[score.classificacao]}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div
            className={cn(
              "flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-bloco border",
              CORES[score.classificacao]
            )}
          >
            <span className="text-2xl font-bold leading-none tabular-nums">
              {semHistorico ? "—" : score.score}
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[1px] opacity-80">
              de 100
            </span>
          </div>

          <p className="min-w-[220px] flex-1 text-sm text-muted-foreground">
            {semHistorico ? (
              <>
                Ainda não há pagamentos suficientes nos últimos {meses} meses para uma
                nota confiável.
              </>
            ) : (
              <>
                {/* O que está vencido vem primeiro: dizer "100% pago no prazo"
                    ao lado do selo "Risco" soava como elogio, quando o motivo
                    da nota é justamente a dívida em aberto. */}
                {score.valorVencido > 0 && (
                  <>
                    <span className={cn("font-medium", TEXTO_ALERTA)}>
                      Tem {brl(score.valorVencido)} vencido em aberto.
                    </span>{" "}
                  </>
                )}
                No histórico de pagamentos,{" "}
                <span className="font-medium text-foreground">
                  {score.percentualValorEmDia.toFixed(0)}% do valor
                </span>{" "}
                saiu no prazo, com o dinheiro entrando{" "}
                <span className="font-medium text-foreground">
                  {score.atrasoMedioPonderado < 0.5
                    ? "na data combinada"
                    : `${diasTexto(Math.round(score.atrasoMedioPonderado))} depois do vencimento`}
                </span>{" "}
                em média, pesando cada título pelo valor.
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Indicador rotulo="Pago no período" valor={brl(score.valorPago)} />
          <Indicador rotulo="Em aberto" valor={brl(score.valorEmAberto)} />
          <Indicador
            rotulo="Vencido hoje"
            valor={brl(score.valorVencido)}
            alerta={score.valorVencido > 0}
          />
          {/* Dentro da tolerância não é atraso: mostrar "2 dias" ao lado de
              uma nota 100 fazia o indicador contradizer a própria regra. */}
          <Indicador
            rotulo="Pior atraso"
            valor={
              atrasoEfetivo(score.maiorAtraso) > 0 ? diasTexto(score.maiorAtraso) : "—"
            }
          />
        </div>

        {score.valorVencido > 0 && (
          <p className={cn("flex items-start gap-2 text-xs", TEXTO_ALERTA)}>
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            Há título vencido em aberto há {diasTexto(score.maiorAtrasoEmAberto)}, o que
            limita a classificação independente do histórico.
          </p>
        )}

        {score.pagamentos.length > 0 && (
          <Collapsible open={aberto} onOpenChange={setAberto}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-controle px-1 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
              <span>
                {score.pagamentos.length === 1
                  ? "Ver o pagamento registrado"
                  : `Ver os ${score.pagamentos.length} pagamentos que formam a nota`}
              </span>
              {aberto ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1.5">
              {score.pagamentos.map(({ titulo, atraso }) => (
                <div
                  key={titulo.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-controle border border-border px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {titulo.descricao || `Título ${titulo.id}`}
                    </p>
                    <p className="text-muted-foreground">
                      Venceu {dataBR(titulo.dataVencimento)} · pago{" "}
                      {dataBR(titulo.dataLiquidacao as string)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums">{brl(titulo.valor)}</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        atraso > 2
                          ? cn("font-medium", TEXTO_ALERTA)
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {atraso > 2 ? `+${diasTexto(atraso)}` : "no prazo"}
                    </span>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
