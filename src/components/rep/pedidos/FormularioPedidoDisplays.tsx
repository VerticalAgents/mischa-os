import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import TrocasAccordion from "@/components/agendamento/TrocasAccordion";
import ObservacoesAgendamentoSection from "@/components/agendamento/ObservacoesAgendamentoSection";
import StepperDisplays from "@/components/rep/pedidos/StepperDisplays";
import { useInadimplencia } from "@/hooks/useInadimplencia";
import { useComposicaoSortido } from "@/hooks/useComposicaoSortido";
import { supabase } from "@/integrations/supabase/client";
import {
  AVISO_SEPARADO,
  diaPorExtenso,
  reais,
  resumoDosDisplays,
  resumoDosExtras,
  semBrownie,
} from "@/components/rep/pedidos/texto";
import { ClienteDeDisplays, ItemExtra, PedidoDoCliente, lancarPedido } from "@/services/pedidos/pedidoDisplays";
import {
  CATEGORIA_DISPLAYS,
  FAIXAS,
  MINIMO_DISPLAYS,
  MOTIVO_BONIFICACAO_AUTOMATICA,
  PedidoDisplays,
  SABORES,
  UNIDADES_POR_DISPLAY,
  atrasoBloqueiaPedido,
  dataEntrega,
  displaysBonificados,
  faixaPorDisplays,
  prazoDoBoleto,
  totalDisplays,
  totalUnidades,
} from "@/utils/pedidoDisplays";


interface Props {
  cliente: ClienteDeDisplays;
  /** O que o cliente tem hoje na agenda: pedido confirmado, previsto, ou nada. */
  pedidoAtual?: PedidoDoCliente;
  aoSalvar: () => void | Promise<void>;
}

/**
 * Monta, altera ou confirma o pedido em displays de um cliente. Serve à tela de Pedidos
 * e ao modal da agenda. Parte do último pedido do cliente; se a fábrica já separou,
 * mostra só o aviso.
 */
