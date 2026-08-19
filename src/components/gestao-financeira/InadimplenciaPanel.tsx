import { useMemo, useState } from "react";
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
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
} from "lucide-react";
import { useInadimplencia } from "@/hooks/useInadimplencia";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export default function InadimplenciaPanel() {
  const { clientes, loading, error, refetch } = useInadimplencia();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"atrasados" | "todos">("atrasados");
  const [expandido, setExpandido] = useState<string | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return clientes
      .filter((c) => (filtro === "atrasados" ? c.qtdAtrasados > 0 : true))
      .filter((c) => (termo ? c.clienteNome.toLowerCase().includes(termo) : true));
  }, [clientes, busca, filtro]);

  const totais = useMemo(() => {
    const comAtraso = clientes.filter((c) => c.qtdAtrasados > 0);
    return {
      clientesAtrasados: comAtraso.length,
      valorAtrasado: comAtraso.reduce((s, c) => s + c.valorAtrasado, 0),
      valorEmAberto: clientes.reduce((s, c) => s + c.valorEmAberto, 0),
      maiorAtraso: comAtraso.reduce((m, c) => Math.max(m, c.maiorAtraso), 0),
    };
  }, [clientes]);

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
                      <>
                        <TableRow
                          key={c.gestaoClickClienteId}
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
                            {c.qtdAtrasados > 0 ? (
                              <Badge variant="destructive">
                                {c.qtdAtrasados} atrasado{c.qtdAtrasados > 1 ? "s" : ""}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Em dia</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        {aberto && (
                          <TableRow key={`${c.gestaoClickClienteId}-det`}>
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(
                                            `https://app.gestaoclick.com/recebimentos/visualizar/${t.id}`,
                                            "_blank"
                                          );
                                        }}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}