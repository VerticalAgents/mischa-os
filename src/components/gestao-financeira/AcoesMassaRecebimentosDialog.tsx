import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClienteInadimplente } from "@/hooks/useInadimplencia";
import { useAcoesRecebimentos } from "@/hooks/useAcoesRecebimentos";
import { hojeISO } from "@/utils/dataLocal";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

type Acao = "vencimento" | "situacao";

interface Props {
  cliente: ClienteInadimplente | null;
  onClose: () => void;
  onConcluido: () => void | Promise<unknown>;
}

export default function AcoesMassaRecebimentosDialog({ cliente, onClose, onConcluido }: Props) {
  const { alterarVencimento, alterarSituacao, executarLote, processando, progresso } =
    useAcoesRecebimentos();
  const [acao, setAcao] = useState<Acao>("vencimento");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [novaData, setNovaData] = useState(hojeISO());
  const [situacao, setSituacao] = useState<"recebido" | "em_aberto">("recebido");
  const [dataLiquidacao, setDataLiquidacao] = useState(hojeISO());

  // Ao abrir, pré-seleciona os títulos vencidos do cliente
  useEffect(() => {
    if (!cliente) return;
    setAcao("vencimento");
    setSelecionados(cliente.titulos.filter((t) => t.atrasado).map((t) => t.id));
    setNovaData(hojeISO());
    setDataLiquidacao(hojeISO());
    setSituacao("recebido");
  }, [cliente]);

  const titulos = cliente?.titulos ?? [];
  const todosMarcados = titulos.length > 0 && selecionados.length === titulos.length;

  const valorSelecionado = useMemo(
    () => titulos.filter((t) => selecionados.includes(t.id)).reduce((s, t) => s + t.valor, 0),
    [titulos, selecionados]
  );

  const alternar = (id: string) =>
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id]
    );

  const executar = async () => {
    if (selecionados.length === 0) return;

    const resultado = await executarLote(selecionados, (id) =>
      acao === "vencimento"
        ? alterarVencimento(id, novaData)
        : alterarSituacao(id, situacao, dataLiquidacao)
    );

    if (resultado.ok.length > 0) {
      toast.success(
        acao === "vencimento"
          ? `${resultado.ok.length} título(s) reagendado(s) para ${dataBR(novaData)}`
          : `${resultado.ok.length} título(s) marcado(s) como ${
              situacao === "recebido" ? "recebido" : "em aberto"
            }`
      );
    }
    if (resultado.falhas.length > 0) {
      toast.error(
        `${resultado.falhas.length} título(s) não foram alterados: ${resultado.falhas[0].motivo}`
      );
    }

    await onConcluido();
    if (resultado.falhas.length === 0) onClose();
  };

  return (
    <Dialog open={!!cliente} onOpenChange={(o) => !o && !processando && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ações em massa — {cliente?.clienteNome}</DialogTitle>
          <DialogDescription>
            Selecione os títulos e aplique a alteração direto no GestãoClick. O valor dos títulos
            nunca é alterado.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={acao} onValueChange={(v) => setAcao(v as Acao)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vencimento">Reagendar vencimento</TabsTrigger>
            <TabsTrigger value="situacao">Alterar situação</TabsTrigger>
          </TabsList>
        </Tabs>

        {acao === "vencimento" ? (
          <div className="space-y-1.5">
            <Label htmlFor="massa-nova-data">Novo vencimento (para todos os selecionados)</Label>
            <Input
              id="massa-nova-data"
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nova situação</Label>
              <Tabs value={situacao} onValueChange={(v) => setSituacao(v as typeof situacao)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="recebido">Recebido</TabsTrigger>
                  <TabsTrigger value="em_aberto">Em aberto</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {situacao === "recebido" && (
              <div className="space-y-1.5">
                <Label htmlFor="massa-data-liq">Data do recebimento</Label>
                <Input
                  id="massa-data-liq"
                  type="date"
                  value={dataLiquidacao}
                  onChange={(e) => setDataLiquidacao(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <div className="rounded-md border">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={todosMarcados}
                onCheckedChange={(marcado) =>
                  setSelecionados(marcado ? titulos.map((t) => t.id) : [])
                }
              />
              Selecionar todos ({titulos.length})
            </label>
            <span className="text-sm text-muted-foreground">
              {selecionados.length} selecionado(s) · {brl(valorSelecionado)}
            </span>
          </div>
          <ScrollArea className="max-h-64">
            <div className="divide-y">
              {titulos.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selecionados.includes(t.id)}
                    onCheckedChange={() => alternar(t.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {t.descricao || `Título ${t.codigo || t.id}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vencimento {dataBR(t.dataVencimento)}
                    </div>
                  </div>
                  {t.atrasado && (
                    <Badge variant="destructive" className="shrink-0">
                      {t.diasAtraso}d
                    </Badge>
                  )}
                  <span className="w-24 shrink-0 text-right font-medium">{brl(t.valor)}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processando}>
            Cancelar
          </Button>
          <Button onClick={executar} disabled={processando || selecionados.length === 0}>
            {processando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processando && progresso
              ? `Aplicando ${progresso.feitos}/${progresso.total}`
              : `Aplicar em ${selecionados.length} título(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
