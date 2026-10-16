import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useComposicaoSortido } from "@/hooks/useComposicaoSortido";
import { SABORES, UNIDADES_POR_DISPLAY } from "@/utils/pedidoDisplays";

/** Quantos brownies de cada sabor vão no display sortido dos representantes. */
export default function DisplaySortidoCard() {
  const { composicao, carregando, salvar } = useComposicaoSortido();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setValores(Object.fromEntries(SABORES.map((s) => [s, String(composicao[s] ?? 0)])));
  }, [composicao]);

  const total = SABORES.reduce((s, sabor) => s + (parseInt(valores[sabor] || "0", 10) || 0), 0);
  const totalValido = total === UNIDADES_POR_DISPLAY;
  const mudou = SABORES.some((s) => (parseInt(valores[s] || "0", 10) || 0) !== (composicao[s] ?? 0));

  const alterar = (sabor: string, valor: string) => {
    if (valor === "" || /^\d{1,2}$/.test(valor)) setValores((v) => ({ ...v, [sabor]: valor }));
  };

  const gravar = async () => {
    setSalvando(true);
    try {
      const nova = Object.fromEntries(SABORES.map((s) => [s, parseInt(valores[s] || "0", 10) || 0]));
      const erro = await salvar(nova);
      if (erro) toast.error(erro);
      else toast.success("Composição do display sortido salva. Vale para os pedidos lançados daqui pra frente.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">Carregando...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display sortido</CardTitle>
        <p className="text-sm text-muted-foreground text-left">
          Quantos brownies de cada sabor vão num display sortido dos representantes. O display tem{" "}
          {UNIDADES_POR_DISPLAY} brownies. Mudar aqui vale para os pedidos lançados depois; pedido já lançado não muda
          sozinho.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {SABORES.map((sabor) => (
            <div key={sabor} className="flex items-center gap-4">
              <Label htmlFor={`sortido-${sabor}`} className="flex-1 text-sm font-medium">
                {sabor}
              </Label>
              <div className="relative w-24">
                <Input
                  id={`sortido-${sabor}`}
                  inputMode="numeric"
                  value={valores[sabor] ?? ""}
                  onChange={(e) => alterar(sabor, e.target.value)}
                  placeholder="0"
                  className="text-center pr-8 tabular-nums"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">un.</span>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Total: </span>
            <span className={`font-bold tabular-nums ${totalValido ? "text-green-600" : "text-red-600"}`}>
              {total} de {UNIDADES_POR_DISPLAY}
            </span>
          </div>
          <Button onClick={gravar} disabled={salvando || !totalValido || !mudou}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {!totalValido && (
          <Alert variant="destructive">
            <AlertDescription>
              {total > UNIDADES_POR_DISPLAY
                ? `Passou ${total - UNIDADES_POR_DISPLAY} do display. Tire para fechar ${UNIDADES_POR_DISPLAY}.`
                : `Faltam ${UNIDADES_POR_DISPLAY - total} para fechar o display.`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
