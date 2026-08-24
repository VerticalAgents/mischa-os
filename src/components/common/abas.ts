import { cn } from "@/lib/utils";

/**
 * A barra de abas das telas de módulo (Expedição, Agendamento…).
 *
 * Mora aqui porque as duas telas tinham a MESMA barra escrita duas vezes — e
 * duas cópias são duas coisas que um dia divergem. Foi o que aconteceu com o
 * menu lateral e com a barra inferior antes desta sessão.
 *
 * A barra é BLOCO e as abas são CONTROLES dentro dela. O padrão do componente
 * `Tabs` é `bg-muted`, que neste tema é exatamente a cor do chão da aplicação
 * (`--app-ground` = `--muted`): a barra sumia no fundo e só a aba ativa
 * aparecia.
 */
export const BARRA_ABAS =
  "h-auto rounded-bloco border border-border bg-card p-1.5 shadow-tema";

/**
 * A aba acesa usa a MESMA pílula do item aceso do menu lateral e da barra
 * inferior: marca da casa a 12% + luz interna no topo, no raio de marcação.
 * Um jeito só de dizer "você está aqui" no app inteiro.
 *
 * Aqui a marcação vem do `data-state` do próprio Radix, e não de uma classe
 * calculada em JS: o componente já traz um `data-[state=active]:bg-*` e, como
 * as duas regras têm a mesma força, a última da folha vence — a pílula existe
 * no HTML e não pinta nada.
 */
export const ABA = cn(
  "rounded-pilula px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[1px]",
  "transition-all duration-200 ease-out-expo",
  "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  "data-[state=active]:bg-brand-500/[.12] data-[state=active]:text-brand-700",
  "data-[state=active]:shadow-[inset_0_1px_0_#ffffffb3]",
  "dark:data-[state=active]:text-brand-400",
  "dark:data-[state=active]:shadow-[inset_0_1px_0_#ffffff0f]"
);

/** Mesma aba, para botão comum (celular), onde não existe `data-state`. */
export const abaManual = (aceso: boolean) =>
  cn(
    "rounded-pilula px-3 py-2 min-h-[44px] text-[0.7rem] font-semibold uppercase tracking-[1px]",
    "transition-all duration-200 ease-out-expo",
    aceso
      ? "bg-brand-500/[.12] text-brand-700 shadow-[inset_0_1px_0_#ffffffb3] dark:text-brand-400 dark:shadow-[inset_0_1px_0_#ffffff0f]"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  );

/** Casca da grade de abas no celular. */
export const GRADE_ABAS_CELULAR =
  "grid grid-cols-2 gap-1.5 rounded-bloco border border-border bg-card p-1.5 shadow-tema lg:hidden";
