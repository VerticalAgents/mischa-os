
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusCliente } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Define the available columns for the table
export interface ColumnOption {
  id: string;
  label: string;
  canToggle: boolean;
}

interface ClientesFiltersProps {
  filtros: {
    termo: string;
    status: StatusCliente | 'Todos' | '';
  };
  setFiltroTermo: (termo: string) => void;
  setFiltroStatus: (status: StatusCliente | 'Todos' | '') => void;
  visibleColumns: string[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
  columnOptions: ColumnOption[];
}

export default function ClientesFilters({
  filtros,
  setFiltroTermo,
  setFiltroStatus,
  visibleColumns,
  setVisibleColumns,
  columnOptions
}: ClientesFiltersProps) {
  // Toggle column visibility
  const toggleColumn = (columnId: string, isVisible: boolean) => {
    if (!isVisible) {
      setVisibleColumns(visibleColumns.filter(id => id !== columnId));
    } else {
      setVisibleColumns([...visibleColumns, columnId]);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome ou CNPJ/CPF..." 
          className="pl-8" 
          value={filtros.termo} 
          onChange={e => setFiltroTermo(e.target.value)} 
        />
      </div>
      <select 
        className="h-10 rounded-md border border-input bg-background px-3 py-2" 
        value={filtros.status} 
        onChange={e => setFiltroStatus(e.target.value as StatusCliente | 'Todos' | '')}
      >
        <option value="">Todos os status</option>
        <option value="Ativo">Ativo</option>
        <option value="Em análise">Em análise</option>
        <option value="Inativo">Inativo</option>
        <option value="A ativar">A ativar</option>
        <option value="Standby">Standby</option>
      </select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Colunas</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="space-y-4">
            <h4 className="font-medium">Propriedades Visíveis</h4>
            <div className="grid gap-2">
              {columnOptions.map(column => (
                <div key={column.id} className="flex items-center gap-2">
                  <Checkbox 
                    id={`column-${column.id}`} 
                    checked={visibleColumns.includes(column.id)} 
                    onCheckedChange={checked => {
                      if (column.canToggle) {
                        toggleColumn(column.id, !!checked);
                      }
                    }} 
                    disabled={!column.canToggle} 
                  />
                  <Label htmlFor={`column-${column.id}`}>{column.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
