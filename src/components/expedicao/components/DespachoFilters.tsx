import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Truck, CalendarRange, Clock, Layers } from "lucide-react";
import { RepresentantesFilter } from "./RepresentantesFilter";
import { TipoLogisticaFilter } from "./TipoLogisticaFilter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Preset = 'hoje' | 'semana' | 'atrasados' | 'todos';

interface DespachoFiltersProps {
  preset: Preset;
  onPresetChange: (preset: Preset) => void;
  filtroTexto: string;
  filtroTipo: string;
  totalPedidos: number;
  filtroRepresentantes: number[];
  filtroTipoLogistica: string[];
  onFiltroTextoChange: (value: string) => void;
  onFiltroTipoChange: (value: string) => void;
  onFiltroRepresentantesChange: (ids: number[]) => void;
  onFiltroTipoLogisticaChange: (values: string[]) => void;
}

const PRESETS: { id: Preset; label: string; icon: React.ReactNode }[] = [
  { id: 'hoje', label: 'Hoje', icon: <Truck className="h-3.5 w-3.5" /> },
  { id: 'semana', label: 'Esta semana', icon: <CalendarRange className="h-3.5 w-3.5" /> },
  { id: 'atrasados', label: 'Atrasados', icon: <Clock className="h-3.5 w-3.5" /> },
  { id: 'todos', label: 'Todos', icon: <Layers className="h-3.5 w-3.5" /> },
];

export const DespachoFilters = ({
  preset,
  onPresetChange,
  filtroTexto,
  filtroTipo,
  totalPedidos,
  filtroRepresentantes,
  filtroTipoLogistica,
  onFiltroTextoChange,
  onFiltroTipoChange,
  onFiltroRepresentantesChange,
  onFiltroTipoLogisticaChange
}: DespachoFiltersProps) => {
  const filtrosAtivos = [
    filtroTexto && "texto",
    filtroTipo !== "todos" && "status",
    filtroRepresentantes.length > 0 && "representante",
    filtroTipoLogistica.length > 0 && "logistica",
  ].filter(Boolean).length;

  return (
    <div className="bg-muted/30 border rounded-lg p-4 space-y-3">
      {/* Presets de período */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPresetChange(p.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors border",
              preset === p.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-foreground border-border hover:bg-muted"
            )}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>

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
          <span className="font-medium text-foreground">{totalPedidos}</span> pedidos
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

        {/* Status */}
        <Select value={filtroTipo} onValueChange={onFiltroTipoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="Separado">Separado</SelectItem>
            <SelectItem value="Despachado">Despachado</SelectItem>
          </SelectContent>
        </Select>

        {/* Representante */}
        <RepresentantesFilter
          selectedIds={filtroRepresentantes}
          onSelectionChange={onFiltroRepresentantesChange}
        />

        {/* Tipo Logística */}
        <TipoLogisticaFilter
          selectedValues={filtroTipoLogistica}
          onSelectionChange={onFiltroTipoLogisticaChange}
        />
      </div>
    </div>
  );
};