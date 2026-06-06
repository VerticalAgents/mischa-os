import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import TrocasPendentesEditor, { TrocaPendente } from "./TrocasPendentesEditor";

interface Props {
  trocasPendentes: TrocaPendente[];
  onTrocasPendentesChange: (trocas: TrocaPendente[]) => void;
  categoriasHabilitadas?: number[];
}

export default function TrocasAccordion({ trocasPendentes, onTrocasPendentesChange, categoriasHabilitadas }: Props) {
  const temTrocas = trocasPendentes.length > 0;
  const [open, setOpen] = useState(temTrocas);

  useEffect(() => {
    if (temTrocas && !open) setOpen(true);
  }, [temTrocas, open]);

  const isOpen = temTrocas || open;

  return (
    <div className={`border rounded-md ${temTrocas ? "border-destructive/50 bg-destructive/5" : ""}`}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => !temTrocas && setOpen((v) => !v)}
        disabled={temTrocas}
        className="w-full justify-between h-auto px-3 py-2 hover:bg-muted/50 disabled:opacity-100 disabled:cursor-default"
      >
        <div className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${temTrocas ? "text-destructive" : "text-amber-600"}`} />
          <Label className={`text-sm font-medium cursor-pointer ${temTrocas ? "text-destructive" : ""}`}>Trocas a Realizar</Label>
          {temTrocas && (
            <span className="text-xs text-muted-foreground ml-1">
              · {trocasPendentes.length} {trocasPendentes.length === 1 ? "item" : "itens"}
            </span>
          )}
        </div>
        {!temTrocas && (isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
      </Button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1">
          <TrocasPendentesEditor value={trocasPendentes} onChange={onTrocasPendentesChange} categoriasHabilitadas={categoriasHabilitadas} />
        </div>
      )}
    </div>
  );
}