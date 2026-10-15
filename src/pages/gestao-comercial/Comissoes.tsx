import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { fecharQuinzena } from "@/utils/comissao";

/**
 * Comissão dos representantes por quinzena (Lucca, 15/10/2026).
 * Nota emitida de 1 a 15 paga no dia 16; de 16 ao fim do mês, no dia 1º seguinte. Cliente sem
 * nota conta pela data da entrega. Dá para lançar parte das notas, a qualquer momento: cada
 * lançamento vira uma conta a pagar em aberto no Gestão Click.
 * A conta mora no gestaoclick-proxy (comissoes.ts); a regra pura em supabase/functions/_shared/comissao.ts.
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

interface Lancamento {
  codigo: string | null;
  lancado_em: string;
  vencimento: string;
  liquido: number;
  notas: number;
  situacao?: "recebida" | "a_receber" | "atrasada" | null;
  pago_em?: string | null;
}

interface QuinzenaDoRep {
  representante_id: number;
  representante: string;
  razao_social: string | null;
  fornecedor_ok: boolean;
  quinzena: Quinzena;
  fechada: boolean;
  situacao: "em_andamento" | "pronta" | "parcial" | "lancada" | "vazia";
  notas: Nota[];
  unidades: number;
  acertos: Acerto[];
  saldo_pendente: number;
  bruto: number;
  lancado: number;
  lancamentos: Lancamento[];
}

const reais = (centavos: number) => formatCurrency(centavos / 100);
const dataBR = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const diaMes = (iso: string) => dataBR(iso).slice(0, 5);
const rotuloNota = (n: { numero: string; sem_nota?: boolean }) =>
  n.sem_nota || n.numero === "sem nota" ? "Entrega sem nota" : `NF ${n.numero}`;

const SITUACAO: Record<QuinzenaDoRep["situacao"], { texto: string; variant: "default" | "secondary" | "outline" }> = {
  em_andamento: { texto: "em andamento", variant: "outline" },
  pronta: { texto: "pronta para lançar", variant: "default" },
  parcial: { texto: "lançada em parte", variant: "default" },
  lancada: { texto: "lançada", variant: "secondary" },
  vazia: { texto: "sem venda", variant: "outline" },
};

interface Escolha {
  card: QuinzenaDoRep;
  notas: Nota[];
  acertos: Acerto[];
  liquido: number;
  saldoProximo: number;
  vencimento: string;
}

// A última leitura fica guardada no navegador: a tela abre com ela na hora e atualiza por trás,
// porque ler as notas no Gestão Click leva alguns segundos.
const CACHE = "mischaos-comissoes-v2";
const lerCache = (): { quando: number; dados: QuinzenaDoRep[] } | null => {
  try {
    const t = localStorage.getItem(CACHE);
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};

// ?demo=1 na URL: põe notas falsas a lançar no primeiro cartão do Luis, para ver a tela sem venda real.
// O "Confirmar" da demonstração não chama o servidor.
const DEMO = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";
const comDemo = (lista: QuinzenaDoRep[]): QuinzenaDoRep[] => {
  if (!DEMO) return lista;
  let feito = false;
  return lista.map((d) => {
    if (feito || d.representante_id !== 19) return d;
    feito = true;
    const falsas: Nota[] = [
      { nf_id: "demo:1", numero: "9101", cliente: "Mercado Nobel (DEMONSTRAÇÃO)", data_emissao: d.quinzena.inicio, unidades: 36, comissao: 3060, lancada_em: null },
      { nf_id: "demo:2", numero: "9102", cliente: "Empório Almazi (DEMONSTRAÇÃO)", data_emissao: d.quinzena.inicio, unidades: 72, comissao: 6120, lancada_em: null },
      { nf_id: "demo:3", numero: "sem nota", sem_nota: true, cliente: "Atacado Simionato (DEMONSTRAÇÃO)", data_emissao: d.quinzena.inicio, unidades: 54, comissao: 4590, lancada_em: null },
    ];
    const notas = [...d.notas, ...falsas];
    return {
      ...d,
      notas,
      unidades: notas.reduce((s, n) => s + n.unidades, 0),
      bruto: notas.reduce((s, n) => s + n.comissao, 0),
      situacao: d.lancamentos.length ? "parcial" : d.fechada ? "pronta" : "em_andamento",
    };
  });
};

const PASSOS = ["Lendo as notas fiscais no Gestão Click", "Juntando as entregas sem nota", "Conferindo os boletos", "Montando as quinzenas"];

export default function Comissoes() {
  const cache = useMemo(lerCache, []);
  const [dados, setDados] = useState<QuinzenaDoRep[]>(comDemo(cache?.dados || []));
  const [lidoEm, setLidoEm] = useState<number | null>(cache?.quando ?? null);
  const [carregando, setCarregando] = useState(true);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  /** O que o Lucca desmarcou (por padrão tudo o que falta lançar vem marcado). */
  const [desmarcados, setDesmarcados] = useState<Set<string>>(new Set());
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const [lancando, setLancando] = useState(false);

  useEffect(() => {
    if (!carregando) return;
    setSegundos(0);
    const t = setInterval(() => setSegundos((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [carregando]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
      body: { action: "comissao_quinzenas", quantas: 4 },
    });
    if (error || data?.error) setErro(data?.error || error?.message || "Não foi possível ler as comissões.");
    else {
      // Garante o formato: um servidor desatualizado não pode derrubar a página.
      const lista = (data.quinzenas || []).map((d: Partial<QuinzenaDoRep>) => ({
          ...d,
          notas: (d.notas || []).map((n) => ({ ...n, lancada_em: n.lancada_em ?? null })),
          acertos: d.acertos || [],
          lancamentos: d.lancamentos || [],
          saldo_pendente: d.saldo_pendente || 0,
          bruto: d.bruto ?? (d.notas || []).reduce((s, n) => s + (n.comissao || 0), 0),
        })) as QuinzenaDoRep[];
      setDados(comDemo(lista));
      const agora = Date.now();
      setLidoEm(agora);
      try {
        localStorage.setItem(CACHE, JSON.stringify({ quando: agora, dados: lista }));
      } catch {
        /* sem armazenamento, só não abre rápido da próxima vez */
      }
    }
    setDesmarcados(new Set());
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const porQuinzena = useMemo(() => {
    const mapa = new Map<string, QuinzenaDoRep[]>();
    dados.forEach((d) => mapa.set(d.quinzena.inicio, [...(mapa.get(d.quinzena.inicio) || []), d]));
    return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [dados]);

  const chave = (d: QuinzenaDoRep) => `${d.representante_id}-${d.quinzena.inicio}`;
  const alternar = (set: React.Dispatch<React.SetStateAction<Set<string>>>, k: string) =>
    set((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const montarEscolha = (d: QuinzenaDoRep): Escolha => {
    const notas = d.notas.filter((n) => n.lancada_em === null && !desmarcados.has(n.nf_id));
    const acertos = d.acertos.filter((a) => !desmarcados.has(`acerto:${a.nf_id}`));
    const f = fecharQuinzena({
      bruto: notas.reduce((s, n) => s + n.comissao, 0),
      descontos: acertos.filter((a) => a.tipo === "descontar").reduce((s, a) => s + a.valor, 0),
      creditos: acertos.filter((a) => a.tipo === "devolver").reduce((s, a) => s + a.valor, 0),
      saldoAnterior: d.saldo_pendente,
    });
    return { card: d, notas, acertos, liquido: f.liquido, saldoProximo: f.saldoProximo, vencimento: d.quinzena.pagamento };
  };

  const lancar = async () => {
    if (!escolha) return;
    if (escolha.notas.some((n) => n.nf_id.startsWith("demo:"))) {
      toast.info("Demonstração: nada foi lançado no Gestão Click nem gravado.");
      setEscolha(null);
      return;
    }
    setLancando(true);
    const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
      body: {
        action: "lancar_comissao",
        representante_id: escolha.card.representante_id,
        inicio: escolha.card.quinzena.inicio,
        notas: escolha.notas.map((n) => n.nf_id),
        acertos: escolha.acertos.map((a) => a.nf_id),
        vencimento: escolha.vencimento,
      },
    });
    setLancando(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Não foi possível lançar.");
    } else {
      toast.success(
        data.codigo
          ? `Conta a pagar ${data.codigo} lançada no Gestão Click (${reais(data.liquido)}).`
          : "Lançamento gravado sem conta a pagar (líquido zero).",
      );
      setEscolha(null);
      carregar();
    }
  };

  const passo = PASSOS[Math.min(Math.floor(segundos / 3), PASSOS.length - 1)];
  const progresso = Math.min(92, Math.round(100 * (1 - Math.exp(-segundos / 8))));
  const avisoCarregando = carregando && (
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {passo}…
        </span>
        <span className="tabular-nums text-xs text-muted-foreground">{segundos}s</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded bg-muted">
        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progresso}%` }} />
      </div>
      {dados.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Abaixo, a última leitura{lidoEm ? ` (${new Date(lidoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })})` : ""}. Não lance antes de terminar.</p>
      )}
    </div>
  );

  if (carregando && !dados.length) {
    return (
      <div className="space-y-4">
        {avisoCarregando}
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg border bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-3xl">
          Nota emitida do dia 1 ao 15 paga no dia 16; do 16 ao fim do mês, no dia 1º seguinte. Cliente sem nota conta
          pela data da entrega; bonificação e troca não entram. Você escolhe o que lançar e quando: cada lançamento vira
          uma conta a pagar em aberto no Gestão Click. Boleto vencido há 2 dias ou mais e não pago é descontado no
          próximo lançamento e volta quando o cliente pagar.
        </p>
        <Button variant="outline" size="sm" onClick={carregar} disabled={carregando}>
          <RefreshCw className={`h-4 w-4 mr-2 ${carregando ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {avisoCarregando}

      {erro && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{erro}</div>}
      {!erro && !porQuinzena.length && <p className="text-sm text-muted-foreground">Nenhum representante com comissão.</p>}

      {porQuinzena.map(([inicio, reps]) => {
        const q = reps[0].quinzena;
        return (
          <section key={inicio} className="space-y-3">
            <h3 className="text-sm font-semibold">
              {diaMes(q.inicio)} a {dataBR(q.fim)}{" "}
              <span className="font-normal text-muted-foreground">· paga em {dataBR(q.pagamento)}</span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {reps.map((d) => {
                const k = chave(d);
                const aberto = abertos.has(k);
                const pendentes = d.notas.filter((n) => n.lancada_em === null);
                const temAlgoALancar = pendentes.length > 0 || d.acertos.length > 0;
                const e = montarEscolha(d);
                const falta = pendentes.reduce((s, n) => s + n.comissao, 0);
                return (
                  <Card key={k} className="min-w-0 overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base">{d.representante}</CardTitle>
                          <p className="truncate text-xs text-muted-foreground">{d.razao_social || "sem razão social"}</p>
                        </div>
                        <Badge variant={SITUACAO[d.situacao].variant} className="shrink-0">
                          {SITUACAO[d.situacao].texto}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-sm tabular-nums">
                        <div>
                          <div className="text-xs text-muted-foreground">Notas</div>
                          <div className="font-semibold">{d.notas.length}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Brownies</div>
                          <div className="font-semibold">{d.unidades}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Comissão</div>
                          <div className="font-semibold">{reais(d.bruto)}</div>
                        </div>
                      </div>

                      {(d.lancamentos.length > 0 || falta > 0) && (
                        <div className="text-xs tabular-nums space-y-0.5">
                          {d.lancamentos.map((l, i) => (
                            <div key={i} className="text-muted-foreground">
                              {l.codigo ? `Conta ${l.codigo}` : "Lançamento sem conta"} · {reais(l.liquido)} · {l.notas}{" "}
                              {l.notas === 1 ? "nota" : "notas"} ·{" "}
                              {l.situacao === "recebida" ? (
                                <span className="text-emerald-600">paga{l.pago_em ? ` em ${dataBR(l.pago_em)}` : ""}</span>
                              ) : l.situacao === "atrasada" ? (
                                <span className="text-destructive">atrasada, venceu {dataBR(l.vencimento)}</span>
                              ) : (
                                `vence ${dataBR(l.vencimento)}`
                              )}
                            </div>
                          ))}
                          {falta > 0 && <div className="font-medium">Falta lançar {reais(falta)}</div>}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {(d.notas.length > 0 || d.acertos.length > 0) && (
                          <Button variant="ghost" size="sm" className="px-2" onClick={() => alternar(setAbertos, k)}>
                            {aberto ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                            {temAlgoALancar ? "Escolher notas" : "Ver notas"}
                          </Button>
                        )}
                        {temAlgoALancar && (
                          <Button
                            size="sm"
                            onClick={() => setEscolha(e)}
                            disabled={carregando || (!e.notas.length && !e.acertos.length) || (!d.fornecedor_ok && e.liquido > 0)}
                          >
                            Lançar {e.notas.length} {e.notas.length === 1 ? "nota" : "notas"} · {reais(e.liquido)}
                          </Button>
                        )}
                        {temAlgoALancar && !d.fornecedor_ok && (
                          <span className="text-xs text-destructive">falta o fornecedor no Gestão Click</span>
                        )}
                      </div>

                      {aberto && (
                        <div className="space-y-3">
                          {d.notas.length > 0 && (
                            <ul className="divide-y rounded-md border text-sm">
                              {d.notas.map((n) => {
                                const pendente = n.lancada_em === null;
                                return (
                                  <li key={n.nf_id} className="flex items-start gap-3 px-3 py-2">
                                    {pendente ? (
                                      <Checkbox
                                        className="mt-0.5"
                                        checked={!desmarcados.has(n.nf_id)}
                                        onCheckedChange={() => alternar(setDesmarcados, n.nf_id)}
                                        aria-label={`Lançar ${rotuloNota(n)} de ${n.cliente}`}
                                      />
                                    ) : (
                                      <span className="mt-0.5 h-4 w-4 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate font-medium">{n.cliente}</div>
                                      <div className="text-xs text-muted-foreground tabular-nums">
                                        {rotuloNota(n)} · {diaMes(n.data_emissao)} · {n.unidades} brownies
                                        {!pendente && (n.lancada_em ? ` · na conta ${n.lancada_em}` : " · lançada")}
                                      </div>
                                    </div>
                                    <div className={`shrink-0 tabular-nums font-medium ${pendente ? "" : "text-muted-foreground"}`}>
                                      {reais(n.comissao)}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {d.acertos.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium">Acertos de lançamentos anteriores</div>
                              <ul className="divide-y rounded-md border text-xs">
                                {d.acertos.map((a) => (
                                  <li key={a.nf_id} className="flex items-start gap-3 px-3 py-2 tabular-nums">
                                    <Checkbox
                                      checked={!desmarcados.has(`acerto:${a.nf_id}`)}
                                      onCheckedChange={() => alternar(setDesmarcados, `acerto:${a.nf_id}`)}
                                    />
                                    <span className="min-w-0 flex-1">
                                      {rotuloNota(a)} · {a.cliente} ·{" "}
                                      {a.tipo === "descontar" ? `boleto venceu em ${dataBR(a.vencimento)}` : "pago depois"}
                                    </span>
                                    <span className={a.tipo === "descontar" ? "text-destructive" : "text-emerald-600"}>
                                      {a.tipo === "descontar" ? "−" : "+"} {reais(a.valor)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {d.saldo_pendente > 0 && (
                            <p className="text-xs text-destructive">
                              − {reais(d.saldo_pendente)} de desconto que sobrou de um lançamento anterior entra no próximo.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      <AlertDialog open={!!escolha} onOpenChange={(o) => !o && !lancando && setEscolha(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lançar a comissão no Gestão Click?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {escolha ? (
                <div className="space-y-2 text-sm tabular-nums">
                  <div>Fornecedor: {escolha.card.razao_social}</div>
                  <div>
                    {escolha.notas.length} {escolha.notas.length === 1 ? "nota" : "notas"},{" "}
                    {escolha.notas.reduce((s, n) => s + n.unidades, 0)} brownies
                    {escolha.acertos.length > 0 && `, ${escolha.acertos.length} acerto(s)`}
                  </div>
                  <div className="text-base font-semibold text-foreground">Valor: {reais(escolha.liquido)}</div>
                  {escolha.saldoProximo > 0 && (
                    <div className="text-destructive">{reais(escolha.saldoProximo)} de desconto passa para o próximo lançamento.</div>
                  )}
                  <label className="flex items-center gap-2">
                    Vencimento:
                    <Input
                      type="date"
                      className="h-8 w-auto"
                      value={escolha.vencimento}
                      onChange={(ev) => setEscolha({ ...escolha, vencimento: ev.target.value })}
                    />
                  </label>
                  <div className="pt-1">
                    Entra como conta a pagar <b>em aberto</b>, em Comissão de vendedores, por Pix. As notas lançadas não
                    voltam a aparecer para lançar.
                  </div>
                </div>
              ) : (
                <div />
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={lancando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(ev) => {
                ev.preventDefault();
                lancar();
              }}
              disabled={lancando || !escolha?.vencimento}
            >
              {lancando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar e lançar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
