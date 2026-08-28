import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { useHistoricoFinanceiroCliente } from "@/hooks/useHistoricoFinanceiroCliente";
import { cn } from "@/lib/utils";

/**
 * Faturamento real do cliente, medido nos títulos emitidos.
 *
 * Substitui a projeção que existia aqui — média das últimas 12 semanas de
 * entrega multiplicada por 4,33, com custo logístico fixo, imposto estimado e
 * taxa de boleto. Aquilo respondia "quanto este cliente daria se tudo se
 * repetisse"; isto responde "quanto este cliente deu".
 *
 * Come do mesmo `useHistoricoFinanceiroCliente` do bloco de pagamento: a
 * consulta é a mesma e o React Query a compartilha, então não há busca extra.
 */

const ROTULO = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const brlExato = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const rotuloMes = (iso: string) => {
  const [, m] = iso.split("-");
  return MES_CURTO[Number(m) - 1] ?? iso;
};

const Numero = ({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) => (
  <div className="rounded-pilula border border-border p-3">
    <p className="text-[10px] font-semibold uppercase leading-tight tracking-[1px] text-muted-foreground">
      {rotulo}
    </p>
    <p className="mt-1 text-lg font-bold tabular-nums">{valor}</p>
    {nota && <p className="text-[10px] text-muted-foreground">{nota}</p>}
  </div>
);

export default function FaturamentoRealCliente({
  gestaoClickClienteId,
}: {
  gestaoClickClienteId?: string | null;
}) {
  const { score, loading, error, meses } = useHistoricoFinanceiroCliente(gestaoClickClienteId);

  if (!gestaoClickClienteId) return null;

  if (loading) {
    return (
      <Card className="shadow-tema">
        <CardContent className="space-y-3 py-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !score) {
    return (
      <Card className="shadow-tema">
        <CardContent className="flex items-start gap-3 py-5 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <div className="min-w-0 space-y-1">
            <p>Não foi possível carregar o faturamento.</p>
            {error?.message && (
              <p className="break-words font-mono text-xs opacity-70">{error.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { faturamento } = score;

  if (faturamento.titulos === 0) {
    return (
      <Card className="shadow-tema">
        <CardContent className="flex items-center gap-3 py-5 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          Nenhum título emitido para este cliente nos últimos {meses} meses.
        </CardContent>
      </Card>
    );
  }

  const maiorMes = Math.max(...faturamento.porMes.map((m) => m.valor), 1);

  return (
    <Card className="shadow-tema">
      <CardContent className="space-y-4 py-5">
        <h3 className={cn(ROTULO, "flex items-center gap-2")}>
          <TrendingUp className="h-3.5 w-3.5" />
          Faturamento real · {meses} meses
        </h3>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Numero rotulo="Total faturado" valor={brlExato(faturamento.total)} />
          <Numero
            rotulo="Média por mês"
            valor={brlExato(faturamento.mediaMensal)}
            nota={`em ${faturamento.mesesComMovimento} ${
              faturamento.mesesComMovimento === 1 ? "mês com venda" : "meses com venda"
            }`}
          />
          <Numero rotulo="Ticket médio" valor={brlExato(faturamento.ticketMedio)} />
          <Numero rotulo="Títulos" valor={String(faturamento.titulos)} />
        </div>

        {/* Mês a mês: onde o cliente cresceu ou sumiu se lê antes de qualquer
            número. Barra simples em vez de gráfico — são poucos meses. */}
        <div className="space-y-1">
          {faturamento.porMes.map(({ mes, valor }) => (
            <div key={mes} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-[11px] uppercase text-muted-foreground">
                {rotuloMes(mes)}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-controle bg-muted/50">
                <div
                  className="h-full rounded-controle bg-primary/60"
                  style={{ width: `${Math.max(2, (valor / maiorMes) * 100)}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {brl(valor)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
