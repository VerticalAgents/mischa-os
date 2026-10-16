import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Bonificação automática do cliente de lucro real (Lucca, 16/10/2026): 1 display sortido
 * bonificado a cada N comprados. Só o admin vê e mexe; o banco também barra o representante.
 * Grava sozinho em `clientes.bonificar_display_a_cada` (vazio = não bonifica), fora do
 * salvar do formulário. Quem aplica no pedido é a RPC `rep_lancar_pedido_displays`.
 */
export default function BonificacaoAutomaticaCampo({ clienteId }: { clienteId: string }) {
  const [salvo, setSalvo] = useState<number | null>(null);
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    supabase
      .from("clientes")
      .select("bonificar_display_a_cada" as any)
      .eq("id", clienteId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return;
        const n = (data as any)?.bonificar_display_a_cada ?? null;
        setSalvo(n);
        setValor(n ? String(n) : "");
      });
    return () => {
      cancelado = true;
    };
  }, [clienteId]);

  const novo = valor.trim() === "" ? null : Number(valor);
  const invalido = novo !== null && (!Number.isInteger(novo) || novo < 2);
  const mudou = novo !== salvo;

  const salvar = async () => {
    if (invalido) return;
    setSalvando(true);
    const { error } = await supabase
      .from("clientes")
      .update({ bonificar_display_a_cada: novo } as any)
      .eq("id", clienteId);
    setSalvando(false);
    if (error) {
      toast({ title: "Não consegui salvar a bonificação", description: error.message, variant: "destructive" });
      return;
    }
    setSalvo(novo);
    toast({
      title: novo ? `Bonificação ligada: 1 display a cada ${novo}` : "Bonificação automática desligada",
      description: "Vale para os pedidos lançados ou alterados daqui para frente.",
    });
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <Label htmlFor="bonificar-display">Bonificação automática (cliente de lucro real)</Label>
      <div className="flex items-center gap-2 text-sm">
        <span>1 display sortido bonificado a cada</span>
        <Input
          id="bonificar-display"
          type="number"
          min={2}
          step={1}
          className="w-20"
          placeholder="—"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <span>comprados</span>
        <Button type="button" size="sm" variant="outline" disabled={!mudou || invalido || salvando} onClick={salvar}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {invalido
          ? "Use um número inteiro, 2 ou mais. Vazio desliga."
          : "Vazio = não bonifica. O bonificado não entra no preço, na nota nem na comissão do representante."}
      </p>
    </div>
  );
}
