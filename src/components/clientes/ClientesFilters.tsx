
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  Eye, 
  EyeOff,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { StatusCliente } from "@/types";
import { useClienteStore } from "@/hooks/useClienteStore";

export interface ColumnOption {
  id: string;
  label: string;
  canToggle: boolean;
}

interface ClientesFiltrosProps {
  filtros: {
    termo: string;
    status: StatusCliente | 'Todos';
  };
  setFiltroTermo: (termo: string) => void;
  setFiltroStatus: (status: StatusCliente | 'Todos') => void;
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
  columnOptions: ColumnOption[];
}

export default function ClientesFilters({
  filtros,
  setFiltroTermo,
  setFiltroStatus,
  visibleColumns,
  setVisibleColumns,
  columnOptions
}: ClientesFiltrosProps) {
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const { verificarConsistenciaDados, loading } = useClienteStore();

  const handleColumnToggle = (columnId: string) => {
    const newColumns = visibleColumns.includes(columnId)
      ? visibleColumns.filter(id => id !== columnId)
      : [...visibleColumns, columnId];
    setVisibleColumns(newColumns);
  };

  const handleVerificarConsistencia = async () => {
    await verificarConsistenciaDados();
  };

  const resetColumns = () => {
    const defaultColumns = columnOptions.map(col => col.id);
    setVisibleColumns(defaultColumns);
    setIsColumnSelectorOpen(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do cliente ou CNPJ/CPF..."
                  value={filtros.termo}
                  onChange={(e) => setFiltroTermo(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtros.status} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="A ativar">A ativar</SelectItem>
                  <SelectItem value="Standby">Standby</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Popover open={isColumnSelectorOpen} onOpenChange={setIsColumnSelectorOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Colunas
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Colunas Visíveis</h4>
                      <Button variant="outline" size="sm" onClick={resetColumns}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Resetar
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {columnOptions.map((column) => (
                        <div key={column.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={column.id}
                            checked={visibleColumns.includes(column.id)}
                            onChange={() => handleColumnToggle(column.id)}
                            disabled={!column.canToggle}
                            className="rounded border-gray-300"
                          />
                          <label
                            htmlFor={column.id}
                            className={`text-sm ${
                              !column.canToggle ? 'text-muted-foreground' : ''
                            }`}
                          >
                            {column.label}
                            {!column.canToggle && (
                              <span className="ml-1 text-xs">(obrigatório)</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleVerificarConsistencia}
                disabled={loading}
                title="Verificar consistência dos dados"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Verificar Dados
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Status: {filtros.status}
            </Badge>
            
            {filtros.termo && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                Termo: {filtros.termo}
              </Badge>
            )}
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {visibleColumns.length} colunas visíveis
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
