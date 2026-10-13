import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import FormularioPedidoDisplays from "@/components/rep/pedidos/FormularioPedidoDisplays";
import {
  AVISO_SEPARADO,
  diaPorExtenso,
  reais,
  resumoDosDisplays,
  resumoDosExtras,
} from "@/components/rep/pedidos/texto";
import {
  ClienteDeDisplays,
  PedidoDoCliente,
  cancelarPedido,
  listarClientesDeDisplays,
  listarPedidos,
} from "@/services/pedidos/pedidoDisplays";
import { MINIMO_DISPLAYS, UNIDADES_POR_DISPLAY, faixaPorDisplays } from "@/utils/pedidoDisplays";

export default function RepPedidos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clientes, setClientes] = useState<ClienteDeDisplays[]>([]);
  const [pedidos, setPedidos] = useState<PedidoDoCliente[]>([]);
  const [loading, setLoading] = useState(true);

  // null = lista; "" = escolhendo o cliente; id = montando o pedido dele
  const [clienteEmEdicao, setClienteEmEdicao] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
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
  const porStatus = (status: string) =>
    clientes
      .map((cliente) => ({ cliente, pedido: pedidoPorCliente.get(cliente.id) }))
      .filter((x) => x.pedido?.status === status && x.pedido.quantidadeTotal > 0)
      .sort((a, b) => (a.pedido!.dataEntrega || "").localeCompare(b.pedido!.dataEntrega || ""));
  const confirmados = useMemo(() => porStatus("Agendado"), [clientes, pedidoPorCliente]);
  // Previsto: o cliente recebeu na semana passada (ou o pedido foi cancelado) e falta confirmar.
  const previstos = useMemo(() => porStatus("Previsto"), [clientes, pedidoPorCliente]);

  // Vindo da ficha do cliente (/rep/pedidos?cliente=<id>), já abre o pedido dele.
  useEffect(() => {
    const id = searchParams.get("cliente");
    if (!id || loading) return;
    if (clientes.some((c) => c.id === id)) setClienteEmEdicao(id);
    searchParams.delete("cliente");
    setSearchParams(searchParams, { replace: true });
  }, [loading]);

  const fechar = () => {
    setClienteEmEdicao(null);
    setBusca("");
  };

  const clienteAtual = clientes.find((c) => c.id === clienteEmEdicao) || null;
  const pedidoAtual = clienteAtual ? pedidoPorCliente.get(clienteAtual.id) : undefined;

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
                  onClick={() => setClienteEmEdicao(c.id)}
                  className="w-full text-left rounded-lg border bg-card px-4 py-3 min-h-11 flex items-center justify-between gap-3 hover:bg-accent transition-colors"
                >
                  <span className="font-medium truncate">{c.nome}</span>
                  {p?.status === "Agendado" && (
                    <Badge variant="secondary" className="shrink-0">
                      {p.travado ? "Separado" : "Pedido confirmado"}
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
          <p className="text-sm text-muted-foreground">
            {pedidoAtual?.status === "Agendado"
              ? "Alterar pedido"
              : pedidoAtual?.status === "Previsto"
                ? "Confirmar pedido"
                : "Novo pedido"}
          </p>
          <h1 className="text-xl font-semibold leading-tight">{clienteAtual.nome}</h1>
        </div>
        <FormularioPedidoDisplays
          key={clienteAtual.id}
          cliente={clienteAtual}
          pedidoAtual={pedidoAtual}
          aoSalvar={async () => {
            fechar();
            await carregar();
          }}
        />
      </div>
    );
  }

  // Molde do cartão da agenda: o conteúdo à esquerda e as ações à direita, na mesma linha.
  // Só em tela estreita (celular em pé) as ações descem, para não espremer o nome do cliente.
  const cartao = (cliente: ClienteDeDisplays, p: PedidoDoCliente, previsto: boolean) => {
    const n = Math.floor(p.quantidadeTotal / UNIDADES_POR_DISPLAY);
    const separado = !previsto && p.travado;
    return (
      <Card key={cliente.id}>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="font-medium leading-tight truncate">{cliente.nome}</p>
            <p className="text-sm text-muted-foreground">
              {previsto
                ? "Último pedido. A entrega é marcada quando você confirmar."
                : p.dataEntrega
                  ? `Entrega ${diaPorExtenso(p.dataEntrega)}`
                  : "Sem data de entrega"}
            </p>
            <p className="text-sm">
              {resumoDosDisplays(p.displays) || `${n} displays`}
              <span className="text-muted-foreground">
                {" "}
                · {p.quantidadeTotal} brownies · {reais(p.quantidadeTotal * faixaPorDisplays(n).preco)}
              </span>
            </p>
            {p.trocas.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">Trocas:</span> {resumoDosExtras(p.trocas)}
              </p>
            )}
            {p.bonificacoes.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">Bonificação:</span> {resumoDosExtras(p.bonificacoes)}
              </p>
            )}
            {separado && <p className="text-sm text-muted-foreground">{AVISO_SEPARADO}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {previsto ? (
              <Button className="h-11 flex-1 sm:h-9 sm:flex-none" onClick={() => setClienteEmEdicao(cliente.id)}>
                Confirmar
              </Button>
            ) : separado ? (
              <Badge variant="secondary">Separado</Badge>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="h-11 flex-1 sm:h-9 sm:flex-none"
                  onClick={() => setClienteEmEdicao(cliente.id)}
                >
                  Alterar
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1 sm:h-9 sm:flex-none"
                  onClick={() => setCancelando(cliente)}
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
      ) : confirmados.length === 0 && previstos.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <Package className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-medium">Nenhum pedido</p>
            <p className="text-sm text-muted-foreground">
              Toque em Novo pedido para lançar. O mínimo é de {MINIMO_DISPLAYS} displays por entrega.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {previstos.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Previstos, falta confirmar</h2>
              {previstos.map(({ cliente, pedido: p }) => cartao(cliente, p!, true))}
            </section>
          )}
          {confirmados.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Confirmados</h2>
              {confirmados.map(({ cliente, pedido: p }) => cartao(cliente, p!, false))}
            </section>
          )}
        </>
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
