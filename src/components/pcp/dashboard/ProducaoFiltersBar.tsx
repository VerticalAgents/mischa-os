import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler, CalendarRange } from "lucide-react";
import CategoriasProdutoFilter from "./CategoriasProdutoFilter";
import type { CategoriaInfo, UnidadeMedida } from "@/hooks/useProducaoDashboard";

interface ProducaoFiltersBarProps {
  periodo: string;
  onPeriodoChange: (v: string) => void;
  unidade: UnidadeMedida;
  onUnidadeChange: (v: UnidadeMedida) => void;
  categorias: CategoriaInfo[];
  categoriasSelecionadas: number[];
  onCategoriasChange: (ids: number[]) => void;
}

export default function ProducaoFiltersBar({
  periodo,
  onPeriodoChange,
  unidade,
  onUnidadeChange,
  categorias,
  categoriasSelecionadas,
  onCategoriasChange,
}: ProducaoFiltersBarProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={periodo} onValueChange={onPeriodoChange}>
            <SelectTrigger className="h-9">
              <span className="flex items-center gap-2 truncate">
                <CalendarRange className="h-4 w-4 shrink-0" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent className="z-[100]">
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 180 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={unidade} onValueChange={v => onUnidadeChange(v as UnidadeMedida)}>
            <SelectTrigger className="h-9">
              <span className="flex items-center gap-2 truncate">
                <Ruler className="h-4 w-4 shrink-0" />
                <SelectValue />
              </span>
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
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
