import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { RepresentantesFilter } from "./RepresentantesFilter";

interface DespachoFiltersProps {
  filtroTexto: string;
  filtroTipo: string;
  totalPedidos: number;
  filtroRepresentantes: number[];
  onFiltroTextoChange: (value: string) => void;
  onFiltroTipoChange: (value: string) => void;
  onFiltroRepresentantesChange: (ids: number[]) => void;
}
export const DespachoFilters = ({
  filtroTexto,
  filtroTipo,
  totalPedidos,
  filtroRepresentantes,
  onFiltroTextoChange,
  onFiltroTipoChange,
  onFiltroRepresentantesChange
}: DespachoFiltersProps) => {
  return <div className="flex items-center gap-4 p-4 border rounded-lg shadow-sm mb-4 bg-slate-50 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input placeholder="Buscar por cliente ou ID..." value={filtroTexto} onChange={e => onFiltroTextoChange(e.target.value)} className="pl-10" />
      </div>
      
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <Select value={filtroTipo} onValueChange={onFiltroTipoChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="Padrão">Padrão</SelectItem>
            <SelectItem value="Alterado">Alterado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <RepresentantesFilter
        selectedIds={filtroRepresentantes}
        onSelectionChange={onFiltroRepresentantesChange}
      />
      
      <div className="text-sm text-gray-600 whitespace-nowrap">
        {totalPedidos} de {totalPedidos} pedidos
      </div>
    </div>;
};