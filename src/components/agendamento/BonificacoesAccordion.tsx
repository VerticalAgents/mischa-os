import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Gift } from "lucide-react";
import BonificacoesPendentesEditor, { BonificacaoPendente } from "./BonificacoesPendentesEditor";

interface Props {
  bonificacoesPendentes: BonificacaoPendente[];
  onBonificacoesPendentesChange: (bonificacoes: BonificacaoPendente[]) => void;
}

export default function BonificacoesAccordion({ bonificacoesPendentes, onBonificacoesPendentesChange }: Props) {
  const temBonificacoes = bonificacoesPendentes.length > 0;
  const [open, setOpen] = useState(temBonificacoes);

  useEffect(() => {
    if (temBonificacoes && !open) setOpen(true);
  }, [temBonificacoes, open]);

  const isOpen = temBonificacoes || open;

  return (
    <div className={`border rounded-md ${temBonificacoes ? "border-green-500/50 bg-green-500/5" : ""}`}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => !temBonificacoes && setOpen((v) => !v)}
        disabled={temBonificacoes}
        className="w-full justify-between h-auto px-3 py-2 hover:bg-muted/50 disabled:opacity-100 disabled:cursor-default"
      >
        <div className="flex items-center gap-2">
          <Gift className={`h-4 w-4 ${temBonificacoes ? "text-green-600" : "text-muted-foreground"}`} />
          <Label className={`text-sm font-medium cursor-pointer ${temBonificacoes ? "text-green-700" : ""}`}>Bonificações</Label>
          {temBonificacoes && (
            <span className="text-xs text-muted-foreground ml-1">
              · {bonificacoesPendentes.length} {bonificacoesPendentes.length === 1 ? "item" : "itens"}
            </span>
          )}
        </div>
        {!temBonificacoes && (isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
      </Button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1">
          <BonificacoesPendentesEditor value={bonificacoesPendentes} onChange={onBonificacoesPendentesChange} />
        </div>
      )}
    </div>
  );
}