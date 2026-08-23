import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEhCelular } from "@/hooks/useEhCelular";

/**
 * Gestos de celular: arrastar para o lado troca de página, puxar do topo recarrega.
 *
 * As duas coisas dividem os mesmos ouvintes de toque porque são o mesmo gesto em
 * eixos diferentes — e porque decidir o eixo UMA vez, nos primeiros 10px, é o
 * que impede uma rolagem vertical de virar navegação sem querer.
 *
 * O cuidado que faz a diferença aqui é saber quando NÃO agir. O app é cheio de
 * tabela larga e gráfico que rolam para o lado; se o gesto fosse capturado
 * sempre, arrastar uma tabela trocaria de página. Por isso, ao encostar o dedo,
 * subimos a árvore procurando um ancestral que role na horizontal — achou, o
 * gesto é dele.
 */

/** Distância mínima para valer como troca de página. */
const LIMIAR_LATERAL = 64;
/** O movimento precisa ser claramente mais horizontal que vertical. */
const DOMINANCIA = 1.4;
/** Eixo indefinido até o dedo andar isso. */
const ZONA_MORTA = 10;
/** Quanto puxar do topo para recarregar. */
const LIMIAR_PUXADA = 68;
/** Teto do arrasto visível: puxar mais não estica mais. */
const TETO_PUXADA = 96;

const SUAVE = [0.16, 1, 0.3, 1] as const; // out-expo, o padrão da casa

type Eixo = null | "x" | "y";

function acharRolagem(inicio: HTMLElement | null): HTMLElement | null {
  let no = inicio?.parentElement ?? null;
  while (no) {
    const estilo = getComputedStyle(no);
    if (/(auto|scroll|overlay)/.test(estilo.overflowY) && no.scrollHeight > no.clientHeight) {
      return no;
    }
    no = no.parentElement;
  }
  return null;
}

function estaNoTopo(caixa: HTMLElement | null) {
  const alvo = caixa ?? document.scrollingElement ?? document.documentElement;
  return alvo.scrollTop <= 0;
}

/** O gesto é de outro elemento? Tabela larga, gráfico, campo, diálogo aberto. */
function gestoEhDeOutro(alvo: EventTarget | null, limite: HTMLElement) {
  if (document.body.hasAttribute("data-scroll-locked")) return true;
  if (document.querySelector('[role="dialog"][data-state="open"]')) return true;

  let no = alvo as HTMLElement | null;
  while (no && no !== limite) {
    if (no.dataset?.semGesto !== undefined) return true;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(no.tagName)) return true;
    if (no.scrollWidth > no.clientWidth + 4) {
      const estilo = getComputedStyle(no);
      if (/(auto|scroll)/.test(estilo.overflowX)) return true;
    }
    no = no.parentElement;
  }
  return false;
}

interface AreaGestosProps {
  /** Rotas da barra inferior, na ordem em que aparecem nela. */
  rotas: string[];
  children: ReactNode;
}

