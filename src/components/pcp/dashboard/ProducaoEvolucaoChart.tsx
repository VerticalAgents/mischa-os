import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { CategoriaInfo, UnidadeMedida } from "@/hooks/useProducaoDashboard";
import { UNIDADE_LABEL } from "@/hooks/useProducaoDashboard";

interface ProducaoEvolucaoChartProps {
  dados: Record<string, any>[];
  categorias: CategoriaInfo[];
  unidade: UnidadeMedida;
  meses: string;
  onMesesChange: (v: string) => void;
}

export default function ProducaoEvolucaoChart({
  dados,
  categorias,
  unidade,
  meses,
  onMesesChange,
}: ProducaoEvolucaoChartProps) {
  const config = categorias.reduce((acc, c) => {
    acc[c.chave] = { label: c.nome, color: c.cor };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const eixoLabel = unidade === 'peso' ? 'Peso (kg)' : unidade === 'formas' ? 'Formas' : 'Unidades';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 shrink-0" />
              Evolução da produção
            </CardTitle>
            <CardDescription className="text-left">
              {eixoLabel} por mês, empilhado por categoria
            </CardDescription>
          </div>
          <Select value={meses} onValueChange={onMesesChange}>
            <SelectTrigger className="w-[150px] h-9 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
              <SelectItem value="24">Últimos 24 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {dados.length === 0 || categorias.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Nenhum dado disponível para o período
          </div>
        ) : (
          <ChartContainer config={config} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" tick={{ fill: 'hsl(var(--foreground))' }} />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  tickFormatter={(v: number) => Number(v).toLocaleString('pt-BR')}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: any, name: any) => [
                        `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${UNIDADE_LABEL[unidade]}`,
                        config[name as string]?.label ?? name,
                      ]}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {categorias.map((c, index) => (
                  <Bar
                    key={c.chave}
                    dataKey={c.chave}
                    stackId="producao"
                    fill={c.cor}
                    name={c.chave}
                    radius={index === categorias.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
