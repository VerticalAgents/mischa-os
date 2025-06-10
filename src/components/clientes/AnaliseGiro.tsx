
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from "recharts";
import { ArrowUp, ArrowDown, Filter, AlertCircle } from "lucide-react";
import { Cliente } from "@/types";
import GiroMetricCard from "./GiroMetricCard";
import { useGiroAnalise } from "@/hooks/useGiroAnalise";

interface AnaliseGiroProps {
  cliente: Cliente;
}

export default function AnaliseGiro({ cliente }: AnaliseGiroProps) {
  const { dadosGiro, isLoading, error } = useGiroAnalise(cliente);
  
  // Giro semanal médio geral (valor simulado - deve vir do dashboard/analytics)
  // TODO: buscar valor real do dashboard "Análise de PDV e Giro"
  const giroSemanalMedioGeral = 150; // Valor placeholder
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Carregando análise de giro...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-red-600">Erro ao carregar dados: {error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dadosGiro) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-muted-foreground">Ainda não há entregas suficientes para gerar o gráfico de giro.</p>
              <p className="text-sm text-muted-foreground">
                Realize algumas entregas para este cliente para visualizar a análise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar se há dados suficientes (pelo menos uma entrega)
  const temDados = dadosGiro.historico.some(item => item.valor > 0);
  
  if (!temDados) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-muted-foreground">Ainda não há entregas registradas para este cliente.</p>
              <p className="text-sm text-muted-foreground">
                O gráfico de giro será exibido após as primeiras entregas serem confirmadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calcular comparativo com giro geral
  const comparativoGiroGeral = giroSemanalMedioGeral > 0 
    ? Math.round((dadosGiro.mediaHistorica / giroSemanalMedioGeral) * 100)
    : 0;
  
  // Preparar dados para o gráfico - agora com média histórica ao invés de meta
  const dadosGrafico = dadosGiro.historico.map(item => ({
    semana: item.semana,
    giro: item.valor,
    mediaHistorica: dadosGiro.mediaHistorica // Linha azul da média histórica
  }));
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Button variant="outline" className="self-start flex gap-2 items-center">
          <Filter className="h-4 w-4" />
          Filtrar dados
        </Button>
        
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Média histórica:</span>
          <Badge variant="outline" className="font-medium">{dadosGiro.mediaHistorica} unidades/semana</Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GiroMetricCard
          title="Média Histórica"
          value={dadosGiro.mediaHistorica}
          suffix="un/sem"
          description="Últimas 4 semanas"
        />
        
        <GiroMetricCard
          title="Última Semana"
          value={dadosGiro.ultimaSemana}
          suffix="unidades"
          trend={dadosGiro.variacaoPercentual !== 0 ? {
            value: Math.abs(dadosGiro.variacaoPercentual),
            isPositive: dadosGiro.variacaoPercentual >= 0
          } : undefined}
          description="vs média histórica"
          icon={dadosGiro.variacaoPercentual >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        />
        
        <GiroMetricCard
          title="Comparativo com Giro Geral"
          value={`${comparativoGiroGeral}%`}
          description="vs giro médio geral"
          status={comparativoGiroGeral >= 100 ? 'verde' : 'vermelho'}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Giro Semanal - Últimas 12 semanas</CardTitle>
          <CardDescription>
            Evolução do giro semanal baseado no histórico real de entregas com média histórica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dadosGrafico}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-md shadow-lg p-3">
                          <div className="font-medium">{label}</div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              <span className="text-muted-foreground">Giro:</span>
                              <span className="font-medium">{payload[0].value} unidades</span>
                            </div>
                            {payload[1] && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span className="text-muted-foreground">Média Histórica:</span>
                                <span className="font-medium">{payload[1].value} unidades</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="giro"
                  name="Giro Semanal (Real)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="mediaHistorica"
                  name="Média Histórica"
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
