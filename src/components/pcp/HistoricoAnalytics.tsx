import { useMemo, useState } from "react";
import { Layers, Package, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import {
  useProducaoDashboard,
  UnidadeMedida,
} from "@/hooks/useProducaoDashboard";
import ProducaoFiltersBar from "@/components/pcp/dashboard/ProducaoFiltersBar";
import ProducaoKpiStrip from "@/components/pcp/dashboard/ProducaoKpiStrip";
import ProducaoEvolucaoChart from "@/components/pcp/dashboard/ProducaoEvolucaoChart";
import ProducaoQuebraCard from "@/components/pcp/dashboard/ProducaoQuebraCard";

export default function HistoricoAnalytics() {
  const [periodo, setPeriodo] = useState("30");
  const [mesesGrafico, setMesesGrafico] = useState("12");
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

  const dias = parseInt(periodo) || 30;
  const meses = parseInt(mesesGrafico) || 12;

  const {
    categoriasDisponiveis,
    kpis,
    serieMensal,
    porCategoria,
    porProduto,
    produtosSemPeso,
  } = useProducaoDashboard({
    dias,
    meses,
    unidade,
    categoriasSelecionadas,
    apenasComProporcao,
    nomesComProporcao,
  });

  const textoPeriodo = dias >= 365 ? "Último ano" : `Últimos ${dias} dias`;

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
        periodo={periodo}
        onPeriodoChange={setPeriodo}
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

      <ProducaoKpiStrip unidade={unidade} textoPeriodo={textoPeriodo} kpis={kpis} />

      <ProducaoEvolucaoChart
        dados={serieMensal}
        categorias={categoriasVisiveis}
        unidade={unidade}
        meses={mesesGrafico}
        onMesesChange={setMesesGrafico}
      />

      <div className="grid gap-4 lg:grid-cols-2 items-stretch">
        <ProducaoQuebraCard
          titulo="Produção por categoria"
          descricao={textoPeriodo}
          icon={Layers}
          itens={porCategoria}
          unidade={unidade}
        />
        <ProducaoQuebraCard
          titulo="Produção por produto"
          descricao={`${textoPeriodo} — top 12`}
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
