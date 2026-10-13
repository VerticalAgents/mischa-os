import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  rotulo: string;
  detalhe?: string;
  valor: number;
  aoMudar: (valor: number) => void;
  desabilitado?: boolean;
}

/** Contador de displays: botões grandes, porque o representante lança do celular, na rua. */
export default function StepperDisplays({ rotulo, detalhe, valor, aoMudar, desabilitado }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="font-medium leading-tight">{rotulo}</p>
        {detalhe && <p className="text-xs text-muted-foreground leading-snug">{detalhe}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11"
          aria-label={`Tirar um display de ${rotulo}`}
          disabled={desabilitado || valor <= 0}
          onClick={() => aoMudar(Math.max(0, valor - 1))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center text-lg font-semibold tabular-nums">{valor}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11"
          aria-label={`Pôr um display de ${rotulo}`}
          disabled={desabilitado}
          onClick={() => aoMudar(valor + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
