import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Ruler, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import CategoriasProdutoFilter from "./CategoriasProdutoFilter";
import type { CategoriaInfo, UnidadeMedida } from "@/hooks/useProducaoDashboard";
import {
  GRANULARIDADE_LABEL,
  OPCOES_QUANTIDADE,
  type Granularidade,
} from "@/utils/periodoProducao";

interface ProducaoFiltersBarProps {
  granularidade: Granularidade;
  onGranularidadeChange: (v: Granularidade) => void;
  quantidade: number;
  onQuantidadeChange: (v: number) => void;
  rotuloPeriodo: string;
  onVoltar: () => void;
  onAvancar: () => void;
  onHoje: () => void;
  podeVoltar: boolean;
  podeAvancar: boolean;
  unidade: UnidadeMedida;
  onUnidadeChange: (v: UnidadeMedida) => void;
  categorias: CategoriaInfo[];
  categoriasSelecionadas: number[];
  onCategoriasChange: (ids: number[]) => void;
}

export default function ProducaoFiltersBar({
  granularidade,
  onGranularidadeChange,
  quantidade,
  onQuantidadeChange,
  rotuloPeriodo,
  onVoltar,
  onAvancar,
  onHoje,
  podeVoltar,
  podeAvancar,
  unidade,
  onUnidadeChange,
  categorias,
  categoriasSelecionadas,
  onCategoriasChange,
}: ProducaoFiltersBarProps) {
  const opcoes = [...OPCOES_QUANTIDADE[granularidade]].sort((a, b) => a - b);

  return (
    <Card>
      {/* O CardContent traz "sm:p-6 sm:pt-0" de fabrica. Um "p-3" solto so vence no
          celular: no computador o topo ficava em zero e o conteudo colava na borda
          redonda do cartao. Por isso o padding vai com o "sm:" junto. */}
      <CardContent className="p-4 sm:p-5">
        {/* Grade de 6 colunas: o periodo ocupa 3 tercos em cima, unidade e
            categoria ocupam 2 metades embaixo, e as bordas de fora coincidem. */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          {/* Mesmo desenho das abas da pagina: trilho cinza, opcao ativa em branco. */}
          <ToggleGroup
            type="single"
            value={granularidade}
            onValueChange={v => v && onGranularidadeChange(v as Granularidade)}
            className="h-10 w-full gap-1 rounded-md bg-muted p-1 lg:col-span-2"
            aria-label="Ver por"
          >
            {(["dia", "semana", "mes"] as Granularidade[]).map(g => (
              <ToggleGroupItem
                key={g}
                value={g}
                className="h-8 flex-1 rounded-sm px-3 capitalize text-muted-foreground hover:bg-background/60 hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
              >
                {GRANULARIDADE_LABEL[g].singular}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <Select value={String(quantidade)} onValueChange={v => onQuantidadeChange(Number(v))}>
            <SelectTrigger className="h-10 gap-2 lg:col-span-2 [&>svg]:shrink-0">
              <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="z-[100]">
              {opcoes.map(n => (
                <SelectItem key={n} value={String(n)}>
                  {n} {GRANULARIDADE_LABEL[granularidade].plural}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 lg:col-span-2">
            {/* Setas e periodo numa caixa so, com a mesma borda dos seletores. */}
            <div className="flex h-10 min-w-0 flex-1 items-center rounded-md border border-input bg-background">
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-9 shrink-0 rounded-r-none"
                onClick={onVoltar}
                disabled={!podeVoltar}
                aria-label="Período anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-0 flex-1 truncate text-center text-sm font-medium tabular-nums">
                {rotuloPeriodo}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-9 shrink-0 rounded-l-none"
                onClick={onAvancar}
                disabled={!podeAvancar}
                aria-label="Próximo período"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="h-10 shrink-0 px-4"
              onClick={onHoje}
              disabled={!podeAvancar}
              title="Incluir o período em andamento"
            >
              Hoje
            </Button>
          </div>

          <Select value={unidade} onValueChange={v => onUnidadeChange(v as UnidadeMedida)}>
            <SelectTrigger className="h-10 gap-2 lg:col-span-3 [&>svg]:shrink-0">
              <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Ruler className="h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="z-[100]">
              <SelectItem value="formas">Formas</SelectItem>
              <SelectItem value="unidades">Unidades</SelectItem>
              <SelectItem value="peso">Peso (kg)</SelectItem>
            </SelectContent>
          </Select>

          <CategoriasProdutoFilter
            categorias={categorias}
            selectedIds={categoriasSelecionadas}
            onSelectionChange={onCategoriasChange}
            className="h-10 w-full lg:col-span-3"
          />
        </div>
      </CardContent>
    </Card>
  );
}
