
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { memo } from 'react';

interface ChartData {
  dadosStatusPie: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  dadosGiroBar: Array<{
    nome: string;
    giro: number;
  }>;
}

interface RepresentantesChartsProps {
  data: ChartData;
  isLoading: boolean;
}

const ChartSkeleton = memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[250px] w-full" />
    </CardContent>
  </Card>
));

const StatusPieChart = memo(({ data }: { data: ChartData['dadosStatusPie'] }) => (
  <Card>
    <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
      <CardTitle className="text-left text-base sm:text-lg">Distribuição por Status</CardTitle>
      <CardDescription className="text-left text-xs sm:text-sm">Clientes por status atual</CardDescription>
    </CardHeader>
    <CardContent className="p-2 sm:p-6 sm:pt-0">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationDuration={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
));

const GiroBarChart = memo(({ data }: { data: ChartData['dadosGiroBar'] }) => (
  <Card>
    <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
      <CardTitle className="text-left text-base sm:text-lg">Top 10 Clientes - Giro Semanal</CardTitle>
      <CardDescription className="text-left text-xs sm:text-sm">Maiores giros por cliente ativo</CardDescription>
    </CardHeader>
    <CardContent className="p-2 sm:p-6 sm:pt-0">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="nome" 
            angle={-45} 
            textAnchor="end" 
            height={70} 
            fontSize={9} 
            interval={0} 
          />
          <YAxis width={34} fontSize={10} />
          <Tooltip />
          <Bar 
            dataKey="giro" 
            fill="#3b82f6" 
            name="Giro Semanal"
            animationDuration={0}
          />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
));

export default function RepresentantesCharts({ data, isLoading }: RepresentantesChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (data.dadosStatusPie.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2">
      <StatusPieChart data={data.dadosStatusPie} />
      <GiroBarChart data={data.dadosGiroBar} />
    </div>
  );
}
