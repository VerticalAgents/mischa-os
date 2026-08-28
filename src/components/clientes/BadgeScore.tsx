import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import {
  ROTULO_CLASSIFICACAO,
  type Classificacao,
  type ScoreFinanceiro,
} from "@/utils/scoreFinanceiro";
import { cn } from "@/lib/utils";

/**
 * A marca visual da nota de pagamento, num lugar só.
 *
 * Usada na lista de clientes e no detalhe. As cores moram aqui porque a mesma
 * classificação precisa ter a mesma cor nas duas telas — se cada uma tivesse a
 * sua paleta, "Atenção" seria âmbar numa e outra coisa na outra.
 *
 * Toda variante declara os dois temas (seção 12 do DESIGN.md). No escuro,
 * `text-destructive` é um vermelho fechado que some no fundo — daí o
 * `dark:text-red-400`.
 */
export const CORES_CLASSIFICACAO: Record<Classificacao, string> = {
  excelente:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  bom: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  atencao: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  risco: "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-400",
  "sem-historico": "border-border bg-muted/40 text-muted-foreground",
};

export const TEXTO_ALERTA = "text-destructive dark:text-red-400";

export default function BadgeScore({
  score,
  compacto = false,
}: {
  score?: ScoreFinanceiro | null;
  compacto?: boolean;
}) {
  // Cliente sem vínculo com o GestãoClick não tem título nenhum — não é
  // "sem histórico", é ausência de fonte. Um traço diz isso sem alarmar.
  if (!score) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const semNota = score.classificacao === "sem-historico";

  /**
   * Na lista, "70 · Risco" lido sozinho parece contradição: o número é
   * razoável e o rótulo condena. Quem explica é a dívida em aberto, que
   * limita a classificação — então ela precisa estar dita aqui, e não só no
   * card de detalhe.
   */
  const explicacao = semNota
    ? "Poucos pagamentos registrados para uma nota confiável"
    : [
        `${score.score} de 100`,
        `${score.percentualValorEmDia.toFixed(0)}% do valor pago no prazo`,
        score.valorVencido > 0
          ? `título vencido em aberto há ${score.maiorAtrasoEmAberto} dia${score.maiorAtrasoEmAberto === 1 ? "" : "s"}, o que limita a classificação`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-pilula font-medium tabular-nums",
        CORES_CLASSIFICACAO[score.classificacao]
      )}
      title={explicacao}
    >
      {semNota
        ? "Sem histórico"
        : compacto
          ? score.score
          : `${score.score} · ${ROTULO_CLASSIFICACAO[score.classificacao]}`}
      {!semNota && score.valorVencido > 0 && (
        <AlertTriangle className="ml-1 inline h-3 w-3 align-[-1px]" aria-hidden />
      )}
    </Badge>
  );
}
