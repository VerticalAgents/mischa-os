import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  'Ativo': '#22c55e',
  'Inativo': '#ef4444',
  'Em análise': '#f59e0b',
  'Standby': '#6b7280',
  'A ativar': '#3b82f6',
  'Pipeline': '#8b5cf6'
};

const LoadingState = memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[200px] w-full" />
    </CardContent>
  </Card>
));

LoadingState.displayName = 'LoadingState';

export default function HomeStatusPieChart() {
  const navigate = useNavigate();
  const { clientes, loading } = useClienteStore();

  const dadosStatusPie = useMemo(() => {
    const statusCount: Record<string, number> = {};
    
    clientes.forEach(cliente => {
      const status = cliente.statusCliente || 'Sem status';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#9ca3af'
      }))
      .sort((a, b) => b.value - a.value);
  }, [clientes]);

  if (loading) return <LoadingState />;

  if (dadosStatusPie.length === 0) return null;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() => navigate('/gestao-comercial?tab=representantes')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-left">
          Distribuição por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={dadosStatusPie}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              animationDuration={0}
            >
              {dadosStatusPie.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value} clientes`, name]}
            />
            <Legend 
              iconSize={8}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