export default function FormularioPedidoDisplays({ cliente, pedidoAtual, aoSalvar }: Props) {
  const [pedido, setPedido] = useState<PedidoDisplays>(() =>
    pedidoAtual?.displays
      ? { sortido: pedidoAtual.displays.sortido || 0, sabores: { ...(pedidoAtual.displays.sabores || {}) } }
      : { sortido: 0, sabores: {} }
  );
  const [trocas, setTrocas] = useState<ItemExtra[]>(pedidoAtual?.trocas ?? []);
  // As duas observações da agenda da casa: a do cliente (permanente) e a só deste pedido.
  const [obsPedido, setObsPedido] = useState(pedidoAtual?.observacao ?? "");
  const [obsCliente, setObsCliente] = useState("");
  const [obsClienteOriginal, setObsClienteOriginal] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  // O que vai no sortido vem de Configurações › Proporções.
  const { composicao } = useComposicaoSortido();
  const composicaoSortido = SABORES.filter((s) => (composicao[s] ?? 0) > 0)
    .map((s) => `${composicao[s]} ${semBrownie(s)}`)
    .join(", ");

  // Pagamentos do cliente, lidos do Gestão Click: seguram pedido novo e definem o prazo do boleto.
  const { clientes: situacoes, loading: conferindoPagamentos } = useInadimplencia();
  const situacao = situacoes.find((c) => c.clienteId === cliente.id);
  const vencidos = (situacao?.titulos ?? []).filter((t) => atrasoBloqueiaPedido(t.diasAtraso));

  const [entregasFeitas, setEntregasFeitas] = useState(0);
  const [prazoLiberado, setPrazoLiberado] = useState<number | null>(null);
  // Cliente de lucro real: 1 display sortido bonificado a cada N comprados (decisão da Mischa's).
  const [bonificarACada, setBonificarACada] = useState<number | null>(null);
  useEffect(() => {
    let cancelado = false;
    supabase
      .from("historico_entregas")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", cliente.id)
      .eq("tipo", "entrega")
      .then(({ count }) => {
        if (!cancelado) setEntregasFeitas(count ?? 0);
      });
    supabase
      .from("clientes")
      .select("prazo_boleto_liberado_dias, bonificar_display_a_cada, observacoes" as any)
      .eq("id", cliente.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return;
        setPrazoLiberado((data as any)?.prazo_boleto_liberado_dias ?? null);
        setBonificarACada((data as any)?.bonificar_display_a_cada ?? null);
        setObsCliente((data as any)?.observacoes ?? "");
        setObsClienteOriginal((data as any)?.observacoes ?? "");
      });
    return () => {
      cancelado = true;
    };
  }, [cliente.id]);

  const jaConfirmado = pedidoAtual?.status === "Agendado";
  if (jaConfirmado && pedidoAtual?.travado) {
    return (
      <Card>
        <CardContent className="p-4 text-sm">{AVISO_SEPARADO}</CardContent>
      </Card>
    );
  }

  if (vencidos.length > 0) {
    const valor = vencidos.reduce((soma, t) => soma + t.valor, 0);
    const maiorAtraso = Math.max(...vencidos.map((t) => t.diasAtraso));
    return (
      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <p className="font-medium">Cliente com pagamento em atraso</p>
          <p>
            {vencidos.length === 1 ? "Há 1 boleto vencido" : `Há ${vencidos.length} boletos vencidos`}, somando{" "}
            {reais(valor)}, {maiorAtraso === 1 ? "há 1 dia" : `há até ${maiorAtraso} dias`}. Enquanto estiver em
            atraso, não dá para lançar nem alterar pedido deste cliente.
          </p>
          <p className="text-muted-foreground">
            Depois do pagamento, a liberação acontece quando a Mischa's dá baixa no boleto. Se o cliente já pagou,
            fale com a Mischa's.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displays = totalDisplays(pedido);
  const unidades = totalUnidades(pedido);
  const faixa = faixaPorDisplays(displays);
  const total = unidades * faixa.preco;
  const faltam = Math.max(0, MINIMO_DISPLAYS - displays);
  const bonificados = displaysBonificados(displays, bonificarACada);
  const textoBonificados = bonificados === 1 ? "1 display sortido" : `${bonificados} displays sortidos`;
  // A automática aparece na linha "Bonificado"; aqui fica só a que a Mischa's lançou à mão.
  const bonificacoesManuais = (pedidoAtual?.bonificacoes ?? []).filter(
    (b) => b.motivo_nome !== MOTIVO_BONIFICACAO_AUTOMATICA
  );
  const prazo = prazoDoBoleto({
    displays,
    entregasFeitas,
    titulosEmAberto: situacao?.titulos.length ?? 0,
    prazoLiberado,
  });
  // Alterar não muda o dia da entrega; pedido novo entra na próxima rota.
  const entrega = jaConfirmado && pedidoAtual?.dataEntrega ? pedidoAtual.dataEntrega : dataEntrega(new Date());

  const confirmar = async () => {
    try {
      setSalvando(true);
      if (obsCliente.trim() !== obsClienteOriginal.trim()) {
        const { error } = await supabase
          .from("clientes")
          .update({ observacoes: obsCliente.trim() || null })
          .eq("id", cliente.id);
        if (error) throw new Error("Não consegui salvar a observação do cliente.");
        setObsClienteOriginal(obsCliente);
      }
      const resultado = await lancarPedido(cliente.id, pedido, trocas, composicao, obsPedido);
      toast.success(
        `${resultado.alterado ? "Pedido alterado" : "Pedido confirmado"}: entrega ${diaPorExtenso(resultado.data_entrega)}.`
      );
      setConfirmando(false);
      await aoSalvar();
    } catch (e: any) {
      toast.error(e?.message || "Não consegui confirmar o pedido.");
      setConfirmando(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 divide-y">
          <StepperDisplays
            rotulo="Sortido"
            detalhe={composicaoSortido}
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

      <TrocasAccordion
        trocasPendentes={trocas}
        onTrocasPendentesChange={setTrocas}
        categoriasHabilitadas={[CATEGORIA_DISPLAYS]}
      />

      {bonificacoesManuais.length > 0 && (
        <p className="text-sm rounded-md border px-3 py-2">
          <span className="font-medium">Bonificação da Mischa's:</span> {resumoDosExtras(bonificacoesManuais)}
        </p>
      )}

      <ObservacoesAgendamentoSection
        observacoesGerais={obsCliente}
        onObservacoesGeraisChange={setObsCliente}
        observacoesAgendamento={obsPedido}
        onObservacoesAgendamentoChange={setObsPedido}
        empilhado
        textos={{
          geral: "Observação do cliente (vale sempre)",
          geralExemplo: "Ex.: entregar pelos fundos, falar com o João",
          agendamento: "Observação só deste pedido",
          agendamentoExemplo: "Ex.: levar expositor novo",
        }}
      />

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
            {bonificarACada ? (
              <>
                <span className="text-muted-foreground">Bonificado</span>
                <span className="text-right font-medium">
                  {bonificados > 0 ? `+ ${textoBonificados}` : `1 a cada ${bonificarACada} displays`}
                </span>
              </>
            ) : null}
            <span className="text-muted-foreground">Entrega</span>
            <span className="text-right font-medium">{diaPorExtenso(entrega)}</span>
            <span className="text-muted-foreground">Pagamento</span>
            <span className="text-right font-medium">
              {conferindoPagamentos ? "conferindo..." : `Boleto de ${prazo} dias`}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t pt-3">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-semibold tabular-nums">
              {displays >= MINIMO_DISPLAYS ? reais(total) : "—"}
            </span>
          </div>
          {faltam > 0 && (
            <p className="text-sm text-muted-foreground">
              O pedido mínimo é de {MINIMO_DISPLAYS} displays ({MINIMO_DISPLAYS * UNIDADES_POR_DISPLAY} brownies).{" "}
              {faltam === 1 ? "Falta 1 display." : `Faltam ${faltam} displays.`}
            </p>
          )}
          <Button
            className="w-full h-12 text-base"
            disabled={faltam > 0 || conferindoPagamentos}
            onClick={() => setConfirmando(true)}
          >
            {conferindoPagamentos ? "Conferindo pagamentos..." : jaConfirmado ? "Salvar alteração" : "Confirmar pedido"}
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Preço por brownie conforme os displays da entrega:{" "}
        {[...FAIXAS].reverse().map((f) => `${f.rotulo} = ${reais(f.preco)}`).join(" · ")}.
      </p>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{jaConfirmado ? "Salvar a alteração?" : "Confirmar o pedido?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {cliente.nome}: {resumoDosDisplays(pedido)} ({unidades} brownies), {reais(total)}. Entrega{" "}
              {diaPorExtenso(entrega)}, boleto de {prazo} dias.
              {bonificados > 0 ? ` Vai junto, bonificado pela Mischa's: ${textoBonificados}, sem cobrança.` : ""}
              {trocas.length > 0 ? ` Trocas: ${resumoDosExtras(trocas)}.` : ""}
              {obsPedido.trim() ? ` Obs.: ${obsPedido.trim()}.` : ""} O pedido vai
              direto para a separação da fábrica.
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
