
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Cliente } from "@/hooks/useClientesSupabase";

interface LogisticsTypeData {
  name: string;
  value: number;
  count: number;
}

interface LogisticsTypeChartProps {
  clientes: Cliente[];
}

export function LogisticsTypeChart({ clientes }: LogisticsTypeChartProps) {
  const [chartData, setChartData] = useState<LogisticsTypeData[]>([]);
  
  useEffect(() => {
    if (clientes.length === 0) return;
    
    // Count clients by logistics type
    const activeClients = clientes.filter(c => c.status_cliente === 'Ativo' || c.status_cliente === 'Em análise');
    const countByType = new Map<string, number>();
    
    activeClients.forEach(cliente => {
      const type = cliente.tipo_logistica || 'Própria';
      countByType.set(type, (countByType.get(type) || 0) + 1);
    });
    
    const total = activeClients.length;
    
    // Prepare chart data
    const data: LogisticsTypeData[] = [];
    countByType.forEach((count, type) => {
      data.push({
        name: type,
        value: (count / total) * 100,
        count
      });
    });
    
    setChartData(data);
  }, [clientes]);

  // Define colors for the chart
  const COLORS = ['#10b981', '#3b82f6'];
  
  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md p-3 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.count} clientes ({data.value.toFixed(1)}%)</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;
    
    const totalClients = chartData.reduce((sum, item) => sum + item.count, 0);
    
    return (
      <div className="flex flex-col items-center mt-4 space-y-2">
        <p className="text-sm font-medium">Total: {totalClients} clientes</p>
        <div className="flex flex-wrap justify-center gap-4">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center">
              <div 
                className="w-3 h-3 mr-2" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-sm">
                {entry.value}: {chartData.find(item => item.name === entry.value)?.count || 0} (
                {chartData.find(item => item.name === entry.value)?.value.toFixed(1) || 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Tipo de Logística</CardTitle>
        <CardDescription>Distribuição de PDVs por tipo de logística</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
