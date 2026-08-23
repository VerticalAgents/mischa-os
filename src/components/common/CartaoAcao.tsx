import { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * O cartão de atalho da Início — seções 9 e 11 do DESIGN.md do Unno.
 *
 * Existe como componente porque os atalhos estavam escritos três vezes (Ações
 * Rápidas, Sistema, Manual) com estruturas diferentes: ícone de 40px num, de
 * 56px no outro, respiros e tamanhos de texto distintos. Lado a lado na mesma
 * grade, isso é o desalinhamento que se vê antes de saber explicar.
 *
 * Duas regras do documento que valem destacar:
 *
 * - `h-full` + `mt-auto` no rodapé. A grade estica as células, mas o cartão
 *   dentro dela encolhe até o conteúdo se ninguém mandar o contrário — é por
 *   isso que dois cartões vizinhos terminavam em alturas diferentes.
 * - O "levantar" no hover fica atrás de `[@media(hover:hover)]`. Em tela de
 *   toque não existe hover de verdade: o iOS aplica o estado ao tocar e o deixa
 *   grudado até o próximo toque em outro lugar.
 */

interface CartaoAcaoProps {
  titulo: string;
  descricao: string;
  Icone: LucideIcon;
  aoClicar: () => void;
  /** Texto do rodapé. "Acessar" na maioria dos casos. */
  rotuloAcao?: string;
  distintivo?: string;
  /** `alerta` para o que pede ação; `marca` para contagem. */
  tomDistintivo?: "marca" | "alerta";
  /** Conteúdo extra acima do rodapé — barra de progresso, por exemplo. */
  extra?: ReactNode;
}

export default function CartaoAcao({
  titulo,
  descricao,
  Icone,
  aoClicar,
  rotuloAcao = "Acessar",
  distintivo,
  tomDistintivo = "marca",
  extra,
}: CartaoAcaoProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={aoClicar}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          aoClicar();
        }
      }}
      className={cn(
        "group flex h-full cursor-pointer flex-col bg-card shadow-tema",
        "transition-all duration-300 ease-out-expo",
        "[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-tema-md",
        "active:translate-y-px active:duration-press"
      )}
    >
      <CardHeader className="space-y-0 p-5 pb-3 sm:p-5 sm:pb-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          {/* Raio de CONTROLE no ícone: o cartão é o bloco, o ícone é peça dentro dele. */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-controle bg-brand-500/[.12] text-brand-700 transition-transform duration-300 ease-out-expo group-hover:scale-105 dark:text-brand-400">
            <Icone className="size-5" strokeWidth={1.8} />
          </div>
          {distintivo && (
            <Badge
              className={cn(
                "shrink-0 rounded-full px-3 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide",
                tomDistintivo === "alerta"
                  ? "bg-destructive/10 text-destructive dark:bg-destructive/25 dark:text-destructive-foreground"
                  : "bg-brand-500/[.12] text-brand-700 dark:text-brand-400"
              )}
            >
              {distintivo}
            </Badge>
          )}
        </div>
        <CardTitle className="text-left text-sm font-semibold leading-snug">{titulo}</CardTitle>
        <CardDescription className="pt-1 text-left text-xs leading-snug">
          {descricao}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto p-5 pt-0 sm:p-5 sm:pt-0">
        {extra}
        <div className="flex items-center text-[0.7rem] font-semibold uppercase tracking-[1px] text-muted-foreground transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-400">
          <span>{rotuloAcao}</span>
          <ChevronRight className="ml-1 size-3.5 transition-transform duration-200 ease-out-expo group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  );
}
