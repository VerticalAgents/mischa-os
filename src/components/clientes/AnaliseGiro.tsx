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
    mediaHistorica: dadosGiro.mediaHistorica,
    startDate: item.startDate,
    endDate: item.endDate
  }));

  // Tooltip customizado para o gráfico
  const CustomTooltip = ({
    active,
    payload
  }: any) => {
    const [entregasDetalhes, setEntregasDetalhes] = useState<any[]>([]);
    const [carregandoEntregas, setCarregandoEntregas] = useState(false);
    
    // Pegar datas do payload
    const startDate = payload?.[0]?.payload?.startDate;
    const endDate = payload?.[0]?.payload?.endDate;
    
    React.useEffect(() => {
      if (active && startDate && endDate) {
        const buscarEntregas = async () => {
          setCarregandoEntregas(true);
          try {
            const { data: entregas } = await supabase
              .from('historico_entregas')
              .select('data, quantidade')
              .eq('cliente_id', cliente.id)
              .eq('tipo', 'entrega')
              .gte('data', startDate)
              .lte('data', endDate)
              .order('data');
            setEntregasDetalhes(entregas || []);
          } catch (err) {
            console.error('Erro ao buscar entregas:', err);
          } finally {
            setCarregandoEntregas(false);
          }
        };
        buscarEntregas();
      }
    }, [active, startDate, endDate]);
    
    if (active && payload && payload.length) {
      // Formatar período
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      };
      
      const periodoTexto = startDate && endDate 
        ? `📅 ${formatDate(startDate)} - ${formatDate(endDate)}`
        : '';
      
      return (
        <div className="bg-background border border-border rounded-md shadow-lg p-3 max-w-xs">
          {periodoTexto && (
            <div className="text-sm font-medium text-foreground mb-2 pb-2 border-b border-border">
              {periodoTexto}
            </div>
          )}
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-muted-foreground">Vendas:</span>
              <span className="font-medium">{payload[0].value} unidades</span>
            </div>
            {payload[1] && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-muted-foreground">Média:</span>
                <span className="font-medium">{payload[1].value} un/sem</span>
              </div>
            )}
          </div>
          
          {carregandoEntregas ? (
            <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
              Carregando entregas...
            </div>
          ) : entregasDetalhes.length > 0 ? (
            <div className="mt-3 pt-2 border-t border-border">
              <div className="text-xs font-medium mb-1 text-muted-foreground">Entregas:</div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {entregasDetalhes.map((entrega, idx) => (
                  <div key={idx} className="text-xs flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {new Date(entrega.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="font-medium">{entrega.quantidade} un</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground italic">
              Nenhuma entrega neste período
            </div>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Formatar data da primeira entrega
  const dataPrimeiraEntregaFormatada = dadosGiro.dataPrimeiraEntrega 
    ? new Date(dadosGiro.dataPrimeiraEntrega).toLocaleDateString('pt-BR')
    : null;
  
  // Verificar se cliente tem menos de 12 semanas
  const clienteNovo = dadosGiro.numeroSemanasHistorico < 12;
  
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GiroMetricCard title="Média Histórica" value={dadosGiro.mediaHistorica} suffix="un/sem" description={`Últimas ${dadosGiro.numeroSemanasHistorico} semana${dadosGiro.numeroSemanasHistorico !== 1 ? 's' : ''}`} />
        
        <GiroMetricCard title="Última Semana" value={dadosGiro.ultimaSemana} suffix="unidades" trend={dadosGiro.variacaoPercentual !== 0 ? {
        value: Math.abs(dadosGiro.variacaoPercentual),
        isPositive: dadosGiro.variacaoPercentual >= 0
      } : undefined} description="vs média histórica" icon={dadosGiro.variacaoPercentual >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />} />
        
        <GiroMetricCard title="Comparativo com Giro Geral" value={`${comparativoGiroGeral}%`} description="vs giro médio geral" status={comparativoGiroGeral >= 100 ? 'verde' : 'vermelho'} />
      </div>
      
      {clienteNovo && dataPrimeiraEntregaFormatada && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
          <span className="font-medium">ℹ️ Cliente novo:</span> A média está sendo calculada com base em {dadosGiro.numeroSemanasHistorico} semana{dadosGiro.numeroSemanasHistorico !== 1 ? 's' : ''}, pois a primeira entrega foi em {dataPrimeiraEntregaFormatada}.
        </div>
      )}
      
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