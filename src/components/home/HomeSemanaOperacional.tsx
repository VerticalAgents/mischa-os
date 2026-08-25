import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, endOfWeek, addDays, isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import DetalheIndicador, { type ConteudoDetalhe } from "@/components/mobile/DetalheIndicador";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";

/**
 * O bloco operacional da semana — o que abre quando se entra na Início.
 *
 * A Início misturava análise macro (giro, distribuição de PDVs, funil) com o que
 * se usa para tocar o dia. Isto aqui é a parte de tocar o dia: o que está
 * previsto, o que já foi confirmado, o que saiu — desta semana e de hoje.
 *
 * Sem consulta nova: os agendamentos já estão na memória, carregados pela
 * própria Início; o resto vem do `useDashboardMetrics`, que a página já usava
 * só para os avisos dos atalhos.
 */

const ROTULO = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

/** Um número com legenda. O ponto colorido é o mesmo vocabulário do Agendamento. */
const Contador = ({
  ponto,
  rotulo,
  valor,
  aoClicar,
}: {
  ponto: string;
  rotulo: string;
  valor: number;
  aoClicar?: () => void;
}) => (
  <button
    type="button"
    onClick={aoClicar}
    className={cn(
      // Centralizado, nao encostado. Com o cartao alto, `justify-between`
      // deixava o numero sozinho no pe e o rotulo la em cima — os dois se
      // desgrudavam. Juntos e no meio, o par se le como uma coisa so.
      "flex h-full flex-col items-center justify-center gap-2 rounded-pilula border border-border p-3 text-center transition-all duration-200 ease-out-expo",
      aoClicar && "cursor-pointer hover:bg-muted/40"
    )}
  >
    {/* Sem `truncate`: em quatro colunas "Confirmados" e "Despachados" viravam
        "CONFIRMA…". Rotulo cortado nao e rotulo — melhor deixar quebrar. */}
    <span className="flex items-center justify-center gap-2">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ponto)} />
      <span className="text-[10px] font-semibold uppercase leading-tight tracking-[1px] text-muted-foreground">
        {rotulo}
      </span>
    </span>
    <span className="text-2xl font-bold leading-none tabular-nums">{valor}</span>
  </button>
);

