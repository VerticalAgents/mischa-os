import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar } from "lucide-react";
import { RepresentantesFilter } from "./RepresentantesFilter";
import { Badge } from "@/components/ui/badge";

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
}: SeparacaoFiltersProps) => {
  const filtrosAtivos = [
    filtroTexto && "texto",
    filtroTipoPedido !== "todos" && "tipo",
    filtroRepresentantes.length > 0 && "representante",
  ].filter(Boolean).length;

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

        {/* Data */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <Input
            type="date"
            value={filtroData}
            onChange={(e) => onFiltroDataChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Representante */}
        <RepresentantesFilter
          selectedIds={filtroRepresentantes}
          onSelectionChange={onFiltroRepresentantesChange}
        />
      </div>
    </div>
  );
};
