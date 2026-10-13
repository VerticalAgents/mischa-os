import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CHIP_STATUS } from "@/components/agendamento/cores-status";
import type { Canal } from "@/utils/canalVenda";
import { ROTULO_CANAL } from "./CardsCanais";

export interface LinhaFaturamento {
  chave: string;
  cliente: string;
  status: 'Entregue' | 'Confirmado' | 'Previsto';
  /** unidades do pedido inteiro (pacotes, no food service) */
  unidades: number;
  valor: number;
}

interface FaturamentoDetalheProps {
  porCanal: { canal: Canal; entregue: number; aEntregar: number }[];
  linhas: LinhaFaturamento[];
  total: number;
  /** o que entra na conta (depende de incluir ou não as previstas) */
  legenda: string;
}

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (parte: number, todo: number) => (todo > 0 ? `${Math.round((parte / todo) * 100)}%` : "0%");

const CHIP: Record<LinhaFaturamento['status'], string> = {
  Entregue: CHIP_STATUS.entregue,
  Confirmado: CHIP_STATUS.confirmado,
  Previsto: CHIP_STATUS.provavel,
};

/**
 * O que está por trás do card de Faturamento: de qual canal o dinheiro vem e quais
 * pedidos formam o número. Valor calculado pelo preço de cada cliente, não o da nota.
 */
export default function FaturamentoDetalhe({ porCanal, linhas, total, legenda }: FaturamentoDetalheProps) {
  return (
    <div className="rounded-bloco border border-border bg-card p-5 shadow-tema">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          Faturamento da semana
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {legenda}. Valor calculado pelo preço de cada cliente; não é o da nota nem o que já foi pago.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 font-medium">Canal</th>
                <th className="py-2 text-right font-medium">Entregue</th>
                <th className="py-2 text-right font-medium">A entregar</th>
                <th className="py-2 text-right font-medium">Total</th>
                <th className="py-2 pl-3 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {porCanal.map(c => (
                <tr key={c.canal} className="border-b border-border/60">
                  <td className="py-2 font-medium text-foreground">{ROTULO_CANAL[c.canal]}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{reais(c.entregue)}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{reais(c.aEntregar)}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-foreground">{reais(c.entregue + c.aEntregar)}</td>
                  <td className="py-2 pl-3 text-right tabular-nums text-muted-foreground">{pct(c.entregue + c.aEntregar, total)}</td>
                </tr>
              ))}
            </tbody>
            {porCanal.length > 1 && (
              <tfoot>
                <tr>
                  <td className="py-2 font-bold text-foreground">Total</td>
                  <td className="py-2 text-right font-medium tabular-nums text-foreground">
                    {reais(porCanal.reduce((s, c) => s + c.entregue, 0))}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums text-foreground">
                    {reais(porCanal.reduce((s, c) => s + c.aEntregar, 0))}
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums text-foreground">{reais(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
            <span className="font-medium">Pedidos, do maior para o menor</span>
            <span className="tabular-nums">{linhas.length}</span>
          </div>
          {linhas.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">Nenhum pedido entra na conta desta semana.</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {linhas.map(l => (
                <li key={l.chave} className="flex items-center gap-3 rounded-controle px-2 py-1.5 text-sm hover:bg-muted/40">
                  <span className="min-w-0 flex-1 truncate text-foreground">{l.cliente}</span>
                  <Badge variant="outline" className={cn("shrink-0 rounded-full text-[10px]", CHIP[l.status])}>
                    {l.status}
                  </Badge>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {l.unidades.toLocaleString("pt-BR")} un
                  </span>
                  <span className="w-24 shrink-0 text-right font-medium tabular-nums text-foreground">{reais(l.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
