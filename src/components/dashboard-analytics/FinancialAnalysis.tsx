
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DREData } from "@/types/projections";
import { DashboardData } from "@/types";
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
  
  useEffect(() => {
    if (baseDRE) {
      // Transform channelsData for the bar chart
      const revenueData = baseDRE.channelsData.map(channel => ({
        name: mapChannelName(channel.channel),
        revenue: Math.round(channel.revenue),
        margin: Math.round(channel.margin)
      }));
      
      setChannelRevenueData(revenueData);
      
      // Create margin data for pie chart
      const pie = [
        { name: 'Custos Variáveis', value: Math.round(baseDRE.totalVariableCosts) },
        { name: 'Custos Fixos', value: Math.round(baseDRE.totalFixedCosts) },
        { name: 'Custos Adm.', value: Math.round(baseDRE.totalAdministrativeCosts) },
        { name: 'Resultado Op.', value: Math.round(baseDRE.operationalResult) }
      ];
      
      setMarginData(pie);
    }
  }, [baseDRE]);
  
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
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Receita por Canal
              </CardTitle>
              <CardDescription>Distribuição de faturamento por segmento</CardDescription>
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
                <p className="text-muted-foreground">Carregando dados...</p>
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
              <CardDescription>Distribuição entre custos e margem operacional</CardDescription>
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
                <p className="text-muted-foreground">Carregando dados...</p>
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
            <CardDescription>Métricas e KPIs financeiros</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Margem Bruta</div>
              <div className="mt-1 text-2xl font-bold">
                {baseDRE ? `${baseDRE.grossMargin.toFixed(1)}%` : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Margem Operacional</div>
              <div className="mt-1 text-2xl font-bold">
                {baseDRE ? `${baseDRE.operationalMargin.toFixed(1)}%` : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">EBITDA</div>
              <div className="mt-1 text-2xl font-bold">
                {baseDRE ? formatCurrency(baseDRE.ebitda) : "-"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Payback (meses)</div>
              <div className="mt-1 text-2xl font-bold">
                {baseDRE ? baseDRE.paybackMonths.toFixed(1) : "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
