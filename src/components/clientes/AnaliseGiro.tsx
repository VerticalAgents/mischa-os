import { useState } from "react";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import { Cliente } from "@/types";
import GiroMetricCard from "./GiroMetricCard";
import { useGiroAnalise } from "@/hooks/useGiroAnalise";
import { supabase } from "@/integrations/supabase/client";
interface AnaliseGiroProps {
  cliente: Cliente;
}

// Função para converter número da semana ISO para data de início e fim
function getWeekDates(year: number, week: number) {
  const firstDayOfYear = new Date(year, 0, 1);
  const firstMonday = new Date(firstDayOfYear);

  // Encontrar a primeira segunda-feira do ano
  const dayOfWeek = firstDayOfYear.getDay();
  const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  firstMonday.setDate(firstDayOfYear.getDate() + daysToAdd);

  // Calcular a data de início da semana especificada
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (week - 2) * 7);

  // Data de fim (domingo da mesma semana)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return {
    startDate,
    endDate
  };
}
export default function AnaliseGiro({
  cliente
}: AnaliseGiroProps) {
  const {
    dadosGiro,
    isLoading,
    error
  } = useGiroAnalise(cliente);

  // Giro semanal médio geral (valor simulado - deve vir do dashboard "Análise de PDV e Giro")
  const giroSemanalMedioGeral = 150; // Valor placeholder

  if (isLoading) {
    return <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Carregando análise de giro...</p>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-80">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-red-600">Erro ao carregar dados: {error}</p>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (!dadosGiro) {
    return <Card>
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
      </Card>;
  }

  // Verificar se há dados suficientes (pelo menos uma entrega)
  const temDados = dadosGiro.historico.some(item => item.valor > 0);
  if (!temDados) {
    return <Card>
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
      </Card>;
  }
  const comparativoGiroGeral = giroSemanalMedioGeral > 0 ? Math.round(dadosGiro.mediaHistorica / giroSemanalMedioGeral * 100) : 0;

  // Preparar dados para o gráfico usando mediaHistorica unificada
  const dadosGrafico = dadosGiro.historico.map(item => ({
    semana: item.semana,
    giro: item.valor,
    mediaHistorica: dadosGiro.mediaHistorica
  }));

  // Tooltip customizado para o gráfico
  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    const [entregasDetalhes, setEntregasDetalhes] = useState<any[]>([]);
    const [carregandoEntregas, setCarregandoEntregas] = useState(false);
    React.useEffect(() => {
      if (active && payload && payload.length && label) {
        const buscarEntregas = async () => {
          setCarregandoEntregas(true);
          try {
            // Extrair ano e semana do label (formato: "Sem 01/24")
            const match = label.match(/Sem (\d{2})\/(\d{2})/);
            if (match) {
              const [, semanaStr, anoStr] = match;
              const ano = 2000 + parseInt(anoStr);
              const semana = parseInt(semanaStr);
              const {
                startDate,
                endDate
              } = getWeekDates(ano, semana);
              const {
                data: entregas
              } = await supabase.from('historico_entregas').select('data, quantidade').eq('cliente_id', cliente.id).eq('tipo', 'entrega').gte('data', startDate.toISOString()).lte('data', endDate.toISOString()).order('data');
              setEntregasDetalhes(entregas || []);
            }
          } catch (err) {
            console.error('Erro ao buscar entregas:', err);
          } finally {
            setCarregandoEntregas(false);
          }
        };
        buscarEntregas();
      }
    }, [active, label]);
    if (active && payload && payload.length) {
      // Extrair ano e semana do label
      const match = label.match(/Sem (\d{2})\/(\d{2})/);
      let periodoTexto = '';
      if (match) {
        const [, semanaStr, anoStr] = match;
        const ano = 2000 + parseInt(anoStr);
        const semana = parseInt(semanaStr);
        const {
          startDate,
          endDate
        } = getWeekDates(ano, semana);
        periodoTexto = `${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`;
      }
      return <div className="bg-background border border-border rounded-md shadow-lg p-3 max-w-xs">
          <div className="font-medium">{label}</div>
          {periodoTexto && <div className="text-xs text-muted-foreground mb-2">{periodoTexto}</div>}
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-muted-foreground">Giro:</span>
              <span className="font-medium">{payload[0].value} unidades</span>
            </div>
            {payload[1] && <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-muted-foreground">Média Histórica:</span>
                <span className="font-medium">{payload[1].value} unidades</span>
              </div>}
          </div>
          
          {carregandoEntregas ? <div className="mt-2 text-xs text-muted-foreground">Carregando entregas...</div> : entregasDetalhes.length > 0 ? <div className="mt-3 pt-2 border-t border-border">
              <div className="text-xs font-medium mb-1">Entregas no período:</div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {entregasDetalhes.map((entrega, idx) => <div key={idx} className="text-xs flex justify-between">
                    <span>{new Date(entrega.data).toLocaleDateString('pt-BR')}</span>
                    <span className="font-medium">{entrega.quantidade} un</span>
                  </div>)}
              </div>
            </div> : <div className="mt-2 text-xs text-muted-foreground">Nenhuma entrega neste período</div>}
        </div>;
    }
    return null;
  };
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GiroMetricCard title="Média Histórica" value={dadosGiro.mediaHistorica} suffix="un/sem" description="Últimas 4 semanas" />
        
        <GiroMetricCard title="Última Semana" value={dadosGiro.ultimaSemana} suffix="unidades" trend={dadosGiro.variacaoPercentual !== 0 ? {
        value: Math.abs(dadosGiro.variacaoPercentual),
        isPositive: dadosGiro.variacaoPercentual >= 0
      } : undefined} description="vs média histórica" icon={dadosGiro.variacaoPercentual >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />} />
        
        <GiroMetricCard title="Comparativo com Giro Geral" value={`${comparativoGiroGeral}%`} description="vs giro médio geral" status={comparativoGiroGeral >= 100 ? 'verde' : 'vermelho'} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Giro Semanal - Últimas 12 semanas</CardTitle>
          <CardDescription className="text-left">
            Evolução do giro semanal baseado no histórico real de entregas com média histórica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosGrafico} margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10
            }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="giro" name="Giro Semanal (Real)" stroke="#2563eb" strokeWidth={2} dot={{
                r: 4
              }} activeDot={{
                r: 6
              }} />
                <Line type="monotone" dataKey="mediaHistorica" name="Média Histórica" stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>;
}