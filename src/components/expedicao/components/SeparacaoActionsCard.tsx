import React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Send, RefreshCw, Wand2 } from "lucide-react";
import { PrintingActions } from "./PrintingActions";
import { cn } from "@/lib/utils";

interface SeparacaoActionsCardProps {
  onSepararEmMassa: () => void;
  onGerarVendas: () => void;
  onAplicarPadrao: () => void;
  onAtualizar: () => void;
  isLoading: boolean;
  pedidosFiltrados: any[];
  representantes?: { id: number; nome: string }[];
  className?: string;
  onGerarVendasGC?: (pedidoIds: string[]) => Promise<void>;
}

export const SeparacaoActionsCard = ({
  onSepararEmMassa,
  onGerarVendas,
  onAplicarPadrao,
  onAtualizar,
  isLoading,
  pedidosFiltrados,
  representantes = [],
  className = "",
  onGerarVendasGC,
}: SeparacaoActionsCardProps) => {
  const itemBase =
    "group flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed";
  const itemIdle =
    "text-foreground/70 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10";
  const iconBase =
    "h-4 w-4 shrink-0 text-muted-foreground group-hover:text-amber-500 transition-colors";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-amber-500" />
          Ações
        </h3>
      </div>
      <div className="px-2 pb-4 space-y-0.5">
        <button type="button" onClick={onSepararEmMassa} className={cn(itemBase, itemIdle)}>
          <CheckCircle2 className={iconBase} strokeWidth={1.5} />
          Separar em Massa
        </button>

        <button type="button" onClick={onGerarVendas} className={cn(itemBase, itemIdle)}>
          <Send className={iconBase} strokeWidth={1.5} />
          Gerar Vendas
        </button>

        <button type="button" onClick={onAplicarPadrao} className={cn(itemBase, itemIdle)}>
          <Wand2 className={iconBase} strokeWidth={1.5} />
          Aplicar Proporção Padrão
        </button>

        <PrintingActions
          activeSubTab="todos"
          pedidosPadrao={pedidosFiltrados.filter(p => p.tipo_pedido === 'Padrão')}
          pedidosAlterados={pedidosFiltrados.filter(p => p.tipo_pedido === 'Alterado')}
          pedidosProximoDia={[]}
          todosPedidos={pedidosFiltrados}
          representantes={representantes}
          onGerarVendasGC={onGerarVendasGC}
        />

        <div className="py-2 px-3">
          <div className="h-px w-full bg-border/60" />
        </div>

        <button
          type="button"
          onClick={onAtualizar}
          disabled={isLoading}
          className={cn(itemBase, "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10")}
        >
          <RefreshCw
            className={cn("h-4 w-4 shrink-0 text-muted-foreground/70 group-hover:text-amber-500 transition-colors", isLoading && "animate-spin")}
            strokeWidth={1.5}
          />
          Atualizar
        </button>
      </div>
    </Card>
  );
};
