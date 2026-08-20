import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, RefreshCw } from "lucide-react";
import { useFluxoCaixa, type HorizonteFluxo } from "@/hooks/useFluxoCaixa";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const brlCurto = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v));

const dataBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const diaCurto = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

export default function FluxoCaixaPanel() {
  const [horizonte, setHorizonte] = useState<HorizonteFluxo>(30);
  const { dados, loading, error, refetch, salvarSaldo, salvandoSaldo } =
    useFluxoCaixa(horizonte);
  const [edicoes, setEdicoes] = useState<Record<string, { saldo: string; data: string }>>({});

  const chartData = useMemo(
    () =>
      (dados?.serie || []).map((d) => ({
        ...d,
        label: diaCurto(d.data),
        saidasNeg: -d.saidas,
      })),
    [dados]
  );

  const lancamentosPorDia = useMemo(() => {
    const mapa = new Map<string, typeof dados.lancamentos>();
    (dados?.lancamentos || []).forEach((l) => {
      const chave = l.dataVencimento;
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(l);
    });
    return Array.from(mapa.entries());
  }, [dados]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{error.message}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dados) return null;

  const { kpis, contas, periodo } = dados;
  const saldoNegativo = kpis.menorSaldo < 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={String(horizonte)}
          onValueChange={(v) => setHorizonte(Number(v) as HorizonteFluxo)}
        >
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="30">30 dias</TabsTrigger>
            <TabsTrigger value="60">60 dias</TabsTrigger>
            <TabsTrigger value="90">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {dataBR(periodo.inicio)} → {dataBR(periodo.fim)}
          </span>
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo atual (contas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{brl(kpis.saldoAtual)}</div>
            {kpis.contasSemSaldo > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {kpis.contasSemSaldo} conta(s) sem saldo inicial informado
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A receber em aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              {brl(kpis.totalReceber)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A pagar em aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              {brl(kpis.totalPagar)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo projetado ({horizonte}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-semibold ${
                kpis.saldoProjetado < 0 ? "text-destructive" : ""
              }`}
            >
              {brl(kpis.saldoProjetado)}
            </div>
            <p
              className={`mt-1 text-xs ${
                saldoNegativo ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              Menor saldo: {brl(kpis.menorSaldo)} em {dataBR(kpis.menorSaldoData)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projeção diária de caixa</CardTitle>
          <p className="text-xs text-muted-foreground">
            Considera todos os títulos em aberto como se fossem se concretizar no vencimento.
            Títulos vencidos entram no primeiro dia.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={brlCurto} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as (typeof chartData)[number];
                    return (
                      <div className="rounded-md border bg-popover p-3 text-xs shadow-md">
                        <div className="mb-1 font-medium">
                          {dataBR(d.data)}
                          {d.contemAtrasados && (
                            <span className="ml-2 text-destructive">inclui atrasados</span>
                          )}
                        </div>
                        {d.entradas > 0 && (
                          <div className="text-emerald-600">Entradas: {brl(d.entradas)}</div>
                        )}
                        {d.saidas > 0 && (
                          <div className="text-destructive">Saídas: {brl(d.saidas)}</div>
                        )}
                        <div className="mt-1 font-semibold">Saldo: {brl(d.saldo)}</div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="entradas" fill="hsl(142 71% 45%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="saidasNeg" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldo por conta bancária</CardTitle>
          <p className="text-xs text-muted-foreground">
            A API do GestãoClick não expõe saldos. Informe o saldo inicial e a data de
            referência de cada conta — o sistema soma os lançamentos liquidados a partir dela.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead className="w-36">Saldo inicial</TableHead>
                  <TableHead className="w-40">Data referência</TableHead>
                  <TableHead className="w-32 text-right">Liquidado</TableHead>
                  <TableHead className="w-32 text-right">Saldo atual</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((c) => {
                  const edicao = edicoes[c.contaBancariaId];
                  const valorSaldo =
                    edicao?.saldo ?? String(c.saldoInicial ?? 0);
                  const valorData =
                    edicao?.data ?? (c.dataReferencia || periodo.inicio);
                  const alterado = !!edicao;
                  return (
                    <TableRow key={c.contaBancariaId}>
                      <TableCell className="truncate font-medium">{c.nome}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={valorSaldo}
                          onChange={(e) =>
                            setEdicoes((prev) => ({
                              ...prev,
                              [c.contaBancariaId]: {
                                saldo: e.target.value,
                                data: valorData,
                              },
                            }))
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={valorData}
                          onChange={(e) =>
                            setEdicoes((prev) => ({
                              ...prev,
                              [c.contaBancariaId]: {
                                saldo: valorSaldo,
                                data: e.target.value,
                              },
                            }))
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <span className="text-emerald-600">
                          +{brl(c.entradasLiquidadas)}
                        </span>
                        <br />
                        <span className="text-destructive">-{brl(c.saidasLiquidadas)}</span>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          c.saldoAtual < 0 ? "text-destructive" : ""
                        }`}
                      >
                        {c.configurada ? brl(c.saldoAtual) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={alterado ? "default" : "ghost"}
                          disabled={!alterado || salvandoSaldo}
                          onClick={async () => {
                            await salvarSaldo({
                              contaBancariaId: c.contaBancariaId,
                              nomeConta: c.nome,
                              saldoInicial: parseFloat(valorSaldo) || 0,
                              dataReferencia: valorData,
                            });
                            setEdicoes((prev) => {
                              const copia = { ...prev };
                              delete copia[c.contaBancariaId];
                              return copia;
                            });
                          }}
                          title="Salvar saldo"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Lançamentos previstos
            {kpis.atrasados > 0 && (
              <Badge variant="destructive" className="ml-2">
                {kpis.atrasados} vencido(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lancamentosPorDia.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum lançamento em aberto no período.
            </p>
          ) : (
            lancamentosPorDia.map(([dia, itens]) => (
              <div key={dia} className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {dataBR(dia)}
                </div>
                {itens.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {l.tipo === "entrada" ? (
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium">{l.descricao}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[l.contraparte, l.nomeContaBancaria].filter(Boolean).join(" · ")}
                          {l.atrasado ? ` · ${l.diasAtraso} dias em atraso` : ""}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        l.tipo === "entrada" ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      {l.tipo === "entrada" ? "+" : "-"}
                      {brl(l.valor)}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}