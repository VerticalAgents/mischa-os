import { Fragment, useMemo, useRef, useState } from "react";
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
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ListChecks,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
} from "lucide-react";
import { useInadimplencia, type ClienteInadimplente } from "@/hooks/useInadimplencia";
import { useAcoesRecebimentos } from "@/hooks/useAcoesRecebimentos";
import AcoesMassaRecebimentosDialog from "@/components/gestao-financeira/AcoesMassaRecebimentosDialog";
import { RepresentantesFilter } from "@/components/expedicao/components/RepresentantesFilter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const hojeISO = () => new Date().toISOString().slice(0, 10);

const URL_RECEBIMENTOS_PADRAO =
  "https://gestaoclick.com/financeiro/movimentacoes_financeiras/index_recebimento/?venda={vendaId}&loja={lojaId}";
const URL_VENDA_PADRAO =
  "https://gestaoclick.com/pedidos/vendas/vendas_produtos/index?id={vendaId}";

/** Extrai o código da venda a partir da descrição do título ("Venda de nº 1765946977"). */
const extrairCodigoVenda = (descricao?: string): string | null => {
  if (!descricao) return null;
  const ancorado = descricao.match(/venda\s+de\s+n[ºo°.]?\s*(\d+)/i)?.[1];
  if (ancorado) return ancorado;
  return descricao.match(/(\d{3,})/)?.[1] ?? null;
};

const montarUrl = (
  template: string,
  valores: { vendaId: string; lojaId: string; hash: string }
) =>
  template
    .replace(/\{vendaId\}/g, encodeURIComponent(valores.vendaId))
    .replace(/\{lojaId\}/g, encodeURIComponent(valores.lojaId))
    .replace(/\{hash\}/g, encodeURIComponent(valores.hash));