export default function AreaGestos({ rotas, children }: AreaGestosProps) {
  const ehCelular = useEhCelular();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const caixaRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const puxada = useMotionValue(0);
  const [direcao, setDirecao] = useState(1);
  const [recarregando, setRecarregando] = useState(false);

  const giro = useTransform(puxada, [0, TETO_PUXADA], [0, 300]);
  const escala = useTransform(puxada, [0, LIMIAR_PUXADA], [0.6, 1]);
  const opacidade = useTransform(puxada, [0, 24, LIMIAR_PUXADA], [0, 0.5, 1]);

  useEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa || !ehCelular) return;

    let x0 = 0;
    let y0 = 0;
    let eixo: Eixo = null;
    let ativo = false;
    let rolagem: HTMLElement | null = null;
    let puxando = false;

    const indiceAtual = () => rotas.findIndex((r) => pathname === r || pathname.startsWith(r + "/"));

    const aoEncostar = (e: TouchEvent) => {
      if (e.touches.length !== 1 || recarregando) return;
      ativo = !gestoEhDeOutro(e.target, caixa);
      if (!ativo) return;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      eixo = null;
      puxando = false;
      rolagem = acharRolagem(caixa);
    };

    const aoMover = (e: TouchEvent) => {
      if (!ativo || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - x0;
      const dy = e.touches[0].clientY - y0;

      if (eixo === null) {
        if (Math.abs(dx) < ZONA_MORTA && Math.abs(dy) < ZONA_MORTA) return;
        if (Math.abs(dx) > Math.abs(dy) * DOMINANCIA) {
          eixo = indiceAtual() >= 0 ? "x" : null;
          if (eixo === null) ativo = false;
        } else {
          eixo = "y";
          puxando = dy > 0 && estaNoTopo(rolagem);
          if (!puxando) ativo = false;
        }
        if (!ativo) return;
      }

      if (eixo === "x") {
        // Segurar o arrasto vertical enquanto o gesto é claramente horizontal,
        // senão a página rola junto e o movimento fica torto.
        if (e.cancelable) e.preventDefault();
        x.set(dx * 0.55);
        return;
      }

      if (puxando) {
        if (dy <= 0) {
          puxada.set(0);
          return;
        }
        if (e.cancelable) e.preventDefault();
        // Resistência: os primeiros centímetros andam, o resto vai secando.
        puxada.set(Math.min(TETO_PUXADA, dy * 0.5));
      }
    };

    const aoSoltar = () => {
      if (!ativo) return;
      const deslocou = x.get();
      const puxou = puxada.get();
      ativo = false;

      if (eixo === "x") {
        const i = indiceAtual();
        const avancar = deslocou < 0;
        const destino = avancar ? i + 1 : i - 1;
        const passou = Math.abs(deslocou) > LIMIAR_LATERAL * 0.55;

        if (passou && destino >= 0 && destino < rotas.length) {
          setDirecao(avancar ? 1 : -1);
          navegar(rotas[destino]);
        }
        animate(x, 0, { duration: 0.26, ease: SUAVE });
        return;
      }

      if (puxando) {
        if (puxou >= LIMIAR_PUXADA) {
          setRecarregando(true);
          animate(puxada, LIMIAR_PUXADA, { duration: 0.12 });
          window.setTimeout(() => window.location.reload(), 220);
          return;
        }
        animate(puxada, 0, { duration: 0.24, ease: SUAVE });
      }
    };

    caixa.addEventListener("touchstart", aoEncostar, { passive: true });
    caixa.addEventListener("touchmove", aoMover, { passive: false });
    caixa.addEventListener("touchend", aoSoltar, { passive: true });
    caixa.addEventListener("touchcancel", aoSoltar, { passive: true });

    return () => {
      caixa.removeEventListener("touchstart", aoEncostar);
      caixa.removeEventListener("touchmove", aoMover);
      caixa.removeEventListener("touchend", aoSoltar);
      caixa.removeEventListener("touchcancel", aoSoltar);
    };
  }, [ehCelular, pathname, rotas, navegar, recarregando, x, puxada]);

  if (!ehCelular) return <>{children}</>;

  return (
    <motion.div ref={caixaRef} style={{ x }} className="relative">
      {/* Indicador de recarregar: nasce do topo, gira conforme o dedo puxa. */}
      <motion.div
        style={{ y: puxada, scale: escala, opacity: opacidade }}
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
        aria-hidden
      >
        <div className="-mt-12 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-tema">
          {recarregando ? (
            <RefreshCw className="h-5 w-5 animate-spin text-brand-600" />
          ) : (
            <motion.span style={{ rotate: giro }} className="flex">
              <RefreshCw className="h-5 w-5 text-brand-600" />
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* O conteúdo desce junto com o dedo. Sem isso o indicador apareceria por
          cima do primeiro cartão, e o gesto não teria para onde "abrir". */}
      <motion.div style={{ y: puxada }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ x: direcao * 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direcao * -32, opacity: 0 }}
            transition={{ duration: 0.22, ease: SUAVE }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
