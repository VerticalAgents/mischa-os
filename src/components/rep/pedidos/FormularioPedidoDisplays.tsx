import { useState } from "react";
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
import StepperDisplays from "@/components/rep/pedidos/StepperDisplays";
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
  PedidoDisplays,
  SABORES,
  SORTIDO,
  UNIDADES_POR_DISPLAY,
  dataEntrega,
  faixaPorDisplays,
  totalDisplays,
  totalUnidades,
} from "@/utils/pedidoDisplays";

const COMPOSICAO_SORTIDO = SABORES.map((s) => `${SORTIDO[s]} ${semBrownie(s)}`).join(", ");

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
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const jaConfirmado = pedidoAtual?.status === "Agendado";
  if (jaConfirmado && pedidoAtual?.travado) {
    return (
      <Card>
        <CardContent className="p-4 text-sm">{AVISO_SEPARADO}</CardContent>
      </Card>
    );
  }

  const displays = totalDisplays(pedido);
  const unidades = totalUnidades(pedido);
  const faixa = faixaPorDisplays(displays);
  const total = unidades * faixa.preco;
  const faltam = Math.max(0, MINIMO_DISPLAYS - displays);
  // Alterar não muda o dia da entrega; pedido novo entra na próxima rota.
  const entrega = jaConfirmado && pedidoAtual?.dataEntrega ? pedidoAtual.dataEntrega : dataEntrega(new Date());

  const confirmar = async () => {
    try {
      setSalvando(true);
      const resultado = await lancarPedido(cliente.id, pedido, trocas);
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

      <TrocasAccordion
        trocasPendentes={trocas}
        onTrocasPendentesChange={setTrocas}
        categoriasHabilitadas={[CATEGORIA_DISPLAYS]}
      />

      {(pedidoAtual?.bonificacoes.length ?? 0) > 0 && (
        <p className="text-sm rounded-md border px-3 py-2">
          <span className="font-medium">Bonificação da Mischa's:</span> {resumoDosExtras(pedidoAtual!.bonificacoes)}
        </p>
      )}

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
              O pedido mínimo é de {MINIMO_DISPLAYS} displays ({MINIMO_DISPLAYS * UNIDADES_POR_DISPLAY} brownies).{" "}
              {faltam === 1 ? "Falta 1 display." : `Faltam ${faltam} displays.`}
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

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{jaConfirmado ? "Salvar a alteração?" : "Confirmar o pedido?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {cliente.nome}: {resumoDosDisplays(pedido)} ({unidades} brownies), {reais(total)}. Entrega{" "}
              {diaPorExtenso(entrega)}.{trocas.length > 0 ? ` Trocas: ${resumoDosExtras(trocas)}.` : ""} O pedido vai
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
