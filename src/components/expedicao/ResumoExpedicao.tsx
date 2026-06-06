
import { useEffect, useMemo, useState } from "react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoUiStore } from "@/hooks/useExpedicaoUiStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  RefreshCw, Package, Calendar, CalendarDays, ClipboardList, CheckCircle2,
  Truck, PackageCheck, AlertTriangle, Map as MapIcon, Layers
} from "lucide-react";
import {
  format, startOfWeek, endOfWeek, startOfDay, endOfDay, parseISO,
  addWeeks, subWeeks, isSameWeek, eachDayOfInterval, isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResumoQuantidadeProdutos } from "./components/ResumoQuantidadeProdutos";
import { WeekNavigator } from "./components/WeekNavigator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

const parseDataLocal = (s: string): Date => {
  if (!s) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const PEDIDO_GRANDE_LIMITE = 60;

const ResumoExpedicao = () => {
  const { pedidos, isLoading, carregarPedidos } = useExpedicaoStore();
  const {
    modoDataResumo, dataResumo, semanaResumo,
    setModoDataResumo, setDataResumo, setSemanaResumo,
    setActiveTab,
  } = useExpedicaoUiStore();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // Sempre que entrar na aba, resetar filtro para a semana atual
  useEffect(() => {
    const hoje = new Date();
    setModoDataResumo('semana');
    setSemanaResumo(startOfWeek(hoje, { weekStartsOn: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const semanaSelecionada = useMemo(() => {
    try { return parseISO(semanaResumo); } catch { return new Date(); }
  }, [semanaResumo]);

  const { inicio, fim } = useMemo(() => {
    if (modoDataResumo === 'dia') {
      const d = parseDataLocal(dataResumo);
      return { inicio: startOfDay(d), fim: endOfDay(d) };
    }
    return {
      inicio: startOfWeek(semanaSelecionada, { weekStartsOn: 0 }),
      fim: endOfWeek(semanaSelecionada, { weekStartsOn: 0 }),
    };
  }, [modoDataResumo, dataResumo, semanaSelecionada]);

  const pedidosNoPeriodo = useMemo(() => {
    return pedidos.filter(p => {
      const d = new Date(p.data_prevista_entrega);
      return d >= inicio && d <= fim;
    });
  }, [pedidos, inicio, fim]);

  const pedidosPendentes = pedidosNoPeriodo.filter(p => !p.substatus_pedido || p.substatus_pedido === 'Agendado');
  const pedidosSeparados = pedidosNoPeriodo.filter(p => p.substatus_pedido === 'Separado');
  const pedidosDespachados = pedidosNoPeriodo.filter(p => p.substatus_pedido === 'Despachado');

  // Entregues vêm de historico_entregas
  const [entregues, setEntregues] = useState<{ count: number; qtd: number }>({ count: 0, qtd: 0 });
  useEffect(() => {
    let cancelled = false;
    const fetchEntregues = async () => {
      const { data, error } = await supabase
        .from('historico_entregas')
        .select('id, quantidade')
        .eq('tipo', 'entrega')
        .gte('data', format(inicio, 'yyyy-MM-dd'))
        .lte('data', format(fim, 'yyyy-MM-dd'));
      if (cancelled || error) return;
      setEntregues({
        count: data?.length || 0,
        qtd: (data || []).reduce((s, r: any) => s + (r.quantidade || 0), 0),
      });
    };
    fetchEntregues();
    return () => { cancelled = true; };
  }, [inicio, fim]);

  // Comparativo período anterior (mesma duração)
  const [comparativoEntregues, setComparativoEntregues] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const durDias = modoDataResumo === 'dia' ? 1 : 7;
    const inicioAnt = new Date(inicio); inicioAnt.setDate(inicioAnt.getDate() - durDias);
    const fimAnt = new Date(fim); fimAnt.setDate(fimAnt.getDate() - durDias);
    const run = async () => {
      const { data } = await supabase
        .from('historico_entregas')
        .select('quantidade')
        .eq('tipo', 'entrega')
        .gte('data', format(inicioAnt, 'yyyy-MM-dd'))
        .lte('data', format(fimAnt, 'yyyy-MM-dd'));
      if (cancelled) return;
      setComparativoEntregues((data || []).reduce((s, r: any) => s + (r.quantidade || 0), 0));
    };
    run();
    return () => { cancelled = true; };
  }, [inicio, fim, modoDataResumo]);

  // Atrasados (global, fora do período): data < hoje e status pendente/separado
  const atrasados = useMemo(() => {
    const hoje = startOfDay(new Date());
    return pedidos.filter(p => {
      const d = startOfDay(new Date(p.data_prevista_entrega));
      const status = p.substatus_pedido || 'Agendado';
      return d < hoje && (status === 'Agendado' || status === 'Separado');
    });
  }, [pedidos]);

  const semLogistica = useMemo(() =>
    pedidosNoPeriodo.filter(p => !p.tipo_logistica || p.tipo_logistica.trim() === ''),
    [pedidosNoPeriodo]);

  const pedidosGrandes = useMemo(() =>
    pedidosNoPeriodo.filter(p => (p.quantidade_total || 0) >= PEDIDO_GRANDE_LIMITE),
    [pedidosNoPeriodo]);

  // Distribuição por dia (modo semana)
  const distribuicaoPorDia = useMemo(() => {
    if (modoDataResumo !== 'semana') return [];
    const dias = eachDayOfInterval({ start: inicio, end: fim });
    return dias.map(dia => {
      const doDia = pedidosNoPeriodo.filter(p => isSameDay(new Date(p.data_prevista_entrega), dia));
      const unidades = doDia.reduce((s, p) => s + (p.quantidade_total || 0), 0);
      return { dia, pedidos: doDia.length, unidades };
    });
  }, [modoDataResumo, inicio, fim, pedidosNoPeriodo]);

  const maxUnidadesDia = Math.max(1, ...distribuicaoPorDia.map(d => d.unidades));

  // Distribuição por logística
  const distribuicaoPorLogistica = useMemo(() => {
    const map = new Map<string, { pedidos: number; unidades: number }>();
    pedidosNoPeriodo.forEach(p => {
      const key = (p.tipo_logistica && p.tipo_logistica.trim()) || 'Sem logística';
      const cur = map.get(key) || { pedidos: 0, unidades: 0 };
      cur.pedidos += 1;
      cur.unidades += p.quantidade_total || 0;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.unidades - a.unidades);
  }, [pedidosNoPeriodo]);

  const totalUnidadesPeriodo = pedidosNoPeriodo.reduce((s, p) => s + (p.quantidade_total || 0), 0);

  // Navegação
  const irPara = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const np = new URLSearchParams(prev);
      np.set('tab', tab);
      return np;
    }, { replace: true });
  };

  const ehSemanaAtual = isSameWeek(semanaSelecionada, new Date(), { weekStartsOn: 0 });
  const periodoLabel = modoDataResumo === 'dia'
    ? format(parseDataLocal(dataResumo), "dd 'de' MMMM", { locale: ptBR })
    : `${format(inicio, "dd/MM")} – ${format(fim, "dd/MM")}`;

  const deltaEntregues = comparativoEntregues !== null && comparativoEntregues > 0
    ? Math.round(((entregues.qtd - comparativoEntregues) / comparativoEntregues) * 100)
    : null;

  if (isLoading && pedidos.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + filtro de período */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">Resumo da Expedição</h2>
            <p className="text-sm text-muted-foreground">{periodoLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-md border overflow-hidden">
            <Button
              variant={modoDataResumo === 'dia' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setModoDataResumo('dia')}
              className="rounded-none border-0 px-3"
            >
              <Calendar className="h-4 w-4 mr-1" /> Dia
            </Button>
            <Button
              variant={modoDataResumo === 'semana' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setModoDataResumo('semana')}
              className="rounded-none border-0 px-3"
            >
              <CalendarDays className="h-4 w-4 mr-1" /> Semana
            </Button>
          </div>

          {modoDataResumo === 'dia' ? (
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <Input
                type="date"
                value={dataResumo}
                onChange={(e) => setDataResumo(e.target.value)}
                className="pl-9 w-[170px]"
              />
            </div>
          ) : (
            <WeekNavigator
              semanaAtual={semanaSelecionada}
              onSemanaAnterior={() => setSemanaResumo(subWeeks(semanaSelecionada, 1))}
              onProximaSemana={() => setSemanaResumo(addWeeks(semanaSelecionada, 1))}
              onVoltarHoje={() => setSemanaResumo(new Date())}
              ehSemanaAtual={ehSemanaAtual}
            />
          )}

          <Button onClick={() => carregarPedidos()} size="sm" variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Funil de Status — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusFunilCard
          titulo="Pendentes"
          icone={<ClipboardList className="h-5 w-5" />}
          pedidos={pedidosPendentes.length}
          unidades={pedidosPendentes.reduce((s, p) => s + (p.quantidade_total || 0), 0)}
          tone="amber"
          onClick={() => irPara("separacao")}
        />
        <StatusFunilCard
          titulo="Separados"
          icone={<CheckCircle2 className="h-5 w-5" />}
          pedidos={pedidosSeparados.length}
          unidades={pedidosSeparados.reduce((s, p) => s + (p.quantidade_total || 0), 0)}
          tone="blue"
          onClick={() => irPara("despacho")}
        />
        <StatusFunilCard
          titulo="Despachados"
          icone={<Truck className="h-5 w-5" />}
          pedidos={pedidosDespachados.length}
          unidades={pedidosDespachados.reduce((s, p) => s + (p.quantidade_total || 0), 0)}
          tone="indigo"
          onClick={() => irPara("despacho")}
        />
        <StatusFunilCard
          titulo="Entregues"
          icone={<PackageCheck className="h-5 w-5" />}
          pedidos={entregues.count}
          unidades={entregues.qtd}
          tone="green"
          onClick={() => irPara("dashboard")}
          delta={deltaEntregues}
        />
      </div>

      {/* Grid: Produtos a Separar + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResumoQuantidadeProdutos pedidos={pedidosPendentes} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertas & Destaques
            </CardTitle>
            <CardDescription>Itens que merecem atenção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AlertaItem
              cor="red"
              titulo="Pedidos atrasados"
              descricao={atrasados.length === 0
                ? "Nenhum pedido atrasado — em dia!"
                : `${atrasados.length} pedido(s) com data anterior a hoje e ainda não despachados.`}
              valor={atrasados.length}
              actionLabel={atrasados.length > 0 ? "Ver despacho" : undefined}
              onAction={() => irPara("despacho")}
            />
            <AlertaItem
              cor="amber"
              titulo="Pedidos grandes (≥ 60 un)"
              descricao={pedidosGrandes.length === 0
                ? "Sem pedidos grandes no período."
                : `${pedidosGrandes.length} pedido(s) acima de ${PEDIDO_GRANDE_LIMITE} unidades — priorize a separação.`}
              valor={pedidosGrandes.length}
            />
            <AlertaItem
              cor="muted"
              titulo="Sem logística definida"
              descricao={semLogistica.length === 0
                ? "Todos os pedidos com logística."
                : `${semLogistica.length} pedido(s) sem tipo de logística cadastrado.`}
              valor={semLogistica.length}
              actionLabel={semLogistica.length > 0 ? "Ver organização" : undefined}
              onAction={() => irPara("organizacao")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por dia (semana) */}
      {modoDataResumo === 'semana' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Distribuição por dia
            </CardTitle>
            <CardDescription>
              Total: {pedidosNoPeriodo.length} pedidos · {totalUnidadesPeriodo} unidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {distribuicaoPorDia.map(({ dia, pedidos, unidades }) => {
                const altura = (unidades / maxUnidadesDia) * 100;
                const ehHoje = isSameDay(dia, new Date());
                return (
                  <div key={dia.toISOString()} className="flex flex-col items-center gap-1">
                    <div className="w-full h-24 bg-muted/40 rounded-md flex items-end overflow-hidden">
                      <div
                        className={cn(
                          "w-full rounded-md transition-all",
                          ehHoje ? "bg-primary" : "bg-primary/60"
                        )}
                        style={{ height: `${altura}%`, minHeight: unidades > 0 ? '6px' : '0' }}
                        title={`${unidades} unidades`}
                      />
                    </div>
                    <div className={cn(
                      "text-xs font-medium",
                      ehHoje ? "text-primary" : "text-muted-foreground"
                    )}>
                      {format(dia, 'EEE', { locale: ptBR })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(dia, 'dd/MM')}
                    </div>
                    <div className="text-xs font-semibold">{unidades}</div>
                    <div className="text-[10px] text-muted-foreground">{pedidos}p</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por logística */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            Distribuição por logística
          </CardTitle>
          <CardDescription>Como os pedidos do período serão entregues</CardDescription>
        </CardHeader>
        <CardContent>
          {distribuicaoPorLogistica.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 italic">
              Sem pedidos no período selecionado.
            </p>
          ) : (
            <div className="space-y-2">
              {distribuicaoPorLogistica.map((item) => {
                const pct = totalUnidadesPeriodo > 0
                  ? (item.unidades / totalUnidadesPeriodo) * 100
                  : 0;
                return (
                  <div key={item.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.nome}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{item.pedidos} pedido{item.pedidos !== 1 ? 's' : ''}</span>
                        <Badge variant="secondary">{item.unidades} un</Badge>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- Sub-components ----------

const toneClasses: Record<string, { bg: string; text: string; ring: string }> = {
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-900' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-900' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', ring: 'ring-indigo-200 dark:ring-indigo-900' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-900' },
};

interface StatusFunilCardProps {
  titulo: string;
  icone: React.ReactNode;
  pedidos: number;
  unidades: number;
  tone: keyof typeof toneClasses;
  onClick?: () => void;
  delta?: number | null;
}

const StatusFunilCard = ({ titulo, icone, pedidos, unidades, tone, onClick, delta }: StatusFunilCardProps) => {
  const c = toneClasses[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-lg p-4 ring-1 transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary",
        c.bg, c.ring,
      )}
    >
      <div className={cn("flex items-center justify-between mb-2", c.text)}>
        <span className="text-sm font-medium">{titulo}</span>
        {icone}
      </div>
      <div className={cn("text-3xl font-bold", c.text)}>{pedidos}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">
          {pedidos === 1 ? 'pedido' : 'pedidos'} · {unidades} un
        </span>
        {delta !== null && delta !== undefined && (
          <span className={cn(
            "text-xs font-semibold",
            delta >= 0 ? "text-emerald-600" : "text-red-600"
          )}>
            {delta >= 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
    </button>
  );
};

const alertaCores: Record<string, string> = {
  red: 'border-red-200 bg-red-50 dark:bg-red-950/20',
  amber: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20',
  muted: 'border-border bg-muted/40',
};

interface AlertaItemProps {
  cor: 'red' | 'amber' | 'muted';
  titulo: string;
  descricao: string;
  valor: number;
  actionLabel?: string;
  onAction?: () => void;
}

const AlertaItem = ({ cor, titulo, descricao, valor, actionLabel, onAction }: AlertaItemProps) => {
  return (
    <div className={cn("border rounded-lg p-3 flex items-start gap-3", alertaCores[cor])}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{titulo}</span>
          <Badge variant={valor > 0 ? 'default' : 'secondary'}>{valor}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
      </div>
      {actionLabel && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default ResumoExpedicao;
