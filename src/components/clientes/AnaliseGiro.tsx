
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import { Cliente } from "@/types";
import GiroMetricCard from "./GiroMetricCard";
import GiroComparativoBlock from "./GiroComparativoBlock";
import { useGiroAnalise } from "@/hooks/useGiroAnalise";

interface AnaliseGiroProps {
  cliente: Cliente;
}

export default function AnaliseGiro({ cliente }: AnaliseGiroProps) {
  const { dadosGiro, giroGeralSemanal, isLoading, error } = useGiroAnalise(cliente);
  
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
  const comparativoGiroGeral = giroGeralSemanal > 0 
    ? Math.round((dadosGiro.mediaHistorica / giroGeralSemanal) * 100)
    : 0;
  
  // Determinar cor da linha da média histórica baseada na comparação com o giro geral
  const corMediaHistorica = dadosGiro.mediaHistorica >= giroGeralSemanal ? "#22c55e" : "#ef4444"; // verde ou vermelho
  
  // Preparar dados para o gráfico - incluir giro geral
  const dadosGrafico = dadosGiro.historico.map(item => ({
    semana: item.semana,
    giro: item.valor,
    mediaHistorica: dadosGiro.mediaHistorica,
    giroGeral: giroGeralSemanal,
    entregas: item.entregas || [],
    periodo: item.periodo || '',
    dataInicial: item.dataInicial || '',
    dataFinal: item.dataFinal || ''
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Média histórica (4 semanas):</span>
            <Badge variant="outline" className="font-medium">{dadosGiro.mediaHistorica} unidades/semana</Badge>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Giro geral:</span>
            <Badge variant="secondary" className="font-medium">{giroGeralSemanal} unidades/semana</Badge>
          </div>
        </div>
      </div>

      <GiroComparativoBlock cliente={cliente} mediaHistorica={dadosGiro.mediaHistorica} />
      
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
            Evolução do giro semanal com comparativo da média histórica e giro geral
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
                      const data = payload[0].payload;
                      const entregas = data.entregas || [];
                      
                      return (
                        <div className="bg-background border border-border rounded-md shadow-lg p-4 max-w-sm">
                          <div className="font-semibold text-base mb-2">{label}</div>
                          <div className="text-sm text-muted-foreground mb-3">
                            Período: {data.periodo}
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-primary rounded-full" />
                              <span className="text-muted-foreground">Giro:</span>
                              <span className="font-semibold">{payload[0].value} unidades</span>
                            </div>
                            {payload[1] && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: corMediaHistorica }} />
                                <span className="text-muted-foreground">Média Histórica:</span>
                                <span className="font-semibold">{payload[1].value} unidades</span>
                              </div>
                            )}
                            {payload[2] && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span className="text-muted-foreground">Giro Geral:</span>
                                <span className="font-semibold">{payload[2].value} unidades</span>
                              </div>
                            )}
                          </div>

                          {entregas.length > 0 && (
                            <div className="border-t pt-2">
                              <div className="text-sm font-medium mb-2">
                                Entregas realizadas ({entregas.length}):
                              </div>
                              <div className="max-h-24 overflow-y-auto space-y-1">
                                {entregas.map((entrega: any, index: number) => (
                                  <div key={index} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      {new Date(entrega.data).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className="font-medium">
                                      {entrega.quantidade} un
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {entregas.length === 0 && (
                            <div className="border-t pt-2 text-xs text-muted-foreground">
                              Nenhuma entrega realizada nesta semana
                            </div>
                          )}
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
                  name="Média Histórica (4 semanas)"
                  stroke={corMediaHistorica}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="giroGeral"
                  name="Giro Geral"
                  stroke="#3b82f6"
                  strokeDasharray="8 4"
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
