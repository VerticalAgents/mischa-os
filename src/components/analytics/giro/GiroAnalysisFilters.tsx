
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, X, RefreshCw } from 'lucide-react';
import { GiroAnalysisFilters } from '@/types/giroAnalysis';

interface GiroAnalysisFiltersProps {
  filtros: GiroAnalysisFilters;
  onFiltrosChange: (filtros: GiroAnalysisFilters) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  representantes: string[];
  rotas: string[];
  categorias: string[];
}

export function GiroAnalysisFiltersComponent({
  filtros,
  onFiltrosChange,
  onRefresh,
  isRefreshing,
  representantes,
  rotas,
  categorias
}: GiroAnalysisFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof GiroAnalysisFilters, value: any) => {
    const defaultValues = {
      representante: 'todos',
      rota: 'todas',
      categoria_estabelecimento: 'todas'
    };
    
    const defaultValue = defaultValues[key as keyof typeof defaultValues];
    
    onFiltrosChange({
      ...filtros,
      [key]: value === defaultValue ? undefined : value
    });
  };

  const clearFilters = () => {
    onFiltrosChange({});
  };

  const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

  // Ultra-safe helper function to filter out invalid values
  const filterValidValues = (arr: string[]): string[] => {
    if (!Array.isArray(arr)) {
      console.warn('filterValidValues received non-array:', arr);
      return [];
    }
    
    const filtered = arr.filter(item => {
      // Check if item exists and is a valid string
      if (!item || typeof item !== 'string') {
        console.warn('Invalid item type:', typeof item, item);
        return false;
      }
      
      // Check if item is not just whitespace
      const trimmed = item.trim();
      if (trimmed === '') {
        console.warn('Empty string item:', item);
        return false;
      }
      
      // Check for string representations of null/undefined
      if (trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NULL' || trimmed === 'UNDEFINED') {
        console.warn('Invalid string representation:', trimmed);
        return false;
      }
      
      // Additional length check
      if (trimmed.length === 0) {
        console.warn('Zero length string:', item);
        return false;
      }
      
      return true;
    });
    
    console.log('Filtered values:', { 
      original: arr.length, 
      filtered: filtered.length,
      originalItems: arr.slice(0, 5),
      filteredItems: filtered.slice(0, 5)
    });
    return filtered;
  };

  const validRepresentantes = filterValidValues(representantes || []);
  const validRotas = filterValidValues(rotas || []);
  const validCategorias = filterValidValues(categorias || []);

  // Additional safety check - log any issues
  console.log('Filter data:', {
    representantes: { total: representantes?.length, valid: validRepresentantes.length },
    rotas: { total: rotas?.length, valid: validRotas.length },
    categorias: { total: categorias?.length, valid: validCategorias.length }
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Representante */}
            <div className="space-y-2">
              <Label htmlFor="representante">Representante</Label>
              <Select
                value={filtros.representante || 'todos'}
                onValueChange={(value) => handleFilterChange('representante', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {validRepresentantes.map((rep) => {
                    const safeValue = rep && rep.trim() ? rep.trim() : null;
                    if (!safeValue) return null;
                    return (
                      <SelectItem key={safeValue} value={safeValue}>
                        {safeValue}
                      </SelectItem>
                    );
                  }).filter(Boolean)}
                </SelectContent>
              </Select>
            </div>

            {/* Rota */}
            <div className="space-y-2">
              <Label htmlFor="rota">Rota</Label>
              <Select
                value={filtros.rota || 'todas'}
                onValueChange={(value) => handleFilterChange('rota', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {validRotas.map((rota) => {
                    const safeValue = rota && rota.trim() ? rota.trim() : null;
                    if (!safeValue) return null;
                    return (
                      <SelectItem key={safeValue} value={safeValue}>
                        {safeValue}
                      </SelectItem>
                    );
                  }).filter(Boolean)}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria Estabelecimento */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={filtros.categoria_estabelecimento || 'todas'}
                onValueChange={(value) => handleFilterChange('categoria_estabelecimento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {validCategorias.map((cat) => {
                    const safeValue = cat && cat.trim() ? cat.trim() : null;
                    if (!safeValue) return null;
                    return (
                      <SelectItem key={safeValue} value={safeValue}>
                        {safeValue}
                      </SelectItem>
                    );
                  }).filter(Boolean)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {activeFiltersCount > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
