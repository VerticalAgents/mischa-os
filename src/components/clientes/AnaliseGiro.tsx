
import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowUp, ArrowDown, Filter } from "lucide-react";
import { Cliente } from "@/types";
import { AnaliseGiroData } from "@/types/giro";
import GiroMetricCard from "./GiroMetricCard";
import GiroMetaForm from "./GiroMetaForm";

// Mock data generator
function gerarDadosHistoricosGiro(cliente: Cliente): AnaliseGiroData {
  const giroSemanalBase = calcularGiroSemanalBase(cliente);
  
  // Gerar histórico de 12 semanas
  const historico: { semana: string; valor: number }[] = [];
  const hoje = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const data = new Date();
    data.setDate(hoje.getDate() - (i * 7));
    
    // Semana no formato "YYYY-WW"
    const ano = data.getFullYear();
    const numeroSemana = getWeekNumber(data);
    const semana = `${ano}-${numeroSemana.toString().padStart(2, '0')}`;
    
    // Adicionar variação aleatória para dados históricos +/- 30%
    const variacao = (Math.random() * 0.6) - 0.3; // -30% a +30%
    const valor = Math.max(1, Math.round(giroSemanalBase * (1 + variacao)));
    
    historico.push({ semana, valor });
  }
  
  // Calcular média histórica (últimas 4 semanas)
  const ultimasSemanas = historico.slice(-4);
  const mediaHistorica = Math.round(
    ultimasSemanas.reduce((acc, item) => acc + item.valor, 0) / ultimasSemanas.length
  );
  
  // Última semana
  const ultimaSemana = historico[historico.length - 1].valor;
  
  // Variação percentual
  const variacaoPercentual = mediaHistorica > 0 
    ? Math.round(((ultimaSemana - mediaHistorica) / mediaHistorica) * 100)
    : 0;
  
  // Meta (10% acima da média histórica)
  const meta = Math.round(mediaHistorica * 1.1);
  
  // Achievement
  const achievement = meta > 0 ? Math.round((ultimaSemana / meta) * 100) : 0;
  
  // Semáforo
  let semaforo: 'vermelho' | 'amarelo' | 'verde' = 'vermelho';
  if (achievement >= 95) {
    semaforo = 'verde';
  } else if (achievement >= 80) {
    semaforo = 'amarelo';
  }
  
  return {
    mediaHistorica,
    ultimaSemana,
    variacaoPercentual,
    meta,
    achievement,
    historico,
    semaforo
  };
}

function calcularGiroSemanalBase(cliente: Cliente): number {
  // Para periodicidade em dias, converter para semanas
  if (cliente.periodicidadePadrao === 3) {
    // Caso especial: 3x por semana
    return cliente.quantidadePadrao * 3;
  }
  
  // Para outros casos, calcular giro semanal
  const periodicidadeSemanas = cliente.periodicidadePadrao / 7;
  return Math.round(cliente.quantidadePadrao / periodicidadeSemanas);
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  // Define o domingo como o primeiro dia da semana
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  // Primeiro dia do ano
  const firstDay = new Date(d.getFullYear(), 0, 4);
  // Ajusta para quinta-feira da primeira semana do ano
  firstDay.setDate(firstDay.getDate() + 3 - (firstDay.getDay() + 6) % 7);
  // Calcula o número da semana
  return Math.round(((d.getTime() - firstDay.getTime()) / 86400000 - 3 + (firstDay.getDay() + 6) % 7) / 7) + 1;
}

function formatarSemana(semana: string): string {
  // Formatar "YYYY-WW" para "Sem WW"
  const [_, weekNum] = semana.split("-");
  return `Sem ${weekNum}`;
}

interface AnaliseGiroProps {
  cliente: Cliente;
}

export default function AnaliseGiro({ cliente }: AnaliseGiroProps) {
  const [dadosGiro, setDadosGiro] = useState<AnaliseGiroData | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  
  useEffect(() => {
    // Em um cenário real, buscaríamos estes dados de uma API
    const dados = gerarDadosHistoricosGiro(cliente);
    setDadosGiro(dados);
  }, [cliente]);
  
  if (!dadosGiro) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80">
            <p>Carregando dados de análise...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Preparar dados para o gráfico
  const dadosGrafico = dadosGiro.historico.map(item => ({
    semana: formatarSemana(item.semana),
    giro: item.valor,
    meta: dadosGiro.meta
  }));
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Button variant="outline" className="self-start flex gap-2 items-center">
          <Filter className="h-4 w-4" />
          Filtrar dados
        </Button>
        
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Meta atual:</span>
          <Badge variant="outline" className="font-medium">{dadosGiro.meta} unidades/semana</Badge>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => setIsEditingMeta(true)}
          >
            Definir Meta
          </Button>
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
          title="Achievement"
          value={`${dadosGiro.achievement}%`}
          description="vs meta estabelecida"
          status={dadosGiro.semaforo}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Giro Semanal - Últimas 12 semanas</CardTitle>
          <CardDescription>
            Evolução do giro semanal comparado com a meta estabelecida
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
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-muted-foreground">Meta:</span>
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
                  name="Giro Semanal"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="meta"
                  name="Meta"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {isEditingMeta && (
        <GiroMetaForm
          cliente={cliente}
          metaAtual={dadosGiro.meta}
          onClose={() => setIsEditingMeta(false)}
          onSave={(novaMeta) => {
            setDadosGiro({
              ...dadosGiro,
              meta: novaMeta,
              achievement: Math.round((dadosGiro.ultimaSemana / novaMeta) * 100)
            });
            setIsEditingMeta(false);
          }}
        />
      )}
    </div>
  );
}
