import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Factory,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  FileDown,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { DiaProducaoAgendada } from "@/hooks/useProducaoAgendada";
import type { ValidacaoDia } from "@/hooks/useValidacaoInsumosProducaoAgendada";
import { useConfirmacaoProducao } from "@/hooks/useConfirmacaoProducao";
import { exportProducaoAgendadaPDF } from "@/utils/exportProducaoAgendadaPDF";

interface ProducaoAgendadaCardProps {
  dias: DiaProducaoAgendada[];
  validacoes: Map<string, ValidacaoDia>;
  totalUnidades: number;
  totalRegistros: number;
  loading: boolean;
  onNovaProducao?: () => void;
  onRecarregar?: () => void | Promise<void>;
}

export default function ProducaoAgendadaCard({
  dias,
  validacoes,
  totalUnidades,
  totalRegistros,
  loading,
  onNovaProducao,
  onRecarregar,
}: ProducaoAgendadaCardProps) {
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());
  const [confirmandoLote, setConfirmandoLote] = useState(false);
  const [desmarcados, setDesmarcados] = useState<Set<string>>(new Set());
  const { confirmarProducao } = useConfirmacaoProducao();

  const isSelecionado = (id: string) => !desmarcados.has(id);
  const toggleRegistro = (id: string) => {
    setDesmarcados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const registrosSelecionadosDoDia = (dia: DiaProducaoAgendada) =>
    dia.registros.filter((r) => isSelecionado(r.id));

  const toggleDia = (data: string) => {
    setDiasExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(data)) next.delete(data);
      else next.add(data);
      return next;
    });
  };

  const diasOk = dias.filter((d) => validacoes.get(d.data)?.status === "ok");
  const diasParciais = dias.filter((d) => validacoes.get(d.data)?.status === "parcial");
  // Para "Confirmar tudo": OK + selecionáveis nos parciais (excluindo afetados)
  const podeConfirmarTudo = diasOk.length > 0 || diasParciais.length > 0;

  const confirmarDia = async (dia: DiaProducaoAgendada) => {
    setConfirmandoLote(true);
    try {
      let ok = 0;
      let falhas = 0;
      const v = validacoes.get(dia.data);
      const afetados = new Set(v?.produtosFaltantes || []);
      const alvo = registrosSelecionadosDoDia(dia).filter((r) => !afetados.has(r.id));
      for (const reg of alvo) {
        const sucesso = await confirmarProducao(reg.id);
        if (sucesso) ok++;
        else falhas++;
      }
      toast({
        title: `${ok} produção(ões) confirmada(s)`,
        description: falhas > 0 ? `${falhas} falha(s).` : undefined,
        variant: falhas > 0 ? "destructive" : "default",
      });
      await onRecarregar?.();
    } finally {
      setConfirmandoLote(false);
    }
  };

  const confirmarTudo = async () => {
    setConfirmandoLote(true);
    try {
      let ok = 0;
      let falhas = 0;
      const diasAlvo = [...diasOk, ...diasParciais];
      for (const dia of diasAlvo) {
        const v = validacoes.get(dia.data);
        const afetados = new Set(v?.produtosFaltantes || []);
        for (const reg of registrosSelecionadosDoDia(dia)) {
          if (afetados.has(reg.id)) continue; // pula produtos com falta
          const sucesso = await confirmarProducao(reg.id);
          if (sucesso) ok++;
          else falhas++;
        }
      }
      toast({
        title: `${ok} produção(ões) confirmada(s)`,
        description: falhas > 0 ? `${falhas} falha(s).` : undefined,
        variant: falhas > 0 ? "destructive" : "default",
      });
      await onRecarregar?.();
    } finally {
      setConfirmandoLote(false);
    }
  };

  const handleExport = () => {
    if (!dias.length) return;
    exportProducaoAgendadaPDF(dias, validacoes);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              Produção Agendada
            </CardTitle>
            <CardDescription className="text-left">
              Produções registradas aguardando confirmação
            </CardDescription>
          </div>
          {onNovaProducao && (
            <Button size="sm" onClick={onNovaProducao} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              Nova Produção
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando produções...</span>
          </div>
        ) : dias.length === 0 ? (
          <div className="text-center py-8">
            <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma produção agendada</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Total de Unidades Agendadas</p>
              <p className="text-3xl font-bold text-primary">{totalUnidades}</p>
              <Badge variant="default" className="mt-2">
                {totalRegistros} {totalRegistros === 1 ? "registro" : "registros"}
              </Badge>
            </div>

            {/* Ações em massa */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-medium text-muted-foreground">
                Planejamento por dia
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-1"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button
                  size="sm"
                  onClick={confirmarTudo}
                  disabled={!podeConfirmarTudo || confirmandoLote}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  {confirmandoLote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  Confirmar tudo ({diasOk.length})
                </Button>
              </div>
            </div>

            {/* Lista de dias */}
            <div className="space-y-2">
              {dias.map((dia) => {
                const validacao = validacoes.get(dia.data);
                const statusFaltante = validacao?.status === "faltante";
                const statusParcial = validacao?.status === "parcial";
                const semReceita = validacao?.status === "sem_receita";
                const expandido = diasExpandidos.has(dia.data);
                const borderClass = statusFaltante
                  ? "border-l-4 border-l-red-500"
                  : statusParcial
                  ? "border-l-4 border-l-orange-500"
                  : semReceita
                  ? "border-l-4 border-l-amber-500"
                  : "border-l-4 border-l-green-500";
                const afetados = new Set(validacao?.produtosFaltantes || []);

                return (
                  <Card key={dia.data} className={`shadow-sm ${borderClass}`}>
                    <Collapsible open={expandido} onOpenChange={() => toggleDia(dia.data)}>
                      <CollapsibleTrigger asChild>
                        <div className="cursor-pointer hover:bg-muted/50 transition-colors px-4 py-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0">
                              {expandido ? (
                                <ChevronDown className="h-4 w-4 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold capitalize truncate">
                                  {dia.dataFormatada}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {dia.registros.length} registro(s) · {dia.totalFormas} formas · {dia.totalUnidades} un.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className={
                                        statusFaltante
                                          ? "border-red-500 text-red-700 bg-red-50 dark:bg-red-950/30"
                                          : statusParcial
                                          ? "border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-950/30"
                                          : semReceita
                                          ? "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/30"
                                          : "border-green-500 text-green-700 bg-green-50 dark:bg-green-950/30"
                                      }
                                    >
                                      {statusFaltante || statusParcial ? (
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                      ) : semReceita ? (
                                        <Info className="h-3 w-3 mr-1" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                      )}
                                      {statusFaltante
                                        ? `Faltam: ${validacao!.insumosFaltantes
                                            .slice(0, 2)
                                            .map((i) => i.nome)
                                            .join(", ")}${
                                            validacao!.insumosFaltantes.length > 2
                                              ? "…"
                                              : ""
                                          }`
                                        : statusParcial
                                        ? `Parcial: faltam ${validacao!.insumosFaltantes
                                            .slice(0, 2)
                                            .map((i) => i.nome)
                                            .join(", ")}${
                                            validacao!.insumosFaltantes.length > 2 ? "…" : ""
                                          }`
                                        : semReceita
                                        ? "Sem receita"
                                        : "Insumos OK"}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    {statusFaltante || statusParcial ? (
                                      <div className="space-y-1">
                                        <p className="font-semibold">
                                          {statusParcial
                                            ? "Alguns produtos sem insumos suficientes:"
                                            : "Insumos insuficientes:"}
                                        </p>
                                        {validacao!.insumosFaltantes.map((f) => (
                                          <p key={f.insumo_id} className="text-xs">
                                            • {f.nome}: falta {f.faltante.toFixed(2)} {f.unidade}{" "}
                                            (necessário {f.necessario.toFixed(2)}, disponível{" "}
                                            {f.disponivel.toFixed(2)})
                                          </p>
                                        ))}
                                      </div>
                                    ) : semReceita ? (
                                      <p className="text-xs">
                                        Produtos sem receita:{" "}
                                        {validacao!.produtosSemReceita.join(", ")}
                                      </p>
                                    ) : (
                                      <p className="text-xs">
                                        Todos os insumos disponíveis para este dia.
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-3 space-y-3">
                          <div className="overflow-hidden rounded-md border">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr className="text-left">
                                  <th className="px-3 py-2 font-medium w-10"></th>
                                  <th className="px-3 py-2 font-medium">Produto</th>
                                  <th className="px-3 py-2 font-medium text-center">Formas</th>
                                  <th className="px-3 py-2 font-medium text-center">Unidades</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dia.registros.map((r) => (
                                  <tr
                                    key={r.id}
                                    className={`border-t ${
                                      afetados.has(r.id)
                                        ? "bg-red-50/50 dark:bg-red-950/10"
                                        : ""
                                    }`}
                                  >
                                    <td className="px-3 py-2">
                                      <Checkbox
                                        checked={isSelecionado(r.id)}
                                        onCheckedChange={() => toggleRegistro(r.id)}
                                        aria-label={`Selecionar ${r.produto_nome}`}
                                        disabled={afetados.has(r.id)}
                                      />
                                    </td>
                                    <td className="px-3 py-2 truncate">
                                      <div className="flex items-center gap-1.5">
                                        {afetados.has(r.id) && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">
                                                  Insumos insuficientes para este produto
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        <span className="truncate">{r.produto_nome}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">{r.formas_producidas}</td>
                                    <td className="px-3 py-2 text-center">{r.unidades}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {(statusFaltante || statusParcial) && validacao!.insumosFaltantes.length > 0 && (
                            <div
                              className={`rounded-md border p-2 text-xs space-y-0.5 ${
                                statusParcial
                                  ? "border-orange-200 bg-orange-50 dark:bg-orange-950/20"
                                  : "border-red-200 bg-red-50 dark:bg-red-950/20"
                              }`}
                            >
                              <p
                                className={`font-medium mb-1 ${
                                  statusParcial
                                    ? "text-orange-700 dark:text-orange-300"
                                    : "text-red-700 dark:text-red-300"
                                }`}
                              >
                                Insumos faltantes:
                              </p>
                              {validacao!.insumosFaltantes.map((f) => (
                                <p
                                  key={f.insumo_id}
                                  className={
                                    statusParcial
                                      ? "text-orange-700 dark:text-orange-300"
                                      : "text-red-700 dark:text-red-300"
                                  }
                                >
                                  • {f.nome}: falta {f.faltante.toFixed(2)} {f.unidade}
                                </p>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {registrosSelecionadosDoDia(dia).length} de {dia.registros.length} selecionado(s)
                            </p>
                            <Button
                              size="sm"
                              disabled={
                                statusFaltante ||
                                semReceita ||
                                confirmandoLote ||
                                registrosSelecionadosDoDia(dia).filter((r) => !afetados.has(r.id))
                                  .length === 0
                              }
                              onClick={() => confirmarDia(dia)}
                              className="gap-1 bg-green-600 hover:bg-green-700"
                            >
                              {confirmandoLote ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCheck className="h-4 w-4" />
                              )}
                              Confirmar selecionados (
                              {registrosSelecionadosDoDia(dia).filter((r) => !afetados.has(r.id)).length}
                              )
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
