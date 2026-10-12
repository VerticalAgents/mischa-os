import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Factory, CalendarDays, Repeat, Trophy } from "lucide-react";
import { formatarValor, ProducaoKpis, UnidadeMedida } from "@/hooks/useProducaoDashboard";
import { GRANULARIDADE_LABEL, type Granularidade } from "@/utils/periodoProducao";
import { cn } from "@/lib/utils";

interface ProducaoKpiStripProps {
  unidade: UnidadeMedida;
  granularidade: Granularidade;
  textoPeriodo: string;
  kpis: ProducaoKpis;
  loading?: boolean;
}

function Variacao({ valor, sufixo }: { valor: number | null; sufixo: string }) {
  if (valor === null) {
    return <span className="text-muted-foreground">sem período anterior para comparar</span>;
  }
  const positivo = valor >= 0;
  return (
    <span className="flex items-center gap-1">
      {positivo ? (
        <TrendingUp className="h-3 w-3 shrink-0 text-green-600" />
      ) : (
        <TrendingDown className="h-3 w-3 shrink-0 text-destructive" />
      )}
      <span className={cn("font-medium", positivo ? "text-green-600" : "text-destructive")}>
        {Math.abs(valor).toFixed(1)}%
      </span>
      <span className="truncate text-muted-foreground">{sufixo}</span>
    </span>
  );
}

export default function ProducaoKpiStrip({
  unidade,
  granularidade,
  textoPeriodo,
  kpis,
  loading = false,
}: ProducaoKpiStripProps) {
  const { singular, plural } = GRANULARIDADE_LABEL[granularidade];
  const fechados = `${kpis.periodosFechados} ${kpis.periodosFechados === 1 ? singular : plural}`;

  // Todo cartao tem a mesma forma: rotulo, numero e duas linhas de rodape.
  const items: {
    icon: typeof Factory;
    label: string;
    valor: string;
    linha1: ReactNode;
    linha2: ReactNode;
    destaque?: boolean;
  }[] = [
    {
      icon: Factory,
      label: "Total do período",
      valor: formatarValor(kpis.total, unidade),
      linha1: <Variacao valor={kpis.variacaoTotal} sufixo={`vs ${fechados} antes`} />,
      linha2:
        kpis.emAndamento !== null
          ? `+ ${formatarValor(kpis.emAndamento, unidade)} em andamento`
          : textoPeriodo,
      destaque: true,
    },
    {
      icon: Repeat,
      label: `Média por ${singular}`,
      valor: formatarValor(kpis.media, unidade),
      linha1: `antes: ${formatarValor(kpis.mediaAnterior, unidade)}`,
      linha2: `em ${fechados}`,
    },
    {
      icon: CalendarDays,
      label: "Dias com produção",
      valor: `${kpis.diasComProducao} ${kpis.diasComProducao === 1 ? "dia" : "dias"}`,
      linha1: `${formatarValor(kpis.porDiaProduzido, unidade)} por dia produzido`,
      linha2: `de ${kpis.diasNoPeriodo} dias no período`,
    },
    {
      icon: Trophy,
      label: `Melhor ${singular}`,
      valor: kpis.melhor ? formatarValor(kpis.melhor.valor, unidade) : "—",
      linha1: kpis.melhor ? kpis.melhor.labelLongo : "sem produção no período",
      linha2: kpis.pior
        ? `pior: ${kpis.pior.label} · ${formatarValor(kpis.pior.valor, unidade)}`
        : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(item => (
        <Card
          key={item.label}
          className={cn("min-w-0", item.destaque && "border-primary/40 bg-primary/5")}
        >
          {/* "p-4 sm:p-5" e nao "p-3": o CardContent traz "sm:pt-0" de fabrica, e sem
              o "sm:" aqui o topo ficava em zero no computador (rotulo colado na borda). */}
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            {/* Enquanto os dados nao chegam, barra cinza no lugar do numero:
                "0 un" na tela parece dado de verdade. */}
            {loading ? (
              <Skeleton className="mt-2 h-7 w-28 md:h-8" />
            ) : (
              <p
                className={cn(
                  "mt-2 truncate text-xl font-bold leading-tight tabular-nums md:text-2xl",
                  item.destaque && "text-primary"
                )}
              >
                {item.valor}
              </p>
            )}
            {/* Duas linhas de altura fixa: mesmo vazia, a linha ocupa o lugar,
                e os quatro cartoes terminam na mesma altura. */}
            <div className="mt-2 space-y-0.5 text-xs">
              <div className="h-4 truncate leading-4 text-muted-foreground">
                {loading ? <Skeleton className="h-3 w-32" /> : item.linha1}
              </div>
              <div className="h-4 truncate leading-4 text-muted-foreground">
                {loading ? <Skeleton className="h-3 w-24" /> : item.linha2}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
