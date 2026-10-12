import { useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CalendarIcon, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";
import { useConfirmacaoProducao } from "@/hooks/useConfirmacaoProducao";
import type { HistoricoProducaoSupabase } from "@/hooks/useSupabaseHistoricoProducao";
import { lerFormas, montarItens, totaisDoDia, unidadesDe, type LinhaDia } from "@/utils/producaoDia";
import { cn } from "@/lib/utils";

interface LancarDiaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGravado: () => void;
  historico: HistoricoProducaoSupabase[];
}

export function LancarDiaDialog({ isOpen, onClose, onGravado, historico }: LancarDiaDialogProps) {
  const { produtos } = useSupabaseProdutos();
  const { rendimentos } = useRendimentosReceitaProduto();
  const { lancarLote, loading } = useConfirmacaoProducao();

  const [data, setData] = useState<Date>(new Date());
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  // Formas digitadas, por produto.
  const [formas, setFormas] = useState<Record<string, string>>({});
  const campos = useRef<(HTMLInputElement | null)[]>([]);

  const dia = format(data, "yyyy-MM-dd");
  const hoje = new Date();

  const rendimentoDe = useMemo(() => {
    const mapa = new Map<string, number>();
    rendimentos.forEach(r => {
      if (r.rendimento > 0) mapa.set(r.produto_id, Number(r.rendimento));
    });
    return mapa;
  }, [rendimentos]);

  const ativos = useMemo(() => produtos.filter(p => p.ativo), [produtos]);

  // O que ja existe naquele dia: o agendado (ainda pendente) preenche o campo,
  // o confirmado vira aviso para nao lancar duas vezes.
  const doDia = useMemo(() => {
    const agendado = new Map<string, number>();
    const confirmado = new Map<string, number>();
    historico.forEach(r => {
      if (r.data_producao !== dia || !r.produto_id) return;
      const mapa = (r.status || "Registrado") === "Confirmado" ? confirmado : agendado;
      mapa.set(r.produto_id, (mapa.get(r.produto_id) || 0) + (r.formas_producidas || 0));
    });
    return { agendado, confirmado };
  }, [historico, dia]);

  // Ao abrir e ao trocar o dia, os campos voltam para o que esta agendado naquela data.
  useEffect(() => {
    if (!isOpen) return;
    const inicial: Record<string, string> = {};
    doDia.agendado.forEach((qtd, produtoId) => {
      inicial[produtoId] = String(qtd);
    });
    setFormas(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dia]);

  useEffect(() => {
    if (isOpen) setData(new Date());
  }, [isOpen]);

  const linhas: LinhaDia[] = ativos.map(p => ({
    produtoId: p.id,
    formas: formas[p.id] || "",
    rendimento: rendimentoDe.get(p.id) ?? null,
  }));

  const totais = totaisDoDia(linhas);
  const repetidos = ativos.filter(
    p => lerFormas(formas[p.id] || "") > 0 && doDia.confirmado.has(p.id)
  );

  const gravar = async (confirmar: boolean) => {
    const resultado = await lancarLote(montarItens(data, linhas), confirmar);
    if (resultado.ok) {
      onGravado();
      onClose();
    }
  };

  const irParaProximo = (indice: number) => {
    for (let i = indice + 1; i < campos.current.length; i++) {
      const campo = campos.current[i];
      if (campo && !campo.disabled) {
        campo.focus();
        campo.select();
        return;
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={aberto => !aberto && onClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Lançar produção do dia</DialogTitle>
          <DialogDescription>
            Preencha só o que foi produzido. Enter passa para o próximo produto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Popover open={calendarioAberto} onOpenChange={setCalendarioAberto}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 justify-start gap-2 font-normal capitalize">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {format(data, "EEEE, dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="z-[100] w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={data}
                locale={ptBR}
                onSelect={d => {
                  if (d) {
                    setData(d);
                    setCalendarioAberto(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant={isSameDay(data, hoje) ? "secondary" : "ghost"}
            className="h-10"
            onClick={() => setData(new Date())}
          >
            Hoje
          </Button>
          <Button
            variant={isSameDay(data, subDays(hoje, 1)) ? "secondary" : "ghost"}
            className="h-10"
            onClick={() => setData(subDays(new Date(), 1))}
          >
            Ontem
          </Button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-md border">
          <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-x-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>Produto</span>
            <span className="text-center">Formas</span>
            <span className="text-right">Unidades</span>
          </div>
          {ativos.map((produto, indice) => {
            const rendimento = rendimentoDe.get(produto.id) ?? null;
            const qtd = lerFormas(formas[produto.id] || "");
            const agendado = doDia.agendado.get(produto.id);
            const confirmado = doDia.confirmado.get(produto.id);
            return (
              <div
                key={produto.id}
                className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-x-3 border-b px-3 py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{produto.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {rendimento === null ? (
                      <span className="text-amber-600">
                        sem rendimento: defina em Precificação › Rendimentos
                      </span>
                    ) : (
                      <>
                        {rendimento.toLocaleString("pt-BR")}/forma
                        {agendado ? ` · agendado: ${agendado} formas` : ""}
                        {confirmado ? (
                          <span className="text-amber-600"> · já lançado: {confirmado} formas</span>
                        ) : null}
                      </>
                    )}
                  </p>
                </div>
                <Input
                  ref={el => (campos.current[indice] = el)}
                  inputMode="numeric"
                  value={formas[produto.id] || ""}
                  disabled={rendimento === null || loading}
                  onChange={e =>
                    setFormas(atual => ({
                      ...atual,
                      [produto.id]: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      irParaProximo(indice);
                    }
                  }}
                  onFocus={e => e.target.select()}
                  className="h-9 text-center tabular-nums"
                  aria-label={`Formas de ${produto.nome}`}
                />
                <span
                  className={cn(
                    "text-right text-sm tabular-nums",
                    qtd > 0 ? "font-semibold" : "text-muted-foreground"
                  )}
                >
                  {qtd > 0 && rendimento !== null
                    ? unidadesDe(qtd, rendimento).toLocaleString("pt-BR")
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {repetidos.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              {repetidos.map(p => p.nome).join(", ")} já {repetidos.length === 1 ? "tem" : "têm"}{" "}
              produção confirmada neste dia. Se gravar, entra <strong>somando</strong> ao que já está
              lançado.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground tabular-nums">
            {totais.produtos === 0 ? (
              "Nada preenchido ainda"
            ) : (
              <>
                <span className="font-semibold text-foreground">{totais.formas}</span> formas ·{" "}
                <span className="font-semibold text-foreground">
                  {totais.unidades.toLocaleString("pt-BR")}
                </span>{" "}
                unidades · {totais.produtos} {totais.produtos === 1 ? "produto" : "produtos"}
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => gravar(false)}
              disabled={loading || totais.produtos === 0}
              title="Fica pendente, para o que ainda vai ser produzido"
            >
              Só registrar
            </Button>
            <Button onClick={() => gravar(true)} disabled={loading || totais.produtos === 0}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Registrar e confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
