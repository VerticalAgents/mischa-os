import { Link, useLocation } from "react-router-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBarraDoNavegador } from "@/hooks/useBarraDoNavegador";

/**
 * Barra inferior do celular — seção 8 do DESIGN.md do Unno.
 *
 * Cápsula flutuante com desfoque, presa acima da faixa do gesto de home. Uma só
 * para os dois portais: o app completo e o do representante passam itens
 * diferentes e recebem a mesma barra.
 *
 * Dois detalhes que o documento faz questão de explicar:
 *
 * - `flex-1 min-w-0` no item. Sem o `min-w-0` é o rótulo que define a largura, e
 *   num aparelho de 360px o quinto item sai da tela.
 * - `env()` mora na folha de estilo (`.barra-flutuante`), nunca em estilo em
 *   linha — o WebKit do iOS descarta `env()` aplicado por JavaScript, e foi
 *   assim que a faixa do gesto de home acabou desenhada por cima dos rótulos.
 */

export interface ItemBarra {
  path: string;
  label: string;
  Icon: LucideIcon;
}

interface BarraInferiorProps {
  itens: ItemBarra[];
  maisAberto: boolean;
  aoAbrirMais: () => void;
}

/**
 * A pílula marca onde você está sem depender só da cor: com a tela suja, a
 * forma se lê antes. Marca a 12%, não cheia — menta cheia grita mais que a
 * página. E a luz interna no topo é o relevo do cartão, o mesmo do menu.
 *
 * Ela é UM elemento só, que troca de lugar. Ao arrastar para o lado, a rota só
 * muda quando o trilho termina a viagem — então a pílula desliza exatamente no
 * instante em que a página nova chega, e é isso que diz "trocou". Curta de
 * propósito: 180ms. Marcação demorada vira enfeite e some do olhar.
 */
const IDENTIDADE_PILULA = "pilula-barra-inferior";

const classeItem = (aceso: boolean) =>
  cn(
    "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1",
    "min-h-[52px] rounded-[22px] transition-colors duration-200 ease-out-expo",
    "active:scale-[0.97] active:duration-press",
    aceso ? "text-brand-700 dark:text-brand-400" : "text-muted-foreground"
  );

const CLASSE_PILULA = cn(
  // Vem antes do ícone no DOM e o ícone é relative: pinta atrás sem z-index.
  "absolute inset-0 rounded-[22px] bg-brand-500/[.12]",
  "shadow-[inset_0_1px_0_#ffffffb3] dark:shadow-[inset_0_1px_0_#ffffff0f]"
);

const ROTULO = "relative max-w-full truncate text-[10px] font-semibold uppercase tracking-[1px]";

export default function BarraInferior({ itens, maisAberto, aoAbrirMais }: BarraInferiorProps) {
  const { pathname } = useLocation();
  const semMovimento = useReducedMotion();
  useBarraDoNavegador();

  // Uma pílula só na barra inteira. Com a gaveta aberta ela vai para "Mais" —
  // duas com a mesma identidade fariam o framer não saber qual animar.
  const rotaAcesa = itens.find(
    (i) => pathname === i.path || pathname.startsWith(i.path + "/")
  )?.path;
  const alvo = maisAberto ? "__mais" : rotaAcesa;

  const pilula = (
    <motion.span
      layoutId={IDENTIDADE_PILULA}
      className={CLASSE_PILULA}
      transition={semMovimento ? { duration: 0 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden
    />
  );

  return (
    <nav
      className={cn(
        "barra-flutuante fixed left-3 right-3 z-40 flex items-stretch gap-1 p-1.5 lg:hidden",
        "rounded-bloco border border-black/[.06] dark:border-white/[.08]",
        "bg-white/85 backdrop-blur-xl dark:bg-card/85",
        "shadow-[0_6px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.5)]"
      )}
    >
      {itens.map(({ path, label, Icon }) => {
        const aceso = alvo === path;
        return (
          <Link key={path} to={path} className={classeItem(aceso)}>
            {aceso && pilula}
            <Icon className="relative h-6 w-6 shrink-0" strokeWidth={aceso ? 2 : 1.6} />
            <span className={ROTULO}>{label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={aoAbrirMais}
        aria-label="Mais opções"
        className={classeItem(alvo === "__mais")}
      >
        {alvo === "__mais" && pilula}
        <MoreHorizontal
          className="relative h-6 w-6 shrink-0"
          strokeWidth={maisAberto ? 2 : 1.6}
        />
        <span className={ROTULO}>Mais</span>
      </button>
    </nav>
  );
}