export default function HomeSemanaOperacional() {
  const navigate = useNavigate();
  const [detalhe, setDetalhe] = useState<ConteudoDetalhe | null>(null);
  const { agendamentos } = useAgendamentoClienteStore();
  const { separacaoPedidos, pedidosDespachados } = useDashboardMetrics();

  const semana = useMemo(() => {
    const hoje = new Date();
    const inicio = startOfWeek(hoje, { weekStartsOn: 1 });
    const fim = endOfWeek(hoje, { weekStartsOn: 1 });

    const daSemana = agendamentos.filter((a) => {
      const d = a.dataReposicao ? new Date(a.dataReposicao) : null;
      return d && d >= inicio && d <= fim;
    });

    // Guarda as LISTAS, nao so as contagens: e o que o resumo mostra ao clicar,
    // e sai do mesmo filtro — nao ha conta feita duas vezes.
    const filtrar = (fn: (a: (typeof daSemana)[number]) => boolean) => daSemana.filter(fn);

    return {
      rotulo: `${format(inicio, "dd/MM")} – ${format(fim, "dd/MM")}`,
      total: daSemana.length,
      previstos: filtrar((a) => a.statusAgendamento === "Previsto"),
      confirmados: filtrar((a) => a.statusAgendamento === "Agendado"),
      separados: filtrar((a) => a.substatus_pedido === "Separado"),
      despachados: filtrar((a) => a.substatus_pedido === "Despachado"),
      dias: Array.from({ length: 7 }, (_, i) => {
        const dia = addDays(inicio, i);
        return {
          dia,
          ehHoje: isSameDay(dia, hoje),
          qtd: daSemana.filter((a) => isSameDay(new Date(a.dataReposicao), dia)).length,
        };
      }),
    };
  }, [agendamentos]);

  const abrir = (
    titulo: string,
    lista: typeof semana.previstos,
    rota: string,
    rotuloAcao: string
  ) =>
    setDetalhe({
      titulo,
      resumo: `${semana.rotulo} · ${lista.length} pedidos`,
      linhas: lista
        .slice()
        .sort((a, b) => +new Date(a.dataReposicao) - +new Date(b.dataReposicao))
        .map((a, i) => ({
          id: a.id ?? `${a.cliente?.id ?? i}`,
          titulo: a.cliente?.nome ?? "Cliente",
          subtitulo: `${a.substatus_pedido || a.statusAgendamento} · ${format(new Date(a.dataReposicao), "dd/MM")}`,
        })),
      vazio: "Nenhum pedido nesta situação.",
      acao: { rotulo: rotuloAcao, aoClicar: () => navigate(rota) },
    });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="flex h-full flex-col overflow-hidden shadow-tema">
        <div className="px-5 pt-5 pb-1">
          <h3 className={cn(ROTULO, "flex items-center gap-2")}>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Esta semana
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {semana.rotulo} · {semana.total} pedidos
          </p>
        </div>
        <CardContent className="flex-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Contador ponto="bg-amber-500" rotulo="Previstos" valor={semana.previstos.length} aoClicar={() => abrir("Previstos da semana", semana.previstos, "/agendamento", "Ver agendamento")} />
            <Contador ponto="bg-emerald-500" rotulo="Confirmados" valor={semana.confirmados.length} aoClicar={() => abrir("Confirmados da semana", semana.confirmados, "/agendamento", "Ver agendamento")} />
            <Contador ponto="bg-blue-500" rotulo="Separados" valor={semana.separados.length} aoClicar={() => abrir("Separados da semana", semana.separados, "/expedicao?tab=separacao", "Ver separação")} />
            <Contador ponto="bg-purple-500" rotulo="Despachados" valor={semana.despachados.length} aoClicar={() => abrir("Despachados da semana", semana.despachados, "/expedicao?tab=despacho", "Ver despacho")} />
          </div>

          {/* A semana dia a dia: onde o volume se concentra se lê antes de qualquer número. */}
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {semana.dias.map(({ dia, ehHoje, qtd }) => (
              <div
                key={dia.toISOString()}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-pilula border p-2 text-center",
                  ehHoje ? "border-amber-500/60 bg-amber-50/40 dark:bg-amber-500/5" : "border-border"
                )}
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {format(dia, "EEEEEE", { locale: ptBR })}
                </span>
                <span className="text-sm font-bold tabular-nums">{qtd}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col overflow-hidden shadow-tema">
        <div className="px-5 pt-5 pb-1">
          <h3 className={cn(ROTULO, "flex items-center gap-2")}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Hoje na expedição
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">O que ainda precisa sair da casa</p>
        </div>
        {/* flex-1 no conteudo + h-full na grade: os tres contadores esticam ate a
            base do cartao, em vez de ficarem uma faixa no topo com vazio embaixo.
            O `justify-between` do proprio contador leva o numero para o pe. */}
        <CardContent className="flex flex-1 flex-col">
          <div className="grid h-full grid-cols-3 gap-2">
            <Contador
              ponto="bg-amber-500"
              rotulo="A separar"
              valor={separacaoPedidos.aguardando}
              aoClicar={() => navigate("/expedicao?tab=separacao")}
            />
            <Contador
              ponto="bg-blue-500"
              rotulo="Separados"
              valor={separacaoPedidos.separados}
              aoClicar={() => navigate("/expedicao?tab=separacao")}
            />
            <Contador
              ponto="bg-purple-500"
              rotulo="Despachados"
              valor={pedidosDespachados?.total ?? 0}
              aoClicar={() => navigate("/expedicao?tab=despacho")}
            />
          </div>
        </CardContent>
      </Card>

      <DetalheIndicador conteudo={detalhe} aoFechar={() => setDetalhe(null)} />
    </div>
  );
}
