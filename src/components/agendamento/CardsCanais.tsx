import { Store, UtensilsCrossed, Factory, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Canal, NumerosCanal, ResumoCanais } from "@/utils/canalVenda";

interface CardsCanaisProps {
  resumo: ResumoCanais;
  canalFiltro: Canal | null;
  onChangeCanal: (canal: Canal | null) => void;
  /** Como o número grande é formado (depende de incluir ou não as previstas). */
  legendaTotal: string;
}

export const ROTULO_CANAL: Record<Canal, string> = {
  revenda: "Revenda",
  food_service: "Food service",
  terceirizacao: "Terceirizações",
};

const inteiro = (n: number) => Math.round(n).toLocaleString("pt-BR");
const decimal = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** "500 confirmadas · 5.760 previstas", só com o que existe. */
const partes = (n: NumerosCanal, fmt: (v: number) => string) =>
  [
    n.confirmadas > 0 ? `${fmt(n.confirmadas)} confirmadas` : null,
    n.previstas > 0 ? `${fmt(n.previstas)} previstas` : null,
    n.entregues > 0 ? `${fmt(n.entregues)} entregues` : null,
  ].filter(Boolean).join(" · ");

const LinhaDetalhe = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
  <div className="flex items-baseline justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{rotulo}</span>
    <span className="font-medium tabular-nums text-foreground">{valor}</span>
  </div>
);

/**
 * Os três canais da semana, lado a lado. Existem porque o total único escondia a
 * revenda e o food service atrás da Odara. Cada card também é o filtro da tela:
 * clicou, gráficos, calendário e lista do dia passam a mostrar só aquele canal.
 */
export default function CardsCanais({ resumo, canalFiltro, onChangeCanal, legendaTotal }: CardsCanaisProps) {
  const alternar = (canal: Canal) => onChangeCanal(canalFiltro === canal ? null : canal);

  // O botão é o alvo do mouse e fica parado; quem sobe no hover é a casca de dentro.
  // Com o hover e o movimento no mesmo elemento, o cursor na borda de baixo saía do
  // card assim que ele subia, o card descia, o cursor entrava de novo — e tremia.
  const alvo =
    "group block h-full w-full rounded-bloco text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const casca = (canal: Canal) =>
    cn(
      "flex h-full w-full flex-col rounded-bloco border border-border bg-card p-5 shadow-tema",
      "transition-all duration-300 ease-out-expo",
      "[@media(hover:hover)]:group-hover:-translate-y-1 [@media(hover:hover)]:group-hover:shadow-tema-md",
      canalFiltro === canal && "border-foreground/50 bg-muted/40",
      canalFiltro !== null && canalFiltro !== canal && "opacity-60"
    );

  const cabecalho = (canal: Canal, dot: string, Icon: typeof Store) => (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {ROTULO_CANAL[canal]}
        </span>
      </div>
      <Icon className="h-4 w-4 text-muted-foreground/60" />
    </div>
  );

  const numero = (valor: string, unidade: string) => (
    <div className="flex items-baseline gap-1.5">
      <span className="text-3xl font-bold tabular-nums leading-none text-foreground">{valor}</span>
      <span className="text-sm text-muted-foreground">{unidade}</span>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button type="button" aria-pressed={canalFiltro === "revenda"} onClick={() => alternar("revenda")} className={alvo}>
          <div className={casca("revenda")}>
          {cabecalho("revenda", "bg-emerald-500", Store)}
          {numero(inteiro(resumo.revenda.total), "un")}
          <div className="mt-3 space-y-1">
            <LinhaDetalhe rotulo="Confirmadas" valor={inteiro(resumo.revenda.confirmadas)} />
            <LinhaDetalhe rotulo="Previstas" valor={inteiro(resumo.revenda.previstas)} />
            <LinhaDetalhe rotulo="Entregues" valor={inteiro(resumo.revenda.entregues)} />
          </div>
          </div>
        </button>

        <button type="button" aria-pressed={canalFiltro === "food_service"} onClick={() => alternar("food_service")} className={alvo}>
          <div className={casca("food_service")}>
          {cabecalho("food_service", "bg-amber-500", UtensilsCrossed)}
          {numero(decimal(resumo.foodService.total), "kg")}
          <div className="mt-3 space-y-1">
            <LinhaDetalhe rotulo="Confirmados" valor={`${decimal(resumo.foodService.confirmadas)} kg`} />
            <LinhaDetalhe rotulo="Previstos" valor={`${decimal(resumo.foodService.previstas)} kg`} />
            <LinhaDetalhe rotulo="Entregues" valor={`${decimal(resumo.foodService.entregues)} kg`} />
          </div>
          </div>
        </button>

        <button type="button" aria-pressed={canalFiltro === "terceirizacao"} onClick={() => alternar("terceirizacao")} className={alvo}>
          <div className={casca("terceirizacao")}>
          {cabecalho("terceirizacao", "bg-purple-500", Factory)}
          {numero(inteiro(resumo.terceirizacao.total), "un")}
          <div className="mt-3 space-y-1.5">
            {resumo.terceirizacao.clientes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum cliente de terceirização</p>
            ) : (
              resumo.terceirizacao.clientes.map(c => (
                <div key={c.id} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-foreground">{c.nome}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {partes(c, inteiro) || "nada na semana"}
                  </span>
                </div>
              ))
            )}
          </div>
          </div>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
        <span>{legendaTotal}</span>
        {canalFiltro && (
          <button
            type="button"
            onClick={() => onChangeCanal(null)}
            className="inline-flex items-center gap-1 rounded-pilula border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:bg-muted/60"
          >
            Mostrando só {ROTULO_CANAL[canalFiltro]}
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
