import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Calendar, CalendarDays } from "lucide-react";
import { RepresentantesFilter } from "./RepresentantesFilter";
import { WeekNavigator } from "./WeekNavigator";
import { Badge } from "@/components/ui/badge";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from "date-fns";

interface SeparacaoFiltersProps {
  filtroTexto: string;
  filtroTipoPedido: string;
  filtroData: string;
  filtroRepresentantes: number[];
  totalFiltrados: number;
  totalGeral: number;
  onFiltroTextoChange: (value: string) => void;
  onFiltroTipoPedidoChange: (value: string) => void;
  onFiltroDataChange: (value: string) => void;
  onFiltroRepresentantesChange: (ids: number[]) => void;
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
  totalFiltrados,
  totalGeral,
  onFiltroTextoChange,
  onFiltroTipoPedidoChange,
  onFiltroDataChange,
  onFiltroRepresentantesChange,
  modoData,
  semanaSelecionada,
  onModoDataChange,
  onSemanaSelecionadaChange,
}: SeparacaoFiltersProps) => {
  const filtrosAtivos = [
    filtroTexto && "texto",
    filtroTipoPedido !== "todos" && "tipo",
    filtroRepresentantes.length > 0 && "representante",
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
    <div className="bg-muted/30 border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
          {filtrosAtivos > 0 && (
            <Badge variant="secondary" className="text-xs">
              {filtrosAtivos} ativo{filtrosAtivos > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{totalFiltrados}</span>
          {totalFiltrados !== totalGeral && (
            <span> de {totalGeral}</span>
          )} pedidos
        </div>
      </div>

      {/* Linha 1: Busca, Tipo, Representante */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      </div>

      {/* Linha 2: Seletor de Período */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Toggle Dia/Semana */}
        <div className="flex rounded-md border overflow-hidden">
          <Button
            variant={modoData === 'dia' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModoDataChange('dia')}
            className="rounded-none border-0 px-3"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Dia
          </Button>
          <Button
            variant={modoData === 'semana' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModoDataChange('semana')}
            className="rounded-none border-0 px-3"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Semana
          </Button>
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
