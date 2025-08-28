import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import { scaleRecipe, type Receita } from "@/lib/scale-recipe";

type Props = { receitas: Receita[] };

export function GenerateFichaTecnicaDialog({ receitas }: Props) {
  const [open, setOpen] = React.useState(false);
  const [receitaId, setReceitaId] = React.useState<string>("");
  const [k, setK] = React.useState<number>(1);

  function handleGenerate(){
    const r = receitas.find(x => String(x.id) === String(receitaId));
    if(!r){ alert("Selecione uma receita."); return; }
    if(!k || k <= 0){ alert("Multiplicador inválido."); return; }
    const scaled = scaleRecipe(r, k);
    const payloadKey = `ficha_${Date.now()}`;
    sessionStorage.setItem(payloadKey, JSON.stringify({ base: r, k, scaled }));
    window.open(`/fichas-tecnicas/preview?key=${encodeURIComponent(payloadKey)}`, "_blank");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar ficha técnica
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar ficha técnica</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Receita</label>
            <Select onValueChange={setReceitaId} value={receitaId}>
              <SelectTrigger><SelectValue placeholder="Selecione a receita" /></SelectTrigger>
              <SelectContent>
                {receitas.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Multiplicador (rodadas)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.5"
                min="0.25"
                value={k}
                onChange={(e) => setK(Math.max(0.25, Number(e.target.value)))}
                className="w-32"
              />
              <div className="flex gap-1">
                {[1,2,3,5,10].map(v => (
                  <Button key={v} type="button" variant="outline" onClick={() => setK(v)}>{v}×</Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              1× = receita base (1 forma). Ex.: 3× para bater três massas na batedeira industrial.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleGenerate}>Gerar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}