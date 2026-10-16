import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, HandCoins, Loader2, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * Comissões do representante (Lucca, 15/10/2026): só leitura e só a dele. Mostra a quinzena em
 * andamento nota por nota, as contas que o Lucca já lançou (recebida, a receber, atrasada) e o
 * risco de desconto (boleto vencido de cliente dele). Pedido lançado e ainda sem nota aparece à
 * parte, como previsão: só vira comissão quando a nota sai no despacho. A conta é a mesma da aba Comissões do admin
 * (gestaoclick-proxy, ação minhas_comissoes); quem ele é sai do login, no servidor.
 */

interface Quinzena {
  inicio: string;
  fim: string;
  pagamento: string;
}

interface Nota {
  nf_id: string;
  numero: string;
  cliente: string;
  data_emissao: string;
  unidades: number;
  comissao: number;
  sem_nota?: boolean;
  lancada_em: string | null;
}

interface Acerto {
  nf_id: string;
  numero: string;
  cliente: string;
  vencimento: string | null;
  valor: number;
  tipo: "descontar" | "devolver";
}

interface Risco {
  nf_id: string;
  numero: string;
  cliente: string;
  vencimento: string | null;
  valor: number;
  dias_para_desconto: number;
}

interface Lancamento {
  codigo: string | null;
  vencimento: string;
  liquido: number;
  notas: number;
  situacao: "recebida" | "a_receber" | "atrasada" | null;
  pago_em: string | null;
}

interface PedidoAFaturar {
  cliente: string;
  data_entrega: string | null;
  unidades: number;
  comissao: number;
  quinzena: Quinzena | null;
  etapa: "lancado" | "separado" | "venda_gerada";
  sem_nota: boolean;
}

interface QuinzenaDoRep {
  quinzena: Quinzena;
  fechada: boolean;
  notas: Nota[];
  acertos: Acerto[];
  em_risco: Risco[];
  lancamentos: Lancamento[];
  a_faturar: PedidoAFaturar[];
}

const ETAPA = { lancado: "pedido lançado", separado: "separado na fábrica", venda_gerada: "venda gerada" } as const;

const reais = (centavos: number) => formatCurrency(centavos / 100);
const dataBR = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const diaMes = (iso: string) => dataBR(iso).slice(0, 5);
const rotuloNota = (n: { numero: string; sem_nota?: boolean }) =>
  n.sem_nota || n.numero === "sem nota" ? "Entrega sem nota" : `NF ${n.numero}`;
const hoje = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

const CACHE = "mischaos-minhas-comissoes-v1";
const PASSOS = ["Lendo suas notas no Gestão Click", "Juntando as entregas", "Conferindo os boletos", "Montando a quinzena"];

// ?demo=1: dados falsos para ver a tela cheia, sem venda real. Não grava nada.
const DEMO = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";
function demo(): QuinzenaDoRep[] {
  const h = hoje();
  return [
    {
      quinzena: { inicio: h.slice(0, 8) + (Number(h.slice(8)) <= 15 ? "01" : "16"), fim: h, pagamento: h },
      fechada: false,
      notas: [
        { nf_id: "d1", numero: "9101", cliente: "Mercado Nobel (DEMONSTRAÇÃO)", data_emissao: h, unidades: 36, comissao: 3060, lancada_em: null },
        { nf_id: "d2", numero: "sem nota", sem_nota: true, cliente: "Atacado Simionato (DEMONSTRAÇÃO)", data_emissao: h, unidades: 54, comissao: 4590, lancada_em: null },
      ],
      acertos: [{ nf_id: "d3", numero: "9050", cliente: "Silva Variedades (DEMONSTRAÇÃO)", vencimento: h, valor: 3060, tipo: "descontar" }],
      em_risco: [{ nf_id: "d4", numero: "9077", cliente: "Mercado Vitória (DEMONSTRAÇÃO)", vencimento: h, valor: 6120, dias_para_desconto: 1 }],
      lancamentos: [
        { codigo: "5201", vencimento: h, liquido: 12240, notas: 4, situacao: "a_receber", pago_em: null },
        { codigo: "5150", vencimento: "2026-10-16", liquido: 9180, notas: 3, situacao: "recebida", pago_em: "2026-10-16" },
      ],
      a_faturar: [
        { cliente: "Rei do Kit (DEMONSTRAÇÃO)", data_entrega: "2026-10-16", unidades: 36, comissao: 3060, quinzena: { inicio: "2026-10-16", fim: "2026-10-31", pagamento: "2026-11-01" }, etapa: "separado", sem_nota: false },
        { cliente: "Mercado Eleane (DEMONSTRAÇÃO)", data_entrega: "2026-10-16", unidades: 72, comissao: 6120, quinzena: { inicio: "2026-10-16", fim: "2026-10-31", pagamento: "2026-11-01" }, etapa: "lancado", sem_nota: false },
      ],
    },
  ];
}

function normalizar(lista: Partial<QuinzenaDoRep>[]): QuinzenaDoRep[] {
  return lista.map((d) => ({
    quinzena: d.quinzena!,
    fechada: !!d.fechada,
    notas: (d.notas || []).map((n) => ({ ...n, lancada_em: n.lancada_em ?? null })),
    acertos: d.acertos || [],
    em_risco: d.em_risco || [],
    lancamentos: (d.lancamentos || []).map((l) => ({ ...l, situacao: l.situacao ?? null, pago_em: l.pago_em ?? null })),
    a_faturar: d.a_faturar || [],
  }));
}

const SITUACAO_CONTA = {
  recebida: { texto: "recebida", classe: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" },
  a_receber: { texto: "a receber", classe: "bg-muted text-foreground" },
  atrasada: { texto: "atrasada", classe: "bg-destructive/10 text-destructive" },
} as const;

export default function RepComissoes() {
  const cache = useMemo(() => {
    try {
      const t = localStorage.getItem(CACHE);
      // A leitura guardada pode ser de uma versão antiga da tela (sem `a_faturar`): normaliza também.
      return t ? normalizar(JSON.parse(t)) : [];
    } catch {
      return [];
    }
  }, []);
  const [dados, setDados] = useState<QuinzenaDoRep[]>(DEMO ? demo() : cache);
  const [carregando, setCarregando] = useState(!DEMO);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!carregando) return;
    setSegundos(0);
    const t = setInterval(() => setSegundos((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [carregando]);

  const carregar = useCallback(async () => {
    if (DEMO) return;
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", { body: { action: "minhas_comissoes" } });
    if (error || data?.error) {
      setErro(data?.error || error?.message || "Não foi possível ler suas comissões.");
    } else {
      const lista = normalizar(data.quinzenas || []);
      setDados(lista);
      try {
        localStorage.setItem(CACHE, JSON.stringify(lista));
      } catch {
        /* sem armazenamento, só não abre rápido da próxima vez */
      }
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const atual = dados.find((d) => !d.fechada) || dados[0];
  const naQuinzena = atual ? atual.notas.filter((n) => n.lancada_em === null) : [];
  const acumulado = naQuinzena.reduce((s, n) => s + n.comissao, 0);
  // fechadas e ainda não lançadas: também vão ser pagas
  const fechadasPendentes = dados
    .filter((d) => d.fechada)
    .flatMap((d) => d.notas.filter((n) => n.lancada_em === null).map((n) => ({ ...n, pagamento: d.quinzena.pagamento })));
  const lancamentos = dados.flatMap((d) => d.lancamentos).sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  const aReceber = lancamentos.filter((l) => l.situacao !== "recebida");
  const atrasado = aReceber.filter((l) => l.situacao === "atrasada").reduce((s, l) => s + l.liquido, 0);
  const totalAReceber = aReceber.reduce((s, l) => s + l.liquido, 0) + fechadasPendentes.reduce((s, n) => s + n.comissao, 0);
  const mes = hoje().slice(0, 7);
  const recebidoMes = lancamentos
    .filter((l) => l.situacao === "recebida" && (l.pago_em || "").slice(0, 7) === mes)
    .reduce((s, l) => s + l.liquido, 0);
  const descontos = dados.flatMap((d) => d.acertos.filter((a) => a.tipo === "descontar"));
  const devolucoes = dados.flatMap((d) => d.acertos.filter((a) => a.tipo === "devolver"));
  const riscos = dados.flatMap((d) => d.em_risco);
  const aFaturar = dados.flatMap((d) => d.a_faturar);
  const previsto = aFaturar.reduce((s, p) => s + p.comissao, 0);

  const passo = PASSOS[Math.min(Math.floor(segundos / 3), PASSOS.length - 1)];

  return (
    <div className="container mx-auto p-3 lg:p-6 space-y-4 lg:space-y-6 pb-28 lg:pb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <HandCoins className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0 mt-1" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold leading-tight">Comissões</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
              Nota do dia 1 ao 15 paga no dia 16; do 16 ao fim do mês, no dia 1º.
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={carregar} disabled={carregando} aria-label="Atualizar">
          <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {DEMO && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
          Demonstração: os números abaixo são falsos.
        </div>
      )}

      {carregando && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {passo}…
            </span>
            <span className="tabular-nums text-xs text-muted-foreground">{segundos}s</span>
          </div>
          {dados.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Abaixo, a última leitura.</p>}
        </div>
      )}

      {erro && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{erro}</div>}

      {atual && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Esta quinzena, até agora</div>
                <div className="text-2xl font-semibold tabular-nums">{reais(acumulado)}</div>
                <div className="text-xs text-muted-foreground">já faturado · recebe em {dataBR(atual.quinzena.pagamento)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Pedidos a faturar</div>
                <div className="text-2xl font-semibold tabular-nums text-muted-foreground">{reais(previsto)}</div>
                <div className="text-xs text-muted-foreground">previsto · conta quando a nota sair</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">A receber</div>
                <div className="text-2xl font-semibold tabular-nums">{reais(totalAReceber)}</div>
                <div className={`text-xs ${atrasado > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {atrasado > 0 ? `${reais(atrasado)} atrasado` : "nada atrasado"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Recebido no mês</div>
                <div className="text-2xl font-semibold tabular-nums">{reais(recebidoMes)}</div>
                <div className="text-xs text-muted-foreground">pago pela Mischa's</div>
              </CardContent>
            </Card>
          </div>

          {(riscos.length > 0 || descontos.length > 0) && (
            <Card className="border-amber-500/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Risco de desconto</div>
                    <p className="text-xs text-muted-foreground">
                      Boleto vencido há 2 dias sai da sua próxima comissão. Se o cliente pagar depois, volta.{" "}
                      <Link to="/rep/inadimplencia" className="underline">Ver cobrança</Link>
                    </p>
                  </div>
                </div>
                <ul className="divide-y rounded-md border text-sm">
                  {riscos.map((r) => (
                    <li key={r.nf_id} className="flex items-start justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.cliente}</div>
                        <div className="text-xs text-amber-700 dark:text-amber-400">
                          {rotuloNota(r)} · venceu {dataBR(r.vencimento)} · vira desconto em {r.dias_para_desconto}{" "}
                          {r.dias_para_desconto === 1 ? "dia" : "dias"}
                        </div>
                      </div>
                      <div className="shrink-0 tabular-nums font-medium">{reais(r.valor)}</div>
                    </li>
                  ))}
                  {descontos.map((a) => (
                    <li key={a.nf_id} className="flex items-start justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.cliente}</div>
                        <div className="text-xs text-destructive">
                          {rotuloNota(a)} · venceu {dataBR(a.vencimento)} · será descontado
                        </div>
                      </div>
                      <div className="shrink-0 tabular-nums font-medium text-destructive">− {reais(a.valor)}</div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-semibold">
                  Quinzena {diaMes(atual.quinzena.inicio)} a {diaMes(atual.quinzena.fim)}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {naQuinzena.reduce((s, n) => s + n.unidades, 0)} brownies
                </div>
              </div>
              {naQuinzena.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma venda faturada nesta quinzena ainda. Cada nota (ou entrega paga na hora) entra aqui com R$ 0,85
                  por brownie.
                </p>
              ) : (
                <ul className="divide-y rounded-md border text-sm">
                  {naQuinzena.map((n) => (
                    <li key={n.nf_id} className="flex items-start justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{n.cliente}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {rotuloNota(n)} · {diaMes(n.data_emissao)} · {n.unidades} brownies
                        </div>
                      </div>
                      <div className="shrink-0 tabular-nums font-medium">{reais(n.comissao)}</div>
                    </li>
                  ))}
                </ul>
              )}
              {devolucoes.length > 0 && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  + {reais(devolucoes.reduce((s, a) => s + a.valor, 0))} de desconto que volta: o cliente pagou.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-semibold">Pedidos a faturar</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {aFaturar.reduce((s, p) => s + p.unidades, 0)} brownies
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Pedidos que você já lançou e ainda não têm nota. É previsão: vira comissão quando a nota sai no despacho, na
                quinzena da data da nota.
              </p>
              {aFaturar.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pedido esperando nota.</p>
              ) : (
                <ul className="divide-y rounded-md border text-sm">
                  {aFaturar.map((p, i) => (
                    <li key={`${p.cliente}-${i}`} className="flex items-start justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.cliente}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {p.data_entrega ? `entrega ${diaMes(p.data_entrega)}` : "sem data"} · {p.unidades} brownies ·{" "}
                          {ETAPA[p.etapa]}
                          {p.sem_nota ? " · paga na entrega" : ""}
                        </div>
                        {p.quinzena && (
                          <div className="text-xs text-muted-foreground">recebe em {dataBR(p.quinzena.pagamento)}, se sair na data</div>
                        )}
                      </div>
                      <div className="shrink-0 tabular-nums font-medium text-muted-foreground">{reais(p.comissao)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="font-semibold">Minhas contas</div>
              {lancamentos.length === 0 && fechadasPendentes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Quando a Mischa's lançar sua comissão, a conta aparece aqui com o vencimento e se já foi paga.
                </p>
              ) : (
                <ul className="divide-y rounded-md border text-sm">
                  {fechadasPendentes.length > 0 && (
                    <li className="flex items-start justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium">Quinzena fechada, aguardando lançamento</div>
                        <div className="text-xs text-muted-foreground">
                          {fechadasPendentes.length} {fechadasPendentes.length === 1 ? "nota" : "notas"} · paga em{" "}
                          {dataBR(fechadasPendentes[0].pagamento)}
                        </div>
                      </div>
                      <div className="shrink-0 tabular-nums font-medium">
                        {reais(fechadasPendentes.reduce((s, n) => s + n.comissao, 0))}
                      </div>
                    </li>
                  )}
                  {lancamentos.map((l, i) => (
                    <li key={`${l.codigo}-${i}`} className="flex items-start justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium tabular-nums">Vence {dataBR(l.vencimento)}</span>
                          {l.situacao && (
                            <Badge variant="outline" className={`border-0 ${SITUACAO_CONTA[l.situacao].classe}`}>
                              {SITUACAO_CONTA[l.situacao].texto}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {l.notas} {l.notas === 1 ? "nota" : "notas"}
                          {l.pago_em ? ` · paga em ${dataBR(l.pago_em)}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 tabular-nums font-medium">{reais(l.liquido)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
