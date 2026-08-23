import {
  ReactNode,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEhCelular } from "@/hooks/useEhCelular";
import PageSkeleton from "@/components/layout/PageSkeleton";

/**
 * Gestos de celular: arrastar para o lado troca de página, puxar do topo recarrega.
 *
 * Nas rotas da barra inferior isto é um CARROSSEL de verdade: as páginas
 * vizinhas já estão montadas, lado a lado, e o arrasto move as três juntas — no
 * meio do caminho fica metade de cada uma na tela. A alternativa (animar só a
 * página que entra, depois de navegar) apenas desloca o conteúdo e mostra um
 * vazio no lugar da próxima, porque ela ainda nem existe.
 *
 * O preço é montar até três páginas ao mesmo tempo. Para o custo não cair no
 * carregamento inicial, a vizinha só é montada meio segundo DEPOIS que a página
 * atual assenta — a essa altura o dedo nem chegou perto da tela, mas quando
 * chegar a página já está pronta.
 *
 * Cada página tem a própria rolagem vertical, como aba de app nativo: voltar
 * para uma aba te devolve onde você estava nela.
 *
 * O cuidado que faz a diferença é saber quando NÃO agir. O app é cheio de
 * tabela larga e gráfico que rolam para o lado; se o gesto fosse capturado
 * sempre, arrastar uma tabela trocaria de página. Por isso, ao encostar o dedo,
 * subimos a árvore procurando um ancestral que role na horizontal — achou, o
 * gesto é dele.
 */

/** Fração da largura da tela que decide a troca no soltar. */
const FRACAO_LIMIAR = 0.25;
/** Ou um puxão rápido: px por milissegundo. */
const VELOCIDADE_LIMIAR = 0.45;
/** O movimento precisa ser claramente mais horizontal que vertical. */
const DOMINANCIA = 1.4;
/** Eixo indefinido até o dedo andar isso. */
const ZONA_MORTA = 10;
/** Quanto puxar do topo para recarregar. */
const LIMIAR_PUXADA = 68;
/** Teto do arrasto visível: puxar mais não estica mais. */
const TETO_PUXADA = 96;
/** Atraso até montar a vizinha nova — depois da animação, não durante. */
const ATRASO_VIZINHA = 500;

const SUAVE = [0.16, 1, 0.3, 1] as const; // out-expo, o padrão da casa

type Eixo = null | "x" | "y";
type Registro = Record<string, LazyExoticComponent<ComponentType>>;

function acharRolagem(inicio: HTMLElement | null): HTMLElement | null {
  let no = inicio;
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
  /** Componente de página de cada rota, para montar as vizinhas. */
  paginas: Registro;
  /** Classes do respiro interno — as mesmas que o layout usaria. */
  classeConteudo: string;
  children: ReactNode;
}

