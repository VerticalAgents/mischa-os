import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Factory, CalendarDays, Repeat, CheckCircle2 } from "lucide-react";
import { formatarValor, UnidadeMedida } from "@/hooks/useProducaoDashboard";
import { cn } from "@/lib/utils";

interface ProducaoKpiStripProps {
  unidade: UnidadeMedida;
  textoPeriodo: string;
  kpis: {
    total: number;
    variacaoPeriodo: number;
    mesAtual: number;
    variacaoMes: number;
    mesmoMesAnoPassado: number;
    variacaoAno: number;
    mediaSemanal: number;
    taxaConfirmacao: number;
    rendimentoMedio: number;
    mesAnoPassadoLabel: string;
  };
}

function Variacao({ valor, sufixo }: { valor: number; sufixo: string }) {
  const positivo = valor >= 0;
  return (
    <div className="flex items-center gap-1 text-xs">
      {positivo ? (
        <TrendingUp className="h-3 w-3 text-green-600" />
      ) : (
        <TrendingDown className="h-3 w-3 text-destructive" />
      )}
      <span className={cn("font-medium", positivo ? "text-green-600" : "text-destructive")}>
        {Math.abs(valor).toFixed(1)}%
      </span>
      <span className="text-muted-foreground truncate">{sufixo}</span>
    </div>
  );
}

export default function ProducaoKpiStrip({ unidade, textoPeriodo, kpis }: ProducaoKpiStripProps) {
  const items = [
    {
      icon: Factory,
      label: textoPeriodo,
      valor: formatarValor(kpis.total, unidade),
      rodape: <Variacao valor={kpis.variacaoPeriodo} sufixo="vs período anterior" />,
      destaque: true,
    },
    {
      icon: CalendarDays,
      label: "Mês atual",
      valor: formatarValor(kpis.mesAtual, unidade),
      rodape: (
        <>
          <Variacao valor={kpis.variacaoMes} sufixo="vs mês anterior" />
          <p className="text-[11px] text-muted-foreground truncate">mês em andamento</p>
        </>
      ),
    },
    {
      icon: Repeat,
      label: "Média semanal",
      valor: formatarValor(kpis.mediaSemanal, unidade),
      rodape: (
        <p className="text-xs text-muted-foreground truncate">
          {kpis.mesAnoPassadoLabel}: {formatarValor(kpis.mesmoMesAnoPassado, unidade)}
        </p>
      ),
    },
    {
      icon: CheckCircle2,
      label: "Taxa de confirmação",
      valor: `${kpis.taxaConfirmacao.toFixed(0)}%`,
      rodape: (
        <p className="text-xs text-muted-foreground truncate">
          Rendimento médio {kpis.rendimentoMedio.toFixed(1)}%
        </p>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(item => (
        <Card
          key={item.label}
          className={cn("h-full", item.destaque && "border-primary/40 bg-primary/5")}
        >
          <CardContent className="flex h-full flex-col p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            <p
              className={cn(
                "mt-1 truncate text-xl font-bold tabular-nums md:text-2xl",
                item.destaque && "text-primary"
              )}
            >
              {item.valor}
            </p>
            {/* Faixa de altura fixa, com o conteudo encostado embaixo: os cartoes
                tem numero diferente de linhas de rodape, e sem isso a ultima linha
                de cada um para numa altura diferente. */}
            <div className="mt-1 flex min-h-[2.25rem] flex-col justify-end gap-0.5">
              {item.rodape}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
