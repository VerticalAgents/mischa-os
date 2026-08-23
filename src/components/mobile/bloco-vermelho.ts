import { cn } from "@/lib/utils";

/**
 * O vermelho da Mischa's como superfície de bloco.
 *
 * O DESIGN.md do Unno usa `bg-card` claro nos blocos de navegação; aqui o menu
 * lateral trocou por `#d1193a` para não perder a identidade. A gaveta que sobe
 * no celular é o mesmo menu em outra orientação, então segue as mesmas regras —
 * e elas moram aqui porque os dois portais têm essa gaveta.
 *
 * Sobre vermelho não existe token semântico que sirva: `text-muted-foreground`
 * é cinza escuro e some. Tudo vira branco com opacidade.
 */

export const VERMELHO = "#d1193a";
export const BORDA_INTERNA = "rgba(255,255,255,0.15)";

/** Rótulo de interface: maiúscula espaçada. */
export const ROTULO_BLOCO = "text-[0.7rem] font-semibold uppercase tracking-[1px]";

/**
 * Azulejo da gaveta. Aceso = branco a 18% com luz interna no topo, o mesmo
 * relevo do item aceso no menu lateral — a forma se lê antes da cor.
 */
export const azulejoVermelho = (aceso: boolean) =>
  cn(
    "flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-[22px] px-2 py-3",
    "text-center transition-all duration-200 ease-out-expo active:scale-[0.97] active:duration-press",
    aceso
      ? "bg-white/[.18] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      : "bg-white/[.08] text-white/80"
  );

/** Linha de ação do rodapé da gaveta (tema, sair). */
export const linhaVermelha = cn(
  "flex flex-1 items-center justify-center gap-2 rounded-controle px-3 py-2.5",
  ROTULO_BLOCO,
  "text-white/80 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
);

/**
 * Casca da gaveta. O `[&>div:first-child]` pinta a alcinha que o próprio
 * componente Drawer desenha — ela nasce `bg-muted` e sobre vermelho sumiria.
 */
export const gavetaVermelha = cn(
  "lg:hidden max-h-[88vh] rounded-t-[28px] p-0 text-white",
  "[&>div:first-child]:bg-white/40"
);
