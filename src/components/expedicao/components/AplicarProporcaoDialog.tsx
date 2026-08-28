import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Settings2, Loader2, Package, RotateCcw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BARRA_ABAS, ABA } from "@/components/common/abas";
import { cn } from "@/lib/utils";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { useEstoqueDisponivel } from "@/hooks/useEstoqueDisponivel";
import { useClientesComCategoria } from "@/hooks/useClientesRevendaPadrao";
import {
  CATEGORIA_REVENDA_PADRAO,
  proporcaoDoEstoque,
  itensDaProporcao,
  somarPercentuais,
  somaFecha,
  type FatiaProporcao,
  type ItemPersonalizado,
} from "@/utils/proporcaoAdHoc";

interface PedidoExpedicao {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  quantidade_total: number;
  data_prevista_entrega: Date;
  tipo_pedido: string;
}

type Modo = "padrao" | "manual" | "estoque";

interface AplicarProporcaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: PedidoExpedicao[];
  /** Modo "padrão": converte para Padrão e deixa a proporção global mandar. */
  onConfirmPadrao: (pedidoIds: string[]) => Promise<void>;
  /** Modos "na hora" e "estoque": grava itens próprios em cada pedido. */
  onConfirmProporcao: (
    itensPorPedido: Record<string, ItemPersonalizado[]>
  ) => Promise<void>;
}

const ROTULO = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

