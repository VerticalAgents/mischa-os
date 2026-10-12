import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, Check, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";
import { useConfirmacaoProducao } from "@/hooks/useConfirmacaoProducao";
import type { HistoricoProducaoSupabase } from "@/hooks/useSupabaseHistoricoProducao";
import { dataLocal } from "@/utils/periodoProducao";
import {
  compararProducao,
  desdePadrao,
  novoLote,
  observacaoDoLote,
  type ProducaoFaltando,
  type SessaoUnno,
} from "@/utils/sincroniaProducao";

interface PuxarUnnoEstoqueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGravado: () => void;
  historico: HistoricoProducaoSupabase[];
}

const dia = (iso: string) => format(dataLocal(iso), "dd/MM");
const chaveDe = (c: ProducaoFaltando) => `${c.data}|${c.produto_id}`;

// So a pilha "falta lancar" grava. Formas diferentes, sobrando e ficha sem produto
// sao mostradas: mexer em producao ja confirmada altera estoque ja usado, e isso
// continua sendo feito pela /sincronizar-producao, no terminal.
export function PuxarUnnoEstoqueDialog({ isOpen, onClose, onGravado, historico }: PuxarUnnoEstoqueDialogProps) {
  const { produtos } = useSupabaseProdutos();
  const { rendimentos } = useRendimentosReceitaProduto();
  const { lancarLote, loading: gravando } = useConfirmacaoProducao();

  const [sessoes, setSessoes] = useState<SessaoUnno[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [desmarcados, setDesmarcados] = useState<Set<string>>(new Set());

  const buscar = async () => {
    const hoje = new Date();
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase.functions.invoke("unno-producao", {
        body: { desde: desdePadrao(hoje), ate: format(hoje, "yyyy-MM-dd") },
      });
      if (error || !data?.sessoes) throw error || new Error(data?.error);
      setSessoes(data.sessoes);
      setDesmarcados(new Set());
    } catch (e) {
      console.error("unno-producao", e);
      setSessoes(null);
      setErro("Não consegui ler o unno-estoque. Tente de novo em instantes.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (isOpen) buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const plano = useMemo(() => {
    if (!sessoes) return null;
    const rendimentoDe = new Map(rendimentos.map(r => [r.produto_id, Number(r.rendimento)]));
    return compararProducao(
      sessoes,
      produtos.map(p => ({ id: p.id, nome: p.nome, rendimento: rendimentoDe.get(p.id) ?? null })),
      historico.map(r => ({
        id: r.id,
        data: r.data_producao,
        produto_id: r.produto_id ?? null,
        produto_nome: r.produto_nome,
        formas: r.formas_producidas || 0,
      })),
      new Date()
    );
  }, [sessoes, produtos, rendimentos, historico]);

  const marcados = plano ? plano.criar.filter(c => !desmarcados.has(chaveDe(c)) && c.rendimento > 0) : [];
  const totalFormas = marcados.reduce((s, c) => s + c.formas, 0);
  const totalUnidades = marcados.reduce((s, c) => s + c.unidades, 0);
  const outrasPilhas = plano
    ? plano.corrigir.length + plano.perguntar.length + plano.sobrando.length + plano.semProduto.length
    : 0;
  const emDia = plano && plano.criar.length === 0 && outrasPilhas === 0;

  const alternar = (chave: string) =>
    setDesmarcados(atual => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });

  const lancar = async () => {
    const lote = novoLote(new Date());
    const resultado = await lancarLote(
      marcados.map(c => ({
        data: c.data,
        produto_id: c.produto_id,
        formas: c.formas,
        observacoes: observacaoDoLote(c.sessoes, lote),
      })),
      true
    );
    if (resultado.ok) {
      onGravado();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={aberto => !aberto && onClose()}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Puxar produção do unno-estoque</DialogTitle>
          <DialogDescription>
            Compara o que a fábrica registrou lá com o que está lançado aqui. Nada é gravado até você
            clicar em lançar.
          </DialogDescription>
        </DialogHeader>

        {carregando && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Lendo o unno-estoque...
          </div>
        )}

        {erro && !carregando && (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-sm">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <p>{erro}</p>
            <Button variant="outline" onClick={buscar}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar de novo
            </Button>
          </div>
        )}

        {emDia && !carregando && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <p className="font-medium">Está em dia</p>
            <p className="text-sm text-muted-foreground">
              Toda a produção do unno-estoque desde {dia(desdePadrao(new Date()))} já está lançada aqui.
            </p>
          </div>
        )}

        {plano && !emDia && !carregando && (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Falta lançar ({plano.criar.length})</h3>
              {plano.criar.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nada para lançar.</p>
              ) : (
                <div className="rounded-md border">
                  {plano.criar.map(c => {
                    const chave = chaveDe(c);
                    const semRendimento = c.rendimento <= 0;
                    return (
                      <label
                        key={chave}
                        className="grid cursor-pointer grid-cols-[auto_3rem_1fr_auto] items-center gap-x-3 border-b px-3 py-2 text-sm last:border-b-0"
                      >
                        <Checkbox
                          checked={!semRendimento && !desmarcados.has(chave)}
                          disabled={semRendimento || gravando}
                          onCheckedChange={() => alternar(chave)}
                        />
                        <span className="tabular-nums text-muted-foreground">{dia(c.data)}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{c.produto}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {semRendimento ? (
                              <span className="text-amber-600">
                                sem rendimento: defina em Precificação › Rendimentos
                              </span>
                            ) : (
                              c.sessoes.join(", ")
                            )}
                          </span>
                        </span>
                        <span className="text-right tabular-nums">
                          <span className="block font-semibold">{c.formas} formas</span>
                          <span className="block text-xs text-muted-foreground">
                            {c.unidades.toLocaleString("pt-BR")} un
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {outrasPilhas > 0 && (
              <section className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Só para você saber: o botão não mexe nestes
                </p>

                {plano.corrigir.length + plano.perguntar.length > 0 && (
                  <div>
                    <p className="font-medium">Formas diferentes</p>
                    <ul className="tabular-nums text-muted-foreground">
                      {plano.corrigir.map(c => (
                        <li key={c.id}>
                          {dia(c.data)} · {c.produto}: aqui {c.de}, lá {c.formas}
                        </li>
                      ))}
                      {plano.perguntar.map(c => (
                        <li key={chaveDe(c)}>
                          {dia(c.data)} · {c.produto}: aqui {c.noMischaOS.join(" + ")}, lá {c.formas}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plano.sobrando.length > 0 && (
                  <div>
                    <p className="font-medium">Lançado aqui, sem produção lá</p>
                    <ul className="tabular-nums text-muted-foreground">
                      {plano.sobrando.map(c => (
                        <li key={c.id}>
                          {dia(c.data)} · {c.produto}: {c.formas} formas
                          {c.futuro ? " (data futura)" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plano.semProduto.length > 0 && (
                  <div>
                    <p className="font-medium">Ficha de lá sem produto de mesmo nome aqui</p>
                    <ul className="tabular-nums text-muted-foreground">
                      {plano.semProduto.map(c => (
                        <li key={c.ficha}>
                          {c.ficha}: {c.formas} formas em {c.dias.length}{" "}
                          {c.dias.length === 1 ? "dia" : "dias"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Corrigir o que já foi confirmado mexe em estoque já usado. Isso se resolve pela
                  /sincronizar-producao.
                </p>
              </section>
            )}
          </div>
        )}

        {plano && plano.criar.length > 0 && !carregando && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground tabular-nums">
              {marcados.length === 0 ? (
                "Nada marcado"
              ) : (
                <>
                  <span className="font-semibold text-foreground">{totalFormas}</span> formas ·{" "}
                  <span className="font-semibold text-foreground">
                    {totalUnidades.toLocaleString("pt-BR")}
                  </span>{" "}
                  unidades
                </>
              )}
            </p>
            <Button onClick={lancar} disabled={gravando || marcados.length === 0}>
              {gravando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Lançar e confirmar ({marcados.length})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
