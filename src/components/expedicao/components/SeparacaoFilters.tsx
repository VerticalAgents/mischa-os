import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, CalendarDays } from "lucide-react";
import { RepresentantesFilter } from "./RepresentantesFilter";
import { ProdutosFilter } from "./ProdutosFilter";
import { WeekNavigator } from "./WeekNavigator";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { cn } from "@/lib/utils";

interface SeparacaoFiltersProps {
  filtroTexto: string;
  filtroTipoPedido: string;
  filtroData: string;
  filtroRepresentantes: number[];
  filtroProdutos: string[];
  filtroProdutosModo?: 'incluir' | 'excluir';
  produtosDisponiveisIds?: string[];
  totalFiltrados: number;
  totalGeral: number;
  onFiltroTextoChange: (value: string) => void;
  onFiltroTipoPedidoChange: (value: string) => void;
  onFiltroDataChange: (value: string) => void;
  onFiltroRepresentantesChange: (ids: number[]) => void;
  onFiltroProdutosChange: (ids: string[]) => void;
  onFiltroProdutosModoChange?: (modo: 'incluir' | 'excluir') => void;
  // Props para modo semana
  modoData: 'dia' | 'semana';
  semanaSelecionada: Date;
  onModoDataChange: (modo: 'dia' | 'semana') => void;
  onSemanaSelecionadaChange: (data: Date) => void;
}

export const SeparacaoFilters = ({
  filtroTexto,
  filtroTipoPedido,
  filtroData,
  filtroRepresentantes,
  filtroProdutos,
  filtroProdutosModo,
  produtosDisponiveisIds,
  totalFiltrados,
  totalGeral,
  onFiltroTextoChange,
  onFiltroTipoPedidoChange,
  onFiltroDataChange,
  onFiltroRepresentantesChange,
  onFiltroProdutosChange,
  onFiltroProdutosModoChange,
  modoData,
  semanaSelecionada,
  onModoDataChange,
  onSemanaSelecionadaChange,
}: SeparacaoFiltersProps) => {
  const filtrosAtivos = [
    filtroTexto && "texto",
    filtroTipoPedido !== "todos" && "tipo",
    filtroRepresentantes.length > 0 && "representante",
    filtroProdutos.length > 0 && "produto",
  ].filter(Boolean).length;

  const ehSemanaAtual = isSameWeek(semanaSelecionada, new Date(), { weekStartsOn: 0 });

  const handleSemanaAnterior = () => {
    onSemanaSelecionadaChange(subWeeks(semanaSelecionada, 1));
  };

  const handleProximaSemana = () => {
    onSemanaSelecionadaChange(addWeeks(semanaSelecionada, 1));
  };

  const handleVoltarHoje = () => {
    onSemanaSelecionadaChange(new Date());
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Filtros
          </span>
          {filtrosAtivos > 0 && (
            <span className="text-[11px] font-medium text-amber-600">
              · {filtrosAtivos} ativo{filtrosAtivos > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{totalFiltrados}</span>
          {totalFiltrados !== totalGeral && (
            <span> de {totalGeral}</span>
          )} pedidos
        </div>
      </div>

      {/* Linha 1: Busca, Tipo, Representante */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Busca por texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar cliente ou ID..."
            value={filtroTexto}
            onChange={(e) => onFiltroTextoChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tipo de Pedido */}
        <Select value={filtroTipoPedido} onValueChange={onFiltroTipoPedidoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Pedido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="padrao">Padrão</SelectItem>
            <SelectItem value="alterado">Alterado</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de Representante */}
        <RepresentantesFilter
          selectedIds={filtroRepresentantes}
          onSelectionChange={onFiltroRepresentantesChange}
        />

        {/* Filtro por Produto */}
        <ProdutosFilter
          selectedIds={filtroProdutos}
          onSelectionChange={onFiltroProdutosChange}
          allowedIds={produtosDisponiveisIds}
          modo={filtroProdutosModo}
          onModoChange={onFiltroProdutosModoChange}
        />
      </div>

      {/* Linha 2: Seletor de Período */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Toggle Dia/Semana - minimalista */}
        <div className="inline-flex bg-muted/40 rounded-md p-0.5">
          {(['dia', 'semana'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModoDataChange(m)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition-colors",
                modoData === m
                  ? "bg-background text-amber-600 shadow-sm"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              {m === 'dia' ? <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} /> : <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />}
              {m === 'dia' ? 'Dia' : 'Semana'}
            </button>
          ))}
        </div>

        {/* Conteúdo do filtro de data */}
        {modoData === 'dia' ? (
          <div className="relative flex-1 min-w-[150px] max-w-[200px]">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
            <Input
              type="date"
              value={filtroData}
              onChange={(e) => onFiltroDataChange(e.target.value)}
              className="pl-9"
            />
          </div>
        ) : (
          <WeekNavigator
            semanaAtual={semanaSelecionada}
            onSemanaAnterior={handleSemanaAnterior}
            onProximaSemana={handleProximaSemana}
            onVoltarHoje={handleVoltarHoje}
            ehSemanaAtual={ehSemanaAtual}
          />
        )}
      </div>
    </div>
  );
};