export const AplicarProporcaoDialog = ({
  open,
  onOpenChange,
  pedidosDisponiveis,
  onConfirmPadrao,
  onConfirmProporcao,
}: AplicarProporcaoDialogProps) => {
  const [modo, setModo] = useState<Modo>("padrao");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  /** Percentuais digitados, por produto_id. String para permitir campo vazio. */
  const [percentuais, setPercentuais] = useState<Record<string, string>>({});

  const { produtos } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const { proporcoes } = useSupabaseProporoesPadrao();
  const { produtos: produtosEstoque, loading: loadingEstoque } = useEstoqueDisponivel({});

  const ehAdHoc = modo === "manual" || modo === "estoque";

  /**
   * Os produtos que podem entrar na proporção.
   *
   * Só os da categoria "Revenda Padrão": é a categoria que define quem recebe
   * pedido proporcional. Assim a proporção nunca contém um produto que o
   * cliente elegível não pode receber — o conflito deixa de existir.
   */
  const idRevendaPadrao = useMemo(
    () => categorias.find((c) => c.nome === CATEGORIA_REVENDA_PADRAO)?.id ?? null,
    [categorias]
  );

  const produtosRevenda = useMemo(() => {
    if (idRevendaPadrao == null) return [];
    return produtos
      .filter((p) => p.ativo && p.categoria_id === idRevendaPadrao)
      .map((p) => ({ id: String(p.id), nome: p.nome }));
  }, [produtos, idRevendaPadrao]);

  /** Quem tem Revenda Padrão acionada, entre os clientes que estão na tela. */
  const clienteIds = useMemo(
    () => Array.from(new Set(pedidosDisponiveis.map((p) => String(p.cliente_id)).filter(Boolean))),
    [pedidosDisponiveis]
  );
  const { porCliente: revendaPorCliente, loading: carregandoClientes } =
    useClientesComCategoria(clienteIds, idRevendaPadrao);

  /** Elegibilidade muda com o modo — são operações diferentes. */
  const pedidosElegiveis = useMemo(() => {
    if (modo === "padrao") {
      // Converter para Padrão só faz sentido em quem está Alterado.
      return pedidosDisponiveis.filter((p) => p.tipo_pedido === "Alterado");
    }
    // Proporção de uso único: qualquer tipo, desde que o cliente seja Revenda Padrão.
    return pedidosDisponiveis.filter((p) => revendaPorCliente[String(p.cliente_id)]);
  }, [modo, pedidosDisponiveis, revendaPorCliente]);

  const foraPorCategoria = useMemo(() => {
    if (!ehAdHoc) return [];
    return pedidosDisponiveis.filter((p) => !revendaPorCliente[String(p.cliente_id)]);
  }, [ehAdHoc, pedidosDisponiveis, revendaPorCliente]);

  /** Seleciona tudo o que é elegível ao abrir e a cada troca de modo. */
  useEffect(() => {
    setSelecionados(new Set(pedidosElegiveis.map((p) => String(p.id))));
  }, [pedidosElegiveis]);

  const percentuaisDoEstoque = (): Record<string, string> => {
    const idsRevenda = new Set(produtosRevenda.map((p) => p.id));
    const fatiasEstoque = proporcaoDoEstoque(
      produtosEstoque
        .filter((p) => idsRevenda.has(String(p.produto_id)))
        .map((p) => ({
          produto_id: String(p.produto_id),
          produto_nome: p.produto_nome,
          // Estoque disponível, não saldo bruto: já desconta o que está
          // reservado para pedidos separados. É o mesmo número do PCP.
          disponivel: p.estoque_disponivel,
        }))
    );

    const base: Record<string, string> = {};
    produtosRevenda.forEach((prod) => {
      base[prod.id] = String(fatiasEstoque.find((f) => f.produto_id === prod.id)?.percentual ?? 0);
    });
    return base;
  };

  /**
   * "Na hora" começa da proporção padrão vigente: quase sempre o ajuste é em
   * cima dela, não do zero. "Do estoque" começa da composição do estoque.
   */
  useEffect(() => {
    if (!open) return;

    if (modo === "manual") {
      const base: Record<string, string> = {};
      produtosRevenda.forEach((prod) => {
        const daPadrao = proporcoes.find((p) => String(p.produto_id) === prod.id);
        base[prod.id] = String(daPadrao?.ativo ? daPadrao.percentual : 0);
      });
      setPercentuais(base);
    }

    if (modo === "estoque") {
      setPercentuais(percentuaisDoEstoque());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, open, produtosRevenda.length, proporcoes.length, loadingEstoque]);

  const fatias: FatiaProporcao[] = useMemo(
    () =>
      produtosRevenda
        .map((prod) => ({
          produto_id: prod.id,
          produto_nome: prod.nome,
          percentual: parseFloat(percentuais[prod.id] || "0") || 0,
        }))
        .filter((f) => f.percentual > 0),
    [produtosRevenda, percentuais]
  );

  const total = somarPercentuais(fatias);
  const totalValido = somaFecha(fatias);

  /** A proporção padrão vigente, só para leitura na aba Padrão. */
  const padraoVigente = useMemo(
    () =>
      proporcoes
        .filter((p) => p.ativo && Number(p.percentual) > 0)
        .map((p) => ({
          id: String(p.produto_id),
          nome: p.produto_nome,
          percentual: Number(p.percentual),
        })),
    [proporcoes]
  );

  const handlePercentual = (produtoId: string, valor: string) => {
    if (valor !== "" && !/^\d*\.?\d*$/.test(valor)) return;
    const num = parseFloat(valor);
    if (valor !== "" && (num < 0 || num > 100)) return;
    setPercentuais((prev) => ({ ...prev, [produtoId]: valor }));
  };

  const toggleItem = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selecionados.size === pedidosElegiveis.length) setSelecionados(new Set());
    else setSelecionados(new Set(pedidosElegiveis.map((p) => String(p.id))));
  };

  const handleConfirm = async () => {
    if (selecionados.size === 0) return;
    setLoading(true);
    try {
      const ids = Array.from(selecionados);

      if (modo === "padrao") {
        await onConfirmPadrao(ids);
      } else {
        // Cada pedido tem a sua quantidade total, então cada um tem os seus
        // itens — a proporção é a mesma, o resultado não.
        const itensPorPedido: Record<string, ItemPersonalizado[]> = {};
        ids.forEach((id) => {
          const pedido = pedidosElegiveis.find((p) => String(p.id) === id);
          if (!pedido) return;
          const itens = itensDaProporcao(pedido.quantidade_total, fatias);
          if (itens.length > 0) itensPorPedido[id] = itens;
        });
        await onConfirmProporcao(itensPorPedido);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const todosSelecionados =
    pedidosElegiveis.length > 0 && selecionados.size === pedidosElegiveis.length;
  const algumSelecionado =
    selecionados.size > 0 && selecionados.size < pedidosElegiveis.length;

  const podeAplicar =
    selecionados.size > 0 && !loading && (modo === "padrao" || totalValido);

  const descricao = {
    padrao:
      "Os pedidos selecionados passam a ser Padrão e usam a proporção padrão vigente no lugar das quantidades personalizadas.",
    manual:
      "Defina a proporção abaixo. Ela vale só para esta aplicação — os pedidos ficam como Alterado, com as quantidades gravadas.",
    estoque:
      "A proporção vem da composição do estoque disponível: o produto com mais saldo recebe a maior fatia. Dá para ajustar antes de aplicar.",
  }[modo];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Duas colunas: à esquerda a configuração, à direita quem recebe. As
          duas dividiam a mesma coluna estreita, e a lista de clientes — que é
          onde se passa mais tempo — ficava espremida no pé do diálogo. */}
      <DialogContent className="flex max-h-[88vh] max-w-4xl flex-col gap-4">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Aplicar Proporção
          </DialogTitle>
        </DialogHeader>

        <Tabs value={modo} onValueChange={(v) => setModo(v as Modo)} className="shrink-0">
          <TabsList className={cn(BARRA_ABAS, "grid w-full grid-cols-3")}>
            <TabsTrigger value="padrao" className={ABA}>
              Padrão
            </TabsTrigger>
            <TabsTrigger value="manual" className={ABA}>
              Na hora
            </TabsTrigger>
            <TabsTrigger value="estoque" className={ABA}>
              Do estoque
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid min-h-0 flex-1 gap-4 lg:h-[440px] lg:grid-cols-2">
          {/* ————— Configuração ————— */}
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
            <p className="text-sm text-muted-foreground">{descricao}</p>

            <div className="rounded-bloco border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                {/* Título curto de propósito: com a categoria junto ele
                    quebrava em duas linhas e encostava no botão ao lado. */}
                <h4 className={ROTULO}>
                  {modo === "padrao" ? "Proporção vigente" : "Proporção"}
                </h4>
                <div className="flex shrink-0 items-center gap-2">
                  {modo === "estoque" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPercentuais(percentuaisDoEstoque())}
                      disabled={loadingEstoque}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Recalcular
                    </Button>
                  )}
                  {ehAdHoc && (
                    <Badge
                      variant={totalValido ? "secondary" : "destructive"}
                      className="tabular-nums"
                    >
                      {total}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Na aba Padrão a proporção é só informativa: quem edita é a
                  tela de Configurações. Mostrar aqui evita aplicar às cegas. */}
              {modo === "padrao" ? (
                padraoVigente.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    Nenhuma proporção padrão configurada.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {padraoVigente.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate text-muted-foreground">{prod.nome}</span>
                        <span className="shrink-0 font-medium tabular-nums">
                          {prod.percentual}%
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : produtosRevenda.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  {idRevendaPadrao == null
                    ? `Categoria "${CATEGORIA_REVENDA_PADRAO}" não encontrada.`
                    : "Nenhum produto ativo nessa categoria."}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {produtosRevenda.map((prod) => (
                    <div key={prod.id} className="flex items-center gap-3">
                      <span className="flex-1 truncate text-sm">{prod.nome}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Input
                          value={percentuais[prod.id] ?? "0"}
                          onChange={(e) => handlePercentual(prod.id, e.target.value)}
                          className="h-8 w-20 rounded-controle text-right tabular-nums"
                          inputMode="decimal"
                        />
                        <span className="w-4 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {ehAdHoc && !totalValido && produtosRevenda.length > 0 && (
                <p className="mt-3 flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  A soma precisa fechar em 100% para aplicar.
                </p>
              )}
            </div>

            {ehAdHoc && foraPorCategoria.length > 0 && (
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                <span>
                  {foraPorCategoria.length}{" "}
                  {foraPorCategoria.length === 1 ? "pedido está fora" : "pedidos estão fora"}:
                  cliente sem a categoria {CATEGORIA_REVENDA_PADRAO} acionada no cadastro.
                </span>
              </p>
            )}
          </div>

          {/* ————— Quem recebe ————— */}
          <div className="flex min-h-0 flex-col overflow-hidden rounded-bloco border border-border">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Checkbox
                  checked={todosSelecionados}
                  ref={(el) => {
                    if (el) (el as any).indeterminate = algumSelecionado;
                  }}
                  onCheckedChange={toggleAll}
                  disabled={pedidosElegiveis.length === 0}
                />
                <span className="truncate text-sm font-medium">Selecionar todos</span>
              </div>
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {selecionados.size}/{pedidosElegiveis.length}
              </Badge>
            </div>

            {carregandoClientes && ehAdHoc ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-sm text-muted-foreground">
                <Loader2 className="mb-2 h-4 w-4 animate-spin" />
                Verificando os cadastros dos clientes…
              </div>
            ) : pedidosElegiveis.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {modo === "padrao"
                  ? "Não há pedidos Alterados nos filtros atuais."
                  : `Nenhum pedido de cliente ${CATEGORIA_REVENDA_PADRAO} nos filtros atuais.`}
              </div>
            ) : (
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-1.5 p-3">
                  {pedidosElegiveis.map((pedido) => {
                    const aceso = selecionados.has(String(pedido.id));
                    // Linha inteira clicável, mas NÃO um <button>: o próprio
                    // Checkbox do Radix já é um button, e button dentro de
                    // button é HTML inválido.
                    return (
                      <div
                        key={pedido.id}
                        role="checkbox"
                        aria-checked={aceso}
                        tabIndex={0}
                        onClick={() => toggleItem(String(pedido.id))}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            toggleItem(String(pedido.id));
                          }
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-controle border p-3 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          aceso
                            ? "border-brand-500/40 bg-brand-500/[.06]"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={aceso}
                          tabIndex={-1}
                          aria-hidden
                          className="pointer-events-none"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {pedido.cliente_nome}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {pedido.quantidade_total} un
                            </span>
                            <span>
                              {format(new Date(pedido.data_prevista_entrega), "dd/MM", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {pedido.tipo_pedido}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!podeAplicar}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings2 className="mr-2 h-4 w-4" />
            )}
            Aplicar ({selecionados.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
