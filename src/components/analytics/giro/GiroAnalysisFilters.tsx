
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Filter, X } from 'lucide-react';
import { GiroAnalysisFilters } from '@/types/giroAnalysis';

interface GiroAnalysisFiltersComponentProps {
  filtros: GiroAnalysisFilters;
  onFiltrosChange: (filtros: GiroAnalysisFilters) => void;
  onRefresh: () => Promise<void>;
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
}: GiroAnalysisFiltersComponentProps) {
  const limparFiltros = () => {
    onFiltrosChange({});
  };

  const temFiltrosAtivos = Object.keys(filtros).length > 0;
  const contadorFiltros = Object.values(filtros).filter(Boolean).length;

  const handleRefresh = async () => {
    try {
      console.log('🔄 Iniciando atualização manual dos dados...');
      await onRefresh();
      console.log('✅ Atualização concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante a atualização:', error);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          {/* Filtros */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Representante */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Representante
              </label>
              <Select
                value={filtros.representante || "all"}
                onValueChange={(value) => 
                  onFiltrosChange({ ...filtros, representante: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os representantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os representantes</SelectItem>
                  {representantes.map((rep) => (
                    <SelectItem key={rep} value={rep}>
                      {rep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rota */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Rota de Entrega
              </label>
              <Select
                value={filtros.rota || "all"}
                onValueChange={(value) => 
                  onFiltrosChange({ ...filtros, rota: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as rotas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as rotas</SelectItem>
                  {rotas.map((rota) => (
                    <SelectItem key={rota} value={rota}>
                      {rota}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Categoria
              </label>
              <Select
                value={filtros.categoria_estabelecimento || "all"}
                onValueChange={(value) => 
                  onFiltrosChange({ ...filtros, categoria_estabelecimento: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semáforo */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Performance
              </label>
              <Select
                value={filtros.semaforo || "all"}
                onValueChange={(value) => 
                  onFiltrosChange({ ...filtros, semaforo: value === "all" ? undefined : value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as performances" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as performances</SelectItem>
                  <SelectItem value="verde">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Verde
                    </div>
                  </SelectItem>
                  <SelectItem value="amarelo">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      Amarelo
                    </div>
                  </SelectItem>
                  <SelectItem value="vermelho">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Vermelho
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 items-center">
            {/* Contador de filtros ativos */}
            {temFiltrosAtivos && (
              <Badge variant="secondary" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                {contadorFiltros} filtro{contadorFiltros > 1 ? 's' : ''}
              </Badge>
            )}

            {/* Botão limpar filtros */}
            {temFiltrosAtivos && (
              <Button
                variant="outline"
                size="sm"
                onClick={limparFiltros}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}

            {/* Botão atualizar */}
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="default"
              size="sm"
              className="flex items-center gap-2 min-w-[120px]"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
          </div>
        </div>

        {/* Indicador de última atualização */}
        <div className="mt-4 text-xs text-muted-foreground">
          <span>💡 Clique em "Atualizar Dados" para buscar as informações mais recentes do banco de dados</span>
        </div>
      </CardContent>
    </Card>
  );
}
