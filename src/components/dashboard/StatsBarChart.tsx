
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DataItem = {
  name: string;
  value: number;
  [key: string]: any;
};

type StatsBarChartProps = {
  data: DataItem[];
  title: string;
  description?: string;
  xAxisDataKey?: string;
  bars: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
};

export default function StatsBarChart({ 
  data, 
  title, 
  description,
  xAxisDataKey = 'name',
  bars
}: StatsBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={xAxisDataKey}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                {bars.map((bar, index) => (
                  <Bar 
                    key={index}
                    dataKey={bar.dataKey}
                    name={bar.name}
                    fill={bar.color}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </RechartsBarChart>
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
