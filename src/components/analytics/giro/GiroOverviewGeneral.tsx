
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Target, Bug, ArrowLeft } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';
import { DebugClientesCarregamento } from './components/DebugClientesCarregamento';

interface GiroOverviewGeneralProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  isLoading: boolean;
}

export function GiroOverviewGeneral({ dadosConsolidados, isLoading }: GiroOverviewGeneralProps) {
  const [mostrarDebugCarregamento, setMostrarDebugCarregamento] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se está mostrando o debug de carregamento, renderizar apenas ele
  if (mostrarDebugCarregamento) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setMostrarDebugCarregamento(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-lg font-semibold">Debug de Carregamento - Visão Geral</h2>
        </div>
        <DebugClientesCarregamento 
          nomeAba="Visão Geral"
          dadosConsolidados={dadosConsolidados}
        />
      </div>
    );
  }

  // Calcular estatísticas
  const totalClientes = dadosConsolidados.length;
  const giroMedioGeral = dadosConsolidados.reduce((acc, item) => acc + item.giro_medio_historico, 0) / totalClientes;
  const achievementMedio = dadosConsolidados.reduce((acc, item) => acc + item.achievement_meta, 0) / totalClientes;
  
  const distribuicaoSemaforo = dadosConsolidados.reduce((acc, item) => {
    acc[item.semaforo_performance] = (acc[item.semaforo_performance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header com botão de debug */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Visão Geral - Análise de Giro
            </span>
            <Button
              variant="outline"
              onClick={() => setMostrarDebugCarregamento(true)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug Carregamento
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{totalClientes}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Giro Médio Geral</p>
                <p className="text-2xl font-bold">{giroMedioGeral.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievement Médio</p>
                <p className="text-2xl font-bold">{achievementMedio.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Verde</p>
                <p className="text-2xl font-bold text-green-600">{distribuicaoSemaforo.verde || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por semáforo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Verde</p>
                <p className="text-3xl font-bold text-green-600">{distribuicaoSemaforo.verde || 0}</p>
                <p className="text-xs text-muted-foreground">Achievement ≥ 90%</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-6 w-6 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Amarela</p>
                <p className="text-3xl font-bold text-yellow-600">{distribuicaoSemaforo.amarelo || 0}</p>
                <p className="text-xs text-muted-foreground">Achievement 70-89%</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-6 w-6 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Vermelha</p>
                <p className="text-3xl font-bold text-red-600">{distribuicaoSemaforo.vermelho || 0}</p>
                <p className="text-xs text-muted-foreground">Achievement &lt; 70%</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-6 w-6 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
