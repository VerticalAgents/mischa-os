import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProducaoAgendada } from "@/hooks/useProducaoAgendada";
import { useConfirmacaoProducao } from "@/hooks/useConfirmacaoProducao";
import { useSupabaseHistoricoProducao } from "@/hooks/useSupabaseHistoricoProducao";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  onChange?: () => void;
}

export default function ProducoesAtrasadasCard({ onChange }: Props) {
  const { registros, loading, recarregar } = useProducaoAgendada();
  const { confirmarProducao, loading: confirmando } = useConfirmacaoProducao();
  const { removerRegistro } = useSupabaseHistoricoProducao();
  const [acaoEm, setAcaoEm] = useState<string | null>(null);
  const [aberto, setAberto] = useState(true);

  const atrasados = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return (registros || [])
      .filter((r: any) => {
        if (!r.data_producao) return false;
        const d = new Date(r.data_producao + "T12:00:00");
        d.setHours(0, 0, 0, 0);
        return d.getTime() < hoje.getTime();
      })
      .sort((a: any, b: any) =>
        (a.data_producao || "").localeCompare(b.data_producao || "")
      );
  }, [registros]);

  if (loading) {
    return (
      <Card className="border-orange-500/40">
        <CardContent className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando produções agendadas em atraso...
        </CardContent>
      </Card>
    );
  }

  if (atrasados.length === 0) return null;

  const handleConfirmar = async (id: string) => {
    setAcaoEm(id);
    const ok = await confirmarProducao(id);
    setAcaoEm(null);
    if (ok) {
      await recarregar();
      onChange?.();
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (!confirm(`Excluir o registro agendado de "${nome}"? Essa ação não pode ser desfeita.`)) return;
    setAcaoEm(id);
    await removerRegistro(id);
    setAcaoEm(null);
    await recarregar();
    onChange?.();
  };

  return (
    <Card className="border-orange-500/40 bg-orange-500/5">
      <Collapsible open={aberto} onOpenChange={setAberto}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Produções agendadas em atraso
                <Badge variant="outline" className="ml-1 border-orange-500/40 text-orange-700 dark:text-orange-400">
                  {atrasados.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-left">
                Estas produções foram agendadas para datas anteriores a hoje e ainda não foram confirmadas. Confirme ou exclua para manter o histórico correto.
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 shrink-0">
                {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-2">
              {atrasados.map((r: any) => {
                const data = new Date(r.data_producao + "T12:00:00");
                const dataLabel = format(data, "EEE, dd/MM/yyyy", { locale: ptBR });
                const formas = Number(r.formas_producidas || 0);
                const unidades = Number(
                  r.unidades_previstas || r.unidades_calculadas || 0
                );
                const ocupado = acaoEm === r.id || confirmando;
                return (
                  <div
                    key={r.id}
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 rounded-lg border bg-background"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.produto_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {dataLabel} · {formas} forma{formas === 1 ? "" : "s"} · {unidades} un
                        {r.turno ? ` · ${r.turno}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleConfirmar(r.id)}
                        disabled={ocupado}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {ocupado ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Confirmar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExcluir(r.id, r.produto_nome)}
                        disabled={ocupado}
                        className="border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
