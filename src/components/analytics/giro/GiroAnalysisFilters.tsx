
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
    onFiltrosChange({
      ...filtros,
      [key]: value === "todos" ? undefined : value
    });
  };

  const clearFilters = () => {
    onFiltrosChange({});
  };

  const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  {representantes.map((rep) => (
                    <SelectItem key={rep} value={rep}>
                      {rep}
                    </SelectItem>
                  ))}
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
                  {rotas.map((rota) => (
                    <SelectItem key={rota} value={rota}>
                      {rota}
                    </SelectItem>
                  ))}
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
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semáforo */}
            <div className="space-y-2">
              <Label htmlFor="semaforo">Performance</Label>
              <Select
                value={filtros.semaforo || 'todas'}
                onValueChange={(value) => handleFilterChange('semaforo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="verde">🟢 Verde</SelectItem>
                  <SelectItem value="amarelo">🟡 Amarelo</SelectItem>
                  <SelectItem value="vermelho">🔴 Vermelho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Achievement Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="achievement-min">Achievement Min (%)</Label>
              <Input
                id="achievement-min"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={filtros.achievement_min || ''}
                onChange={(e) => handleFilterChange('achievement_min', Number(e.target.value) || undefined)}
              />
            </div>

            {/* Achievement Máximo */}
            <div className="space-y-2">
              <Label htmlFor="achievement-max">Achievement Max (%)</Label>
              <Input
                id="achievement-max"
                type="number"
                min="0"
                max="100"
                placeholder="100"
                value={filtros.achievement_max || ''}
                onChange={(e) => handleFilterChange('achievement_max', Number(e.target.value) || undefined)}
              />
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
