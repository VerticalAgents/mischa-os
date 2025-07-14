
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, PieChart, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DREData } from "@/types/projections";
import { DashboardData } from "@/types";
import { useDREData } from "@/hooks/useDREData";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsePieChart,
  Pie,
  Cell
} from "recharts";

interface FinancialAnalysisProps {
  baseDRE: DREData | null;
  dashboardData: DashboardData;
}

export default function FinancialAnalysis({
  baseDRE,
  dashboardData
}: FinancialAnalysisProps) {
  const [channelRevenueData, setChannelRevenueData] = useState<any[]>([]);
  const [marginData, setMarginData] = useState<any[]>([]);
  
  // Usar dados reais da DRE
  const { dreData, dreCalculationResult, isLoading, error } = useDREData();
  
  // Usar dados reais se disponíveis, senão usar dados antigos
  const currentDREData = dreData || baseDRE;
  const currentCalculationResult = dreCalculationResult;
  
  useEffect(() => {
    if (currentDREData) {
      // Transform channelsData for the bar chart usando dados reais
      const revenueData = currentDREData.channelsData.map(channel => ({
        name: mapChannelName(channel.channel),
        revenue: Math.round(channel.revenue),
        margin: Math.round(channel.margin)
      }));
      
      setChannelRevenueData(revenueData);
      
      // Create margin data for pie chart usando dados reais
      const pie = [
        { name: 'Custos Variáveis', value: Math.round(currentDREData.totalVariableCosts) },
        { name: 'Custos Fixos', value: Math.round(currentDREData.totalFixedCosts) },
        { name: 'Custos Adm.', value: Math.round(currentDREData.totalAdministrativeCosts) },
        { name: 'Resultado Op.', value: Math.round(currentDREData.operationalResult) }
      ];
      
      setMarginData(pie);
    }
  }, [currentDREData]);
  
  // Helper function to map channel names to more readable versions
  const mapChannelName = (channel: string) => {
    const nameMap: Record<string, string> = {
      'B2B-Revenda': 'Revenda',
      'B2B-FoodService': 'Food Service',
      'B2C-UFCSPA': 'UFCSPA',
      'B2C-Personalizados': 'Personalizados',
      'B2C-Outros': 'Outros B2C'
    };
    
    return nameMap[channel] || channel;
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };
  
  // Colors for charts
  const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
  const PIE_COLORS = ['#f87171', '#facc15', '#a3a3a3', '#4ade80'];
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados financeiros reais...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados financeiros: {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Indicador de dados reais */}
      {dreData && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            ✅ Dados atualizados com base nas projeções reais dos clientes e custos do sistema
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Receita por Canal
              </CardTitle>
              <CardDescription>
                Distribuição de faturamento por segmento
                {dreData && <span className="text-green-600 font-medium"> (Dados Reais)</span>}
              </CardDescription>
            </div>
            <Button variant="ghost" asChild className="text-xs">
              <Link to="/projecoes" className="flex items-center">
                Ver projeções <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="h-80">
            {channelRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" name="Receita" fill="#8b5cf6" />
                  <Bar dataKey="margin" name="Margem" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-muted-foreground" />
                Composição do Resultado
              </CardTitle>
              <CardDescription>
                Distribuição entre custos e margem operacional
                {dreData && <span className="text-green-600 font-medium"> (Dados Reais)</span>}
              </CardDescription>
            </div>
            <Button variant="ghost" asChild className="text-xs">
              <Link to="/projecoes" className="flex items-center">
                Ver projeções <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="h-80">
            {marginData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsePieChart>
                  <Pie
                    data={marginData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {marginData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </RechartsePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Indicadores Financeiros
            </CardTitle>
            <CardDescription>
              Métricas e KPIs financeiros
              {dreData && <span className="text-green-600 font-medium"> (Dados Reais)</span>}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Margem Bruta</div>
              <div className="mt-1 text-2xl font-bold">
                {currentDREData ? `${currentDREData.grossMargin.toFixed(1)}%` : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Margem Operacional</div>
              <div className="mt-1 text-2xl font-bold">
                {currentDREData ? `${currentDREData.operationalMargin.toFixed(1)}%` : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">EBITDA</div>
              <div className="mt-1 text-2xl font-bold">
                {currentDREData ? formatCurrency(currentDREData.ebitda) : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Ponto de Equilíbrio</div>
              <div className="mt-1 text-2xl font-bold">
                {currentDREData ? formatCurrency(currentDREData.breakEvenPoint) : "-"}
              </div>
            </div>
          </div>
          
          {/* Detalhes adicionais se temos dados reais */}
          {currentCalculationResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Detalhes do Cálculo:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Clientes Ativos:</span>
                  <span className="ml-2 font-medium">{currentCalculationResult.detalhesCalculos.clientesAtivos}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Com NF:</span>
                  <span className="ml-2 font-medium">{currentCalculationResult.detalhesCalculos.clientesComNF}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">% Impostos:</span>
                  <span className="ml-2 font-medium">{currentCalculationResult.detalhesCalculos.percentualImpostos.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Categorias:</span>
                  <span className="ml-2 font-medium">{currentCalculationResult.detalhesCalculos.faturamentoPorCategoria.length}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
