import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { CategoriaInfo, UnidadeMedida } from "@/hooks/useProducaoDashboard";
import { UNIDADE_LABEL } from "@/hooks/useProducaoDashboard";

interface ProducaoEvolucaoChartProps {
  dados: Record<string, any>[];
  categorias: CategoriaInfo[];
  unidade: UnidadeMedida;
  granularidade: 'dia' | 'semana' | 'mes';
  textoPeriodo: string;
}

const formatarNumero = (valor: number, unidade: UnidadeMedida) =>
  `${Number(valor).toLocaleString('pt-BR', {
    maximumFractionDigits: unidade === 'peso' ? 1 : 0,
  })} ${UNIDADE_LABEL[unidade]}`;

function TooltipConteudo({
  active,
  payload,
  label,
  unidade,
  config,
}: any) {
  if (!active || !payload?.length) return null;

  const parcial = Boolean(payload[0]?.payload?.parcial);
  const itens = payload
    .map((p: any) => ({
      nome: config[p.name as string]?.label ?? p.name,
      cor: p.color ?? config[p.name as string]?.color,
      valor: Number(p.value) || 0,
    }))
    .filter((i: any) => i.valor > 0)
    .sort((a: any, b: any) => b.valor - a.valor);

  const total = itens.reduce((s: number, i: any) => s + i.valor, 0);

  return (
    <div className="min-w-[180px] rounded-lg border bg-background px-2.5 py-2 text-xs shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{label}</span>
        {parcial && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            em andamento
          </span>
        )}
      </div>

      {itens.length === 0 ? (
        <p className="mt-1.5 text-muted-foreground">Sem produção</p>
      ) : (
        <>
          <div className="mt-1.5 space-y-1">
            {itens.map((i: any) => (
              <div key={i.nome} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: i.cor }}
                />
                <span className="flex-1 truncate text-muted-foreground">{i.nome}</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatarNumero(i.valor, unidade)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t pt-1.5">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatarNumero(total, unidade)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProducaoEvolucaoChart({
  dados,
  categorias,
  unidade,
  granularidade,
  textoPeriodo,
}: ProducaoEvolucaoChartProps) {
  const config = categorias.reduce((acc, c) => {
    acc[c.chave] = { label: c.nome, color: c.cor };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const eixoLabel = unidade === 'peso' ? 'Peso (kg)' : unidade === 'formas' ? 'Formas' : 'Unidades';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 shrink-0" />
              Evolução da produção
            </CardTitle>
            <CardDescription className="text-left">
              {eixoLabel} {granularidade === 'dia' ? 'por dia' : granularidade === 'semana' ? 'por semana' : 'por mês'}, empilhado por categoria — {textoPeriodo.toLowerCase()}
            </CardDescription>
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
                  cursor={{
                    stroke: 'hsl(var(--foreground))',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                    fill: 'transparent',
                  }}
                  content={<TooltipConteudo unidade={unidade} config={config} />}
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
                  >
                    {dados.map((d, i) => (
                      <Cell
                        key={`${c.chave}-${i}`}
                        fill={c.cor}
                        fillOpacity={d.parcial ? 0.35 : 1}
                        stroke={d.parcial ? c.cor : undefined}
                        strokeWidth={d.parcial ? 1 : 0}
                        strokeDasharray={d.parcial ? '3 3' : undefined}
                      />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {dados.some(d => d.parcial) && (
          <p className="mt-2 text-xs text-muted-foreground">
            Barra tracejada e mais clara = {granularidade === 'dia' ? 'dia' : granularidade === 'semana' ? 'semana' : 'mês'} em andamento (ainda não fechado).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
