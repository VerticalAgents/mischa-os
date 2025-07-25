
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Target, DollarSign } from 'lucide-react';
import { DadosAnaliseGiroConsolidados, GiroOverview, GiroRegionalData } from '@/types/giroAnalysis';
import { ClientesPorRotaDropdown } from './components/ClientesPorRotaDropdown';

interface GiroOverviewGeneralProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  overview: GiroOverview | null;
  regional: GiroRegionalData[] | null;
  isLoading: boolean;
}

export function GiroOverviewGeneral({ 
  dadosConsolidados, 
  overview, 
  regional, 
  isLoading 
}: GiroOverviewGeneralProps) {
  const [rotaAbertaId, setRotaAbertaId] = useState<string | null>(null);

  const toggleRota = (rota: string) => {
    setRotaAbertaId(rotaAbertaId === rota ? null : rota);
  };

  const getSemaforoColor = (performance: string) => {
    switch (performance) {
      case 'verde': return 'bg-green-500';
      case 'amarelo': return 'bg-yellow-500';
      case 'vermelho': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-left">Giro Médio Geral</p>
                <p className="text-2xl font-bold text-left">
                  {overview?.giroMedioGeral || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-left">Achievement Global</p>
                <p className="text-2xl font-bold text-left">
                  {overview?.taxaAtingimentoGlobal.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-left">Total de Clientes</p>
                <p className="text-2xl font-bold text-left">
                  {overview?.totalClientes || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-left">Faturamento Previsto</p>
                <p className="text-2xl font-bold text-left">
                  R$ {(overview?.faturamentoTotalPrevisto || 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Semáforo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Distribuição por Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm">Verde: {overview?.distribuicaoSemaforo.verde || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Amarelo: {overview?.distribuicaoSemaforo.amarelo || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm">Vermelho: {overview?.distribuicaoSemaforo.vermelho || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise por Rota de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Análise por Rota de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {regional?.map((rota) => (
              <ClientesPorRotaDropdown
                key={rota.rota_entrega}
                rota={rota.rota_entrega}
                dadosConsolidados={dadosConsolidados}
                isOpen={rotaAbertaId === rota.rota_entrega}
                onToggle={() => toggleRota(rota.rota_entrega)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
