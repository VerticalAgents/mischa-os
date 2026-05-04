import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSupabaseHistoricoProducao } from "@/hooks/useSupabaseHistoricoProducao";

export interface SugestaoElegivel {
  produto_id: string;
  produto_nome: string;
  formas_sugeridas: number;
  rendimento: number;
  estoque_disponivel: number;
  estoque_alvo: number;
  quantidade_a_produzir: number;
}

interface AgendarSugestoesEmMassaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sugestoes: SugestaoElegivel[];
  onSuccess?: () => void | Promise<void>;
}

export default function AgendarSugestoesEmMassaDialog({
  isOpen,
  onClose,
  sugestoes,
  onSuccess,
}: AgendarSugestoesEmMassaDialogProps) {
  const { adicionarRegistro } = useSupabaseHistoricoProducao();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [formasAjustadas, setFormasAjustadas] = useState<Record<string, number>>({});
  const [dataProducao, setDataProducao] = useState<Date>(new Date());
  const [turno, setTurno] = useState<string>("Matutino");
  const [observacoes, setObservacoes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setSelecionados(new Set(sugestoes.map(s => s.produto_id)));
      const inicial: Record<string, number> = {};
      sugestoes.forEach(s => { inicial[s.produto_id] = s.formas_sugeridas; });
      setFormasAjustadas(inicial);
      setDataProducao(new Date());
      setTurno("Matutino");
      setObservacoes("");
    }
  }, [isOpen, sugestoes]);

  const todosSelecionados = sugestoes.length > 0 && selecionados.size === sugestoes.length;
  const algumSelecionado = selecionados.size > 0 && selecionados.size < sugestoes.length;

  const toggleItem = (id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (todosSelecionados) setSelecionados(new Set());
    else setSelecionados(new Set(sugestoes.map(s => s.produto_id)));
  };

  const updateFormas = (id: string, value: number) => {
    setFormasAjustadas(prev => ({ ...prev, [id]: Math.max(0, value || 0) }));
  };

  const totalFormas = useMemo(() => {
    return sugestoes
      .filter(s => selecionados.has(s.produto_id))
      .reduce((sum, s) => sum + (formasAjustadas[s.produto_id] || 0), 0);
  }, [sugestoes, selecionados, formasAjustadas]);

  const handleConfirmar = async () => {
    const itensParaAgendar = sugestoes
      .filter(s => selecionados.has(s.produto_id))
      .map(s => ({ ...s, formas: formasAjustadas[s.produto_id] || 0 }))
      .filter(s => s.formas > 0);

    if (itensParaAgendar.length === 0) {
      toast({
        title: "Nenhum item válido",
        description: "Selecione ao menos um produto com quantidade maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    let sucesso = 0;
    let falha = 0;
    const dataStr = format(dataProducao, "yyyy-MM-dd");

    for (const item of itensParaAgendar) {
      const unidades = Math.floor(item.formas * item.rendimento);
      try {
        const ok = await adicionarRegistro({
          data_producao: dataStr,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          formas_producidas: item.formas,
          unidades_calculadas: unidades,
          turno,
          observacoes: observacoes || undefined,
          origem: "Sugestao",
          rendimento_usado: item.rendimento,
          unidades_previstas: unidades,
          status: "Registrado",
        } as any);
        if (ok === false) falha++;
        else sucesso++;
      } catch (e) {
        console.error("Erro ao agendar item:", item.produto_nome, e);
        falha++;
      }
    }

    setSubmitting(false);

    if (sucesso > 0) {
      toast({
        title: "Produções agendadas",
        description: `${sucesso} ${sucesso === 1 ? "produção agendada" : "produções agendadas"} com sucesso${falha > 0 ? ` · ${falha} falha(s)` : ""}.`,
      });
      await onSuccess?.();
      onClose();
    } else {
      toast({
        title: "Falha ao agendar",
        description: "Nenhum item foi agendado. Verifique e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agendar Sugestões em Massa</DialogTitle>
          <DialogDescription>
            Crie registros de produção para os produtos sugeridos. As quantidades podem ser ajustadas individualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Data da Produção</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataProducao && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataProducao ? format(dataProducao, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100] pointer-events-auto" onInteractOutside={(e) => e.stopPropagation()}>
                <Calendar
                  mode="single"
                  selected={dataProducao}
                  onSelect={(d) => d && setDataProducao(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label>Turno</Label>
            <Select value={turno} onValueChange={setTurno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Matutino">Matutino</SelectItem>
                <SelectItem value="Vespertino">Vespertino</SelectItem>
                <SelectItem value="Noturno">Noturno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Aplicado a todos"
              className="resize-none h-10 min-h-10"
              rows={1}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 pb-1 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={todosSelecionados ? true : algumSelecionado ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              id="select-all-sugestoes"
            />
            <Label htmlFor="select-all-sugestoes" className="text-sm cursor-pointer">
              {selecionados.size} de {sugestoes.length} selecionados
            </Label>
          </div>
          <Badge variant="secondary">Total: {totalFormas} formas</Badge>
        </div>

        <ScrollArea className="flex-1 max-h-[40vh] pr-3">
          <div className="space-y-1.5">
            {sugestoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma sugestão elegível para agendamento.
              </div>
            ) : (
              sugestoes.map((s) => {
                const checked = selecionados.has(s.produto_id);
                const formas = formasAjustadas[s.produto_id] ?? s.formas_sugeridas;
                const unidades = Math.floor(formas * s.rendimento);
                return (
                  <div
                    key={s.produto_id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 border rounded-md transition-colors",
                      checked ? "bg-muted/40" : "opacity-70"
                    )}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleItem(s.produto_id)} />
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.produto_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Estoque {s.estoque_disponivel} → alvo {s.estoque_alvo} · {s.rendimento} un/forma
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        value={formas}
                        onChange={(e) => updateFormas(s.produto_id, parseInt(e.target.value, 10))}
                        disabled={!checked}
                        className="w-20 h-8 text-center text-sm"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">formas</span>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {unidades} un
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={submitting || selecionados.size === 0}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Agendando...</>
            ) : (
              <>Agendar {selecionados.size} {selecionados.size === 1 ? "produção" : "produções"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}