import { useMemo, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { Layers, Package, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import {
  useProducaoDashboard,
  UnidadeMedida,
} from "@/hooks/useProducaoDashboard";
import {
  DESLOCAMENTO_MAXIMO,
  OPCOES_QUANTIDADE,
  deslocamentoMinimo,
  montarJanela,
  rotuloIntervalo,
  rotuloNavegacao,
  type Granularidade,
} from "@/utils/periodoProducao";
import ProducaoFiltersBar from "@/components/pcp/dashboard/ProducaoFiltersBar";
import ProducaoKpiStrip from "@/components/pcp/dashboard/ProducaoKpiStrip";
import ProducaoEvolucaoChart from "@/components/pcp/dashboard/ProducaoEvolucaoChart";
import ProducaoQuebraCard from "@/components/pcp/dashboard/ProducaoQuebraCard";

export default function HistoricoAnalytics() {
  const [granularidade, setGranularidade] = useState<Granularidade>("mes");
  const [quantidade, setQuantidade] = useState(OPCOES_QUANTIDADE.mes[0]);
  // 0 = termina no ultimo periodo fechado; +1 inclui o em andamento; negativo volta.
  const [deslocamento, setDeslocamento] = useState(0);
  // Barra clicada no grafico (indice dentro da janela); null = periodo todo.
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [unidade, setUnidade] = useState<UnidadeMedida>("unidades");
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<number[]>([]);
  const [apenasComProporcao, setApenasComProporcao] = useState(false);

  const { proporcoes } = useSupabaseProporoesPadrao();

  const nomesComProporcao = useMemo(
    () =>
      new Set(
        (proporcoes || [])
          .filter(p => (p.percentual || 0) > 0)
          .map(p => p.produto_nome)
      ),
    [proporcoes]
  );

  const hoje = useMemo(() => new Date(), []);

  const janela = useMemo(
    () => montarJanela({ granularidade, quantidade, deslocamento, hoje }),
    [granularidade, quantidade, deslocamento, hoje]
  );

  const periodoClicado = selecionado !== null ? janela.buckets[selecionado] ?? null : null;

  const {
    loading,
    categoriasDisponiveis,
    primeiraData,
    ultimaData,
    kpis,
    serie,
    porCategoria,
    porProduto,
    produtosSemPeso,
  } = useProducaoDashboard({
    janela,
    foco: periodoClicado,
    unidade,
    categoriasSelecionadas,
    apenasComProporcao,
    nomesComProporcao,
  });

  const minimo = deslocamentoMinimo(granularidade, hoje, primeiraData);
  const textoPeriodo = rotuloIntervalo(janela);
  const textoQuebra = periodoClicado ? periodoClicado.labelLongo : textoPeriodo;
  const diasSemLancar = ultimaData ? differenceInCalendarDays(hoje, ultimaData) : 0;

  // A barra clicada e um indice dentro da janela: mudou a janela, o indice ja
  // aponta para outro periodo, entao a selecao cai junto.
  const mudarQuantidade = (n: number) => {
    setQuantidade(n);
    setSelecionado(null);
  };
  const mover = (para: (d: number) => number) => {
    setDeslocamento(para);
    setSelecionado(null);
  };

  // Trocar dia/semana/mes volta para o ultimo periodo fechado: o deslocamento
  // conta em periodos, e "3 meses atras" nao e "3 dias atras".
  const trocarGranularidade = (g: Granularidade) => {
    setGranularidade(g);
    setQuantidade(OPCOES_QUANTIDADE[g][0]);
    setDeslocamento(0);
    setSelecionado(null);
  };

  const categoriasVisiveis = useMemo(
    () =>
      categoriasDisponiveis.filter(
        c => categoriasSelecionadas.length === 0 || categoriasSelecionadas.includes(c.id)
      ),
    [categoriasDisponiveis, categoriasSelecionadas]
  );

  return (
    <div className="space-y-4">
      <ProducaoFiltersBar
        granularidade={granularidade}
        onGranularidadeChange={trocarGranularidade}
        quantidade={quantidade}
        onQuantidadeChange={mudarQuantidade}
        rotuloPeriodo={rotuloNavegacao(janela)}
        onVoltar={() => mover(d => Math.max(d - 1, minimo))}
        onAvancar={() => mover(d => Math.min(d + 1, DESLOCAMENTO_MAXIMO))}
        onHoje={() => mover(() => DESLOCAMENTO_MAXIMO)}
        podeVoltar={deslocamento > minimo}
        podeAvancar={deslocamento < DESLOCAMENTO_MAXIMO}
        unidade={unidade}
        onUnidadeChange={setUnidade}
        categorias={categoriasDisponiveis}
        categoriasSelecionadas={categoriasSelecionadas}
        onCategoriasChange={setCategoriasSelecionadas}
      />

      {unidade === "peso" && produtosSemPeso.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {produtosSemPeso.length}{" "}
            {produtosSemPeso.length === 1 ? "produto foi ignorado" : "produtos foram ignorados"} por
            não ter peso unitário cadastrado: {produtosSemPeso.slice(0, 4).join(", ")}
            {produtosSemPeso.length > 4 ? "…" : ""}
          </AlertDescription>
        </Alert>
      )}

      {/* O dashboard so enxerga o que foi lancado no Mischa OS. Sem esta linha, um
          mes com lancamento atrasado parece queda de producao. */}
      {!loading && ultimaData && (
        <p className="px-1 text-xs text-muted-foreground">
          Dados até {format(ultimaData, "dd/MM/yyyy")}
          {diasSemLancar === 0
            ? " (hoje)"
            : ` — último lançamento há ${diasSemLancar} ${diasSemLancar === 1 ? "dia" : "dias"}`}
          . O que foi produzido depois disso ainda não aparece aqui.
        </p>
      )}

      <ProducaoKpiStrip
        loading={loading}
        unidade={unidade}
        granularidade={granularidade}
        textoPeriodo={textoPeriodo}
        kpis={kpis}
      />

      <ProducaoEvolucaoChart
        dados={serie}
        categorias={categoriasVisiveis}
        unidade={unidade}
        granularidade={granularidade}
        textoPeriodo={textoPeriodo}
        loading={loading}
        selecionado={selecionado}
        onSelecionar={setSelecionado}
      />

      {periodoClicado && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-sm">
          <span className="text-muted-foreground">Categorias e produtos de</span>
          <span className="font-medium">{periodoClicado.labelLongo}</span>
          <button
            type="button"
            onClick={() => setSelecionado(null)}
            className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-3 w-3" />
            ver o período todo
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 items-stretch">
        <ProducaoQuebraCard
          titulo="Produção por categoria"
          descricao={textoQuebra}
          loading={loading}
          icon={Layers}
          itens={porCategoria}
          unidade={unidade}
        />
        <ProducaoQuebraCard
          titulo="Produção por produto"
          descricao={`${textoQuebra} — top 12`}
          loading={loading}
          icon={Package}
          itens={porProduto}
          unidade={unidade}
          mostrarCategoria
          limite={12}
          toggleProporcao={{
            checked: apenasComProporcao,
            onCheckedChange: setApenasComProporcao,
          }}
        />
      </div>
    </div>
  );
}
