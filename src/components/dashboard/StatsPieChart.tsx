
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DataItem = {
  name: string;
  value: number;
};

type StatsPieChartProps = {
  data: DataItem[];
  title: string;
  description?: string;
  colors?: string[];
};

export default function StatsPieChart({ 
  data, 
  title, 
  description,
  colors = ['#4ade80', '#60a5fa', '#facc15', '#c084fc', '#f87171']
}: StatsPieChartProps) {
  // Filtrar para mostrar apenas itens com valor > 0
  const filteredData = data.filter(item => item.value > 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} PDVs`, ""]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Sem dados para exibir</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Função para renderizar o label personalizado dentro do gráfico
const renderCustomizedLabel = ({ 
  cx, 
  cy, 
  midAngle, 
  innerRadius, 
  outerRadius, 
  percent, 
  index, 
  name, 
  value 
}: any) => {
  if (percent < 0.05) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${value}`}
    </text>
  );
};