export default function AreaGestos({ rotas, paginas, classeConteudo, children }: AreaGestosProps) {
  const ehCelular = useEhCelular();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const caixaRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const puxada = useMotionValue(0);
  const [recarregando, setRecarregando] = useState(false);

  const giro = useTransform(puxada, [0, TETO_PUXADA], [0, 300]);
  const escala = useTransform(puxada, [0, LIMIAR_PUXADA], [0.6, 1]);
  const opacidade = useTransform(puxada, [0, 24, LIMIAR_PUXADA], [0, 0.5, 1]);

  const indice = rotas.findIndex((r) => pathname === r || pathname.startsWith(r + "/"));
  const ehCarrossel = ehCelular && indice >= 0 && rotas.every((r) => paginas[r]);

  // Centro "atrasado" da janela do que fica montado. As posições seguem o
  // índice real na hora; o que MONTA espera a animação acabar.
  const [centroMontagem, setCentroMontagem] = useState(indice);
  useEffect(() => {
    if (indice < 0) return;
    const t = window.setTimeout(() => setCentroMontagem(indice), ATRASO_VIZINHA);
    return () => window.clearTimeout(t);
  }, [indice]);

  // Ao trocar de rota o trilho volta ao zero ANTES da pintura: as posições dos
  // slots já mudaram 100%, e sem isso apareceria um quadro deslocado.
  useLayoutEffect(() => {
    x.set(0);
  }, [pathname, x]);

  useEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa || !ehCelular) return;

    let x0 = 0;
    let y0 = 0;
    let ultimoX = 0;
    let ultimoTempo = 0;
    let velocidade = 0;
    let eixo: Eixo = null;
    let ativo = false;
    let rolagem: HTMLElement | null = null;
    let puxando = false;

    const largura = () => caixa.clientWidth || window.innerWidth;

    const aoEncostar = (e: TouchEvent) => {
      if (e.touches.length !== 1 || recarregando) return;
      ativo = !gestoEhDeOutro(e.target, caixa);
      if (!ativo) return;
      x0 = ultimoX = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      ultimoTempo = e.timeStamp;
      velocidade = 0;
      eixo = null;
      puxando = false;
      rolagem = acharRolagem(e.target as HTMLElement);
    };

    const aoMover = (e: TouchEvent) => {
      if (!ativo || e.touches.length !== 1) return;
      const px = e.touches[0].clientX;
      const dx = px - x0;
      const dy = e.touches[0].clientY - y0;

      if (eixo === null) {
        if (Math.abs(dx) < ZONA_MORTA && Math.abs(dy) < ZONA_MORTA) return;
        if (Math.abs(dx) > Math.abs(dy) * DOMINANCIA) {
          eixo = ehCarrossel ? "x" : null;
          if (eixo === null) ativo = false;
        } else {
          eixo = "y";
          puxando = dy > 0 && estaNoTopo(rolagem);
          if (!puxando) ativo = false;
        }
        if (!ativo) return;
      }

      if (eixo === "x") {
        if (e.cancelable) e.preventDefault();
        const dt = e.timeStamp - ultimoTempo;
        if (dt > 0) velocidade = (px - ultimoX) / dt;
        ultimoX = px;
        ultimoTempo = e.timeStamp;

        // Sem vizinha daquele lado, o arrasto vira borracha: anda pouco e
        // avisa pelo próprio movimento que ali acabou.
        const semDestino = (dx < 0 && indice >= rotas.length - 1) || (dx > 0 && indice <= 0);
        x.set(semDestino ? dx * 0.25 : dx);
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
      const eixoFinal = eixo;
      ativo = false;

      if (eixoFinal === "x") {
        const L = largura();
        const avancar = deslocou < 0;
        const destino = avancar ? indice + 1 : indice - 1;
        const rapido =
          Math.abs(velocidade) > VELOCIDADE_LIMIAR &&
          Math.sign(velocidade) === Math.sign(deslocou);
        const passou = Math.abs(deslocou) > L * FRACAO_LIMIAR || rapido;

        if (passou && destino >= 0 && destino < rotas.length) {
          animate(x, avancar ? -L : L, {
            duration: 0.3,
            ease: SUAVE,
            onComplete: () => navegar(rotas[destino]),
          });
          return;
        }
        animate(x, 0, { duration: 0.3, ease: SUAVE });
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
  }, [ehCelular, ehCarrossel, indice, rotas, navegar, recarregando, x, puxada]);

  const indicador = (
    <motion.div
      style={{ y: puxada, scale: escala, opacity: opacidade }}
      className="pointer-events-none flex justify-center"
      aria-hidden
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-tema">
        {recarregando ? (
          <RefreshCw className="h-5 w-5 animate-spin text-brand-600" />
        ) : (
          <motion.span style={{ rotate: giro }} className="flex">
            <RefreshCw className="h-5 w-5 text-brand-600" />
          </motion.span>
        )}
      </div>
    </motion.div>
  );

  if (!ehCelular) return <>{children}</>;

  // Fora das rotas da barra não há para onde arrastar: sobra o puxar do topo.
  if (!ehCarrossel) {
    return (
      <div ref={caixaRef} className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-12 z-30">{indicador}</div>
        <motion.div style={{ y: puxada }}>{children}</motion.div>
      </div>
    );
  }

  return (
    <div ref={caixaRef} className="fixed inset-0 z-10 overflow-hidden lg:hidden">
      <div className="pointer-events-none absolute inset-x-0 top-3 z-30">{indicador}</div>

      <motion.div className="absolute inset-0" style={{ x }}>
        {rotas.map((rota, j) => {
          const Pagina = paginas[rota];
          const montada = Math.abs(j - centroMontagem) <= 1 || j === indice;
          return (
            <div
              key={rota}
              className="absolute inset-y-0 w-full overflow-y-auto overscroll-contain espaco-cabecalho-flutuante espaco-barra-flutuante [-webkit-overflow-scrolling:touch]"
              style={{ left: `${(j - indice) * 100}%` }}
              aria-hidden={j !== indice}
            >
              {montada && (
                <motion.div
                  className={classeConteudo}
                  style={j === indice ? { y: puxada } : undefined}
                >
                  <Suspense fallback={<PageSkeleton />}>
                    <Pagina />
                  </Suspense>
                </motion.div>
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