export default function InadimplenciaPanel() {
  const { clientes, loading, error, refetch, isRepresentante } = useInadimplencia();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"atrasados" | "todos">("atrasados");
  const [filtroRepresentantes, setFiltroRepresentantes] = useState<number[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [editando, setEditando] = useState<
    { id: string; descricao?: string; dataVencimento: string } | null
  >(null);
  const [novaData, setNovaData] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [clienteMassa, setClienteMassa] = useState<ClienteInadimplente | null>(null);
  const [situacaoTitulo, setSituacaoTitulo] = useState<
    { id: string; descricao?: string; valor: number } | null
  >(null);
  const [dataLiquidacao, setDataLiquidacao] = useState(hojeISO());
  const { alterarSituacao } = useAcoesRecebimentos();

  const salvarSituacao = async () => {
    if (!situacaoTitulo) return;
    setSalvando(true);
    try {
      await alterarSituacao(situacaoTitulo.id, "recebido", dataLiquidacao);
      toast.success(`Título marcado como recebido em ${dataBR(dataLiquidacao)}`);
      setSituacaoTitulo(null);
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível alterar a situação");
    } finally {
      setSalvando(false);
    }
  };

  const salvarVencimento = async () => {
    if (!editando || !novaData) return;
    setSalvando(true);
    try {
      const { data: configData } = await supabase
        .from("integracoes_config")
        .select("config")
        .eq("integracao", "gestaoclick")
        .maybeSingle();

      const config = (configData?.config || {}) as {
        access_token?: string;
        secret_token?: string;
      };
      if (!config.access_token || !config.secret_token) {
        toast.error("Integração com o GestãoClick não configurada");
        return;
      }

      const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
        body: {
          action: "atualizar_vencimento_recebimento",
          access_token: config.access_token,
          secret_token: config.secret_token,
          recebimento_id: editando.id,
          data_vencimento: novaData,
        },
      });

      if (error || !(data as any)?.success) {
        const msg =
          (data as any)?.error || error?.message || "Não foi possível alterar o vencimento";
        toast.error(msg);
        return;
      }

      toast.success(`Vencimento alterado para ${dataBR(novaData)}`);
      setEditando(null);
      await refetch();
    } finally {
      setSalvando(false);
    }
  };
  // cache codigo da venda -> dados resolvidos (evita rechamar a API no mesmo sessão)
  const cacheVendas = useRef<Map<string, { id: string; hash: string; lojaId: string }>>(
    new Map()
  );

  // O ID do recebimento da API nao corresponde a uma pagina web do GestaoClick.
  // Extraimos o codigo da venda da descricao ("Venda de nº 1765946984") e
  // resolvemos o ID interno da venda via API para montar a URL correta.
  const abrirNoGestaoClick = async (
    titulo: { id: string; descricao?: string },
    destino: "recebimentos" | "venda"
  ) => {
    const numero = extrairCodigoVenda(titulo.descricao);
    if (!numero) {
      toast.error("Este título não tem venda vinculada");
      return;
    }

    setAbrindo(`${titulo.id}:${destino}`);
    try {
      const { data: configData } = await supabase
        .from("integracoes_config")
        .select("config")
        .eq("integracao", "gestaoclick")
        .maybeSingle();

      const config = (configData?.config || {}) as {
        access_token?: string;
        secret_token?: string;
        loja_id?: string | number;
        url_recebimentos_venda?: string;
        url_venda?: string;
      };
      if (!config.access_token || !config.secret_token) {
        toast.error("Integração com o GestãoClick não configurada");
        return;
      }

      let venda = cacheVendas.current.get(numero);

      if (!venda) {
        const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
          body: {
            action: "buscar_venda_por_codigo",
            access_token: config.access_token,
            secret_token: config.secret_token,
            codigo: numero,
          },
        });

        const encontrada = (data as any)?.venda;
        if (error || !encontrada?.id) {
          console.error("Erro ao resolver venda no GestãoClick:", error, data);
          toast.error(`Venda nº ${numero} não encontrada no GestãoClick`);
          return;
        }

        venda = {
          id: String(encontrada.id),
          hash: String(encontrada.hash || ""),
          lojaId: String(encontrada.loja_id || config.loja_id || ""),
        };
        cacheVendas.current.set(numero, venda);
      }

      const templateVenda =
        config.url_venda && !config.url_venda.includes("vendas/visualizar")
          ? config.url_venda
          : URL_VENDA_PADRAO;
      const template =
        destino === "recebimentos"
          ? config.url_recebimentos_venda || URL_RECEBIMENTOS_PADRAO
          : templateVenda;

      window.open(
        montarUrl(template, {
          vendaId: venda.id,
          lojaId: venda.lojaId,
          hash: venda.hash,
        }),
        "_blank"
      );
    } finally {
      setAbrindo(null);
    }
  };

  const clientesPorRepresentante = useMemo(() => {
    if (filtroRepresentantes.length === 0) return clientes;
    const incluiSemRepresentante = filtroRepresentantes.includes(-1);
    const idsReais = filtroRepresentantes.filter((id) => id !== -1);
    return clientes.filter((c) =>
      c.representanteId === null
        ? incluiSemRepresentante
        : idsReais.includes(c.representanteId)
    );
  }, [clientes, filtroRepresentantes]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return clientesPorRepresentante
      .filter((c) => (filtro === "atrasados" ? c.qtdAtrasados > 0 : true))
      .filter((c) => (termo ? c.clienteNome.toLowerCase().includes(termo) : true));
  }, [clientesPorRepresentante, busca, filtro]);

  const totais = useMemo(() => {
    const comAtraso = clientesPorRepresentante.filter((c) => c.qtdAtrasados > 0);
    return {
      clientesAtrasados: comAtraso.length,
      valorAtrasado: comAtraso.reduce((s, c) => s + c.valorAtrasado, 0),
      valorEmAberto: clientesPorRepresentante.reduce((s, c) => s + c.valorEmAberto, 0),
      maiorAtraso: comAtraso.reduce((m, c) => Math.max(m, c.maiorAtraso), 0),
    };
  }, [clientesPorRepresentante]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes com atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              {totais.clientesAtrasados}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor atrasado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              {brl(totais.valorAtrasado)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{brl(totais.valorEmAberto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maior atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totais.maiorAtraso} dias</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Títulos em aberto (GestãoClick)</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
                <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                  <TabsTrigger value="atrasados">Atrasados</TabsTrigger>
                  <TabsTrigger value="todos">Todos em aberto</TabsTrigger>
                </TabsList>
              </Tabs>
              {!isRepresentante && (
                <RepresentantesFilter
                  selectedIds={filtroRepresentantes}
                  onSelectionChange={setFiltroRepresentantes}
                  className="h-10 w-full sm:w-auto"
                />
              )}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar cliente"
                  className="pl-8 sm:w-56"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} title="Atualizar">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-28 text-right">Atrasado</TableHead>
                  <TableHead className="w-28 text-right">Em aberto</TableHead>
                  <TableHead className="w-32 text-right">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum título {filtro === "atrasados" ? "atrasado" : "em aberto"} encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  lista.map((c) => {
                    const aberto = expandido === c.gestaoClickClienteId;
                    return (
                      <Fragment key={c.gestaoClickClienteId}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            setExpandido(aberto ? null : c.gestaoClickClienteId)
                          }
                        >
                          <TableCell>
                            {aberto ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="truncate font-medium">{c.clienteNome}</TableCell>
                          <TableCell className="text-right text-destructive">
                            {c.valorAtrasado > 0 ? brl(c.valorAtrasado) : "-"}
                          </TableCell>
                          <TableCell className="text-right">{brl(c.valorEmAberto)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {c.qtdAtrasados > 0 ? (
                                <Badge variant="destructive">
                                  {c.qtdAtrasados} atrasado{c.qtdAtrasados > 1 ? "s" : ""}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Em dia</Badge>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Ações em massa nos títulos deste cliente"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClienteMassa(c);
                                }}
                              >
                                <ListChecks className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {aberto && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/30">
                              <div className="space-y-2">
                                {c.titulos.map((t) => (
                                  <div
                                    key={t.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                                  >
                                    <div className="min-w-0">
                                      <div className="truncate font-medium">
                                        {t.descricao || `Título ${t.codigo || t.id}`}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Vencimento {dataBR(t.dataVencimento)}
                                        {t.atrasado ? ` · ${t.diasAtraso} dias em atraso` : ""}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={
                                          t.atrasado ? "font-semibold text-destructive" : "font-semibold"
                                        }
                                      >
                                        {brl(t.valor)}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        title="Alterar data de vencimento no GestãoClick"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditando({
                                            id: t.id,
                                            descricao: t.descricao,
                                            dataVencimento: t.dataVencimento,
                                          });
                                          setNovaData(t.dataVencimento);
                                        }}
                                      >
                                        <CalendarClock className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        title="Marcar como recebido no GestãoClick"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSituacaoTitulo({
                                            id: t.id,
                                            descricao: t.descricao,
                                            valor: t.valor,
                                          });
                                          setDataLiquidacao(hojeISO());
                                        }}
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                      {extrairCodigoVenda(t.descricao) ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={abrindo === `${t.id}:recebimentos`}
                                            title="Abrir recebimentos da venda no GestãoClick"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              abrirNoGestaoClick(t, "recebimentos");
                                            }}
                                          >
                                            {abrindo === `${t.id}:recebimentos` ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Receipt className="h-4 w-4" />
                                            )}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={abrindo === `${t.id}:venda`}
                                            title="Abrir venda no GestãoClick"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              abrirNoGestaoClick(t, "venda");
                                            }}
                                          >
                                            {abrindo === `${t.id}:venda` ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <ExternalLink className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">
                                          sem venda vinculada
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar vencimento</DialogTitle>
            <DialogDescription className="truncate">
              {editando?.descricao || `Título ${editando?.id}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Vencimento atual:{" "}
              <span className="font-medium text-foreground">
                {editando ? dataBR(editando.dataVencimento) : ""}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nova-data-vencimento">Novo vencimento</Label>
              <Input
                id="nova-data-vencimento"
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A alteração é gravada direto no GestãoClick (título a receber).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              onClick={salvarVencimento}
              disabled={salvando || !novaData || novaData === editando?.dataVencimento}
            >
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}