import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Package, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import StepperDisplays from "@/components/rep/pedidos/StepperDisplays";
import {
  ClienteDeDisplays,
  PedidoDoCliente,
  cancelarPedido,
  lancarPedido,
  listarClientesDeDisplays,
  listarPedidos,
} from "@/services/pedidos/pedidoDisplays";
import {
  FAIXAS,
  MINIMO_DISPLAYS,
  PedidoDisplays,
  SABORES,
  SORTIDO,
  UNIDADES_POR_DISPLAY,
  dataEntrega,
  faixaPorDisplays,
  totalDisplays,
  totalUnidades,
} from "@/utils/pedidoDisplays";

const PEDIDO_VAZIO: PedidoDisplays = { sortido: 0, sabores: {} };

const reais = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const semBrownie = (nome: string) => nome.replace(/^Brownie\s+/, "");
const diaPorExtenso = (iso: string) => format(parseISO(iso), "EEEE, dd/MM", { locale: ptBR });

const COMPOSICAO_SORTIDO = SABORES.map((s) => `${SORTIDO[s]} ${semBrownie(s)}`).join(", ");

/** "2 sortidos + 1 Avelã" */
function resumoDosDisplays(pedido: PedidoDisplays | null): string {
  if (!pedido) return "";
  const partes: string[] = [];
  if (pedido.sortido > 0) partes.push(`${pedido.sortido} ${pedido.sortido === 1 ? "sortido" : "sortidos"}`);
  SABORES.forEach((sabor) => {
    const n = pedido.sabores?.[sabor] || 0;
    if (n > 0) partes.push(`${n} ${semBrownie(sabor)}`);
  });
  return partes.join(" + ");
}

export default function RepPedidos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clientes, setClientes] = useState<ClienteDeDisplays[]>([]);
  const [pedidos, setPedidos] = useState<PedidoDoCliente[]>([]);
  const [loading, setLoading] = useState(true);

  // null = lista; "" = escolhendo o cliente; id = montando o pedido dele
  const [clienteEmEdicao, setClienteEmEdicao] = useState<string | null>(null);
  const [pedido, setPedido] = useState<PedidoDisplays>(PEDIDO_VAZIO);
  const [busca, setBusca] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [cancelando, setCancelando] = useState<ClienteDeDisplays | null>(null);

  const carregar = async () => {
    try {
      setLoading(true);
      const lista = await listarClientesDeDisplays();
      setClientes(lista);
      setPedidos(await listarPedidos(lista.map((c) => c.id)));
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
      toast.error("Não consegui carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const pedidoPorCliente = useMemo(() => new Map(pedidos.map((p) => [p.clienteId, p])), [pedidos]);
  const confirmados = useMemo(
    () =>
      clientes
        .map((cliente) => ({ cliente, pedido: pedidoPorCliente.get(cliente.id) }))
        .filter((x) => x.pedido?.status === "Agendado")
        .sort((a, b) => (a.pedido!.dataEntrega || "").localeCompare(b.pedido!.dataEntrega || "")),
    [clientes, pedidoPorCliente]
  );

  const abrirPedido = (clienteId: string) => {
    const atual = pedidoPorCliente.get(clienteId);
    // Parte do último pedido do cliente: alterar um confirmado ou repetir o anterior.
    setPedido(
      atual?.displays
        ? { sortido: atual.displays.sortido || 0, sabores: { ...(atual.displays.sabores || {}) } }
        : PEDIDO_VAZIO
    );
    setClienteEmEdicao(clienteId);
  };

  // Vindo da ficha do cliente (/rep/agendamentos?cliente=<id>), já abre o pedido dele.
  useEffect(() => {
    const id = searchParams.get("cliente");
    if (!id || loading) return;
    if (clientes.some((c) => c.id === id)) abrirPedido(id);
    searchParams.delete("cliente");
    setSearchParams(searchParams, { replace: true });
  }, [loading]);

  const fechar = () => {
    setClienteEmEdicao(null);
    setBusca("");
    setPedido(PEDIDO_VAZIO);
  };

  const clienteAtual = clientes.find((c) => c.id === clienteEmEdicao) || null;
  const pedidoAtual = clienteAtual ? pedidoPorCliente.get(clienteAtual.id) : undefined;
  const jaConfirmado = pedidoAtual?.status === "Agendado";
  const travado = jaConfirmado && !!pedidoAtual?.travado;

  const displays = totalDisplays(pedido);
  const unidades = totalUnidades(pedido);
  const faixa = faixaPorDisplays(displays);
  const total = unidades * faixa.preco;
  const faltam = Math.max(0, MINIMO_DISPLAYS - displays);
  // Alterar não muda o dia da entrega; pedido novo entra na próxima rota.
  const entrega = jaConfirmado && pedidoAtual?.dataEntrega ? pedidoAtual.dataEntrega : dataEntrega(new Date());

  const confirmar = async () => {
    if (!clienteAtual) return;
    try {
      setSalvando(true);
      const resultado = await lancarPedido(clienteAtual.id, pedido);
      toast.success(
        `${resultado.alterado ? "Pedido alterado" : "Pedido confirmado"}: entrega ${diaPorExtenso(resultado.data_entrega)}.`
      );
      setConfirmando(false);
      fechar();
      await carregar();
    } catch (e: any) {
      toast.error(e?.message || "Não consegui confirmar o pedido.");
      setConfirmando(false);
    } finally {
      setSalvando(false);
    }
  };

  const cancelar = async () => {
    if (!cancelando) return;
    try {
      setSalvando(true);
      await cancelarPedido(cancelando.id);
      toast.success(`Pedido de ${cancelando.nome} cancelado.`);
      await carregar();
    } catch (e: any) {
      toast.error(e?.message || "Não consegui cancelar o pedido.");
    } finally {
      setSalvando(false);
      setCancelando(null);
    }
  };

  // ---------- escolher o cliente ----------
  if (clienteEmEdicao === "") {
    const q = busca.trim().toLowerCase();
    const filtrados = q ? clientes.filter((c) => c.nome.toLowerCase().includes(q)) : clientes;
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={fechar}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Pedidos
        </Button>
        <h1 className="text-xl font-semibold">Para qual cliente?</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11"
            placeholder="Buscar pelo nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
          />
        </div>
        {filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {clientes.length === 0
              ? "Você ainda não tem cliente cadastrado. Cadastre o ponto de venda em Clientes e volte aqui."
              : "Nenhum cliente com esse nome."}
          </p>
        ) : (
          <div className="space-y-2">
            {filtrados.map((c) => {
              const p = pedidoPorCliente.get(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => abrirPedido(c.id)}
                  className="w-full text-left rounded-lg border bg-card px-4 py-3 min-h-11 flex items-center justify-between gap-3 hover:bg-accent transition-colors"
                >
                  <span className="font-medium truncate">{c.nome}</span>
                  {p?.status === "Agendado" && (
                    <Badge variant="secondary" className="shrink-0">
                      {p.travado ? "Em separação" : "Pedido confirmado"}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------- montar o pedido ----------
  if (clienteAtual) {
    return (
      <div className="space-y-4 pb-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={fechar}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Pedidos
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">{jaConfirmado ? "Alterar pedido" : "Novo pedido"}</p>
          <h1 className="text-xl font-semibold leading-tight">{clienteAtual.nome}</h1>
        </div>

        {travado ? (
          <Card>
            <CardContent className="p-4 text-sm">
              A fábrica já separou este pedido. Para mudar ou cancelar, fale com a Mischa's.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4 divide-y">
                <StepperDisplays
                  rotulo="Sortido"
                  detalhe={COMPOSICAO_SORTIDO}
                  valor={pedido.sortido}
                  aoMudar={(n) => setPedido({ ...pedido, sortido: n })}
                />
                {SABORES.map((sabor) => (
                  <StepperDisplays
                    key={sabor}
                    rotulo={`Só ${semBrownie(sabor)}`}
                    valor={pedido.sabores[sabor] || 0}
                    aoMudar={(n) => setPedido({ ...pedido, sabores: { ...pedido.sabores, [sabor]: n } })}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Displays</span>
                  <span className="text-right font-medium tabular-nums">{displays}</span>
                  <span className="text-muted-foreground">Brownies</span>
                  <span className="text-right font-medium tabular-nums">{unidades}</span>
                  <span className="text-muted-foreground">Preço por brownie</span>
                  <span className="text-right font-medium tabular-nums">
                    {displays >= MINIMO_DISPLAYS ? `${reais(faixa.preco)} (${faixa.rotulo} displays)` : "—"}
                  </span>
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="text-right font-medium">{diaPorExtenso(entrega)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t pt-3">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {displays >= MINIMO_DISPLAYS ? reais(total) : "—"}
                  </span>
                </div>
                {faltam > 0 && (
                  <p className="text-sm text-muted-foreground">
                    O pedido mínimo é de {MINIMO_DISPLAYS} displays ({MINIMO_DISPLAYS * UNIDADES_POR_DISPLAY}{" "}
                    brownies). {faltam === 1 ? "Falta 1 display." : `Faltam ${faltam} displays.`}
                  </p>
                )}
                <Button className="w-full h-12 text-base" disabled={faltam > 0} onClick={() => setConfirmando(true)}>
                  {jaConfirmado ? "Salvar alteração" : "Confirmar pedido"}
                </Button>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              Preço por brownie conforme os displays da entrega:{" "}
              {[...FAIXAS].reverse().map((f) => `${f.rotulo} = ${reais(f.preco)}`).join(" · ")}.
            </p>
          </>
        )}

        <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{jaConfirmado ? "Salvar a alteração?" : "Confirmar o pedido?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {clienteAtual.nome}: {resumoDosDisplays(pedido)} ({unidades} brownies), {reais(total)}. Entrega{" "}
                {diaPorExtenso(entrega)}. O pedido vai direto para a separação da fábrica.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={salvando}>Voltar</AlertDialogCancel>
              <AlertDialogAction
                disabled={salvando}
                onClick={(e) => {
                  e.preventDefault();
                  confirmar();
                }}
              >
                {salvando ? "Enviando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ---------- lista ----------
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Pedidos</h1>
        <Button className="h-11" onClick={() => setClienteEmEdicao("")}>
          <Plus className="h-4 w-4 mr-1" /> Novo pedido
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
      ) : confirmados.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <Package className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-medium">Nenhum pedido confirmado</p>
            <p className="text-sm text-muted-foreground">
              Toque em Novo pedido para lançar. O mínimo é de {MINIMO_DISPLAYS} displays por entrega.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {confirmados.map(({ cliente, pedido: p }) => {
            const n = Math.floor(p!.quantidadeTotal / UNIDADES_POR_DISPLAY);
            return (
              <Card key={cliente.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight truncate">{cliente.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {p!.dataEntrega ? `Entrega ${diaPorExtenso(p!.dataEntrega)}` : "Sem data de entrega"}
                      </p>
                    </div>
                    {p!.travado && (
                      <Badge variant="secondary" className="shrink-0">
                        Em separação
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">
                    {resumoDosDisplays(p!.displays) || `${n} displays`}
                    <span className="text-muted-foreground">
                      {" "}
                      · {p!.quantidadeTotal} brownies · {reais(p!.quantidadeTotal * faixaPorDisplays(n).preco)}
                    </span>
                  </p>
                  {!p!.travado && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-11" onClick={() => abrirPedido(cliente.id)}>
                        Alterar
                      </Button>
                      <Button variant="outline" className="h-11" onClick={() => setCancelando(cliente)}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!cancelando} onOpenChange={(aberto) => !aberto && setCancelando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar o pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              O pedido de {cancelando?.nome} sai da separação da fábrica. Você pode lançar de novo depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando}
              onClick={(e) => {
                e.preventDefault();
                cancelar();
              }}
            >
              {salvando ? "Cancelando..." : "Cancelar pedido"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
