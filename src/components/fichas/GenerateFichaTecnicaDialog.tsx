import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText } from "lucide-react";
import { type Receita, type Ingrediente, scaleWithToppings } from "@/lib/scale-recipe-toppings";

type Props = { receitas: Receita[] };

export function GenerateFichaTecnicaDialog({ receitas }: Props) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [receitaId, setReceitaId] = React.useState<string>("");
  const [k, setK] = React.useState<number>(1);
  const selected = React.useMemo(() => receitas.find(r => String(r.id) === String(receitaId)) || null, [receitas, receitaId]);

  // estado de toppings: ids marcados e "peso por forma (g)" (default = quantidade base)
  const [toppingMap, setToppingMap] = React.useState<Record<string, { checked: boolean; perFormG?: number }>>({});

  React.useEffect(() => {
    // reset ao abrir/fechar
    if (!open) {
      setStep(1);
      setReceitaId("");
      setK(1);
      setToppingMap({});
    }
  }, [open]);

  React.useEffect(() => {
    // ao escolher receita, pre-carregar defaults
    if (selected) {
      const init: Record<string, { checked: boolean; perFormG?: number }> = {};
      selected.ingredientes.forEach(ing => {
        init[String(ing.id)] = { checked: false, perFormG: isGrams(ing.unidade) ? ing.quantidade : undefined };
      });
      setToppingMap(init);
    } else {
      setToppingMap({});
    }
  }, [selected]);

  function isGrams(unit?: string) {
    const u = (unit || "").toLowerCase();
    return u === "g" || u === "kg";
  }

  function next() {
    if (step === 1) {
      if (!selected) { alert("Selecione uma receita."); return; }
      if (!k || k <= 0) { alert("Multiplicador inválido."); return; }
      setStep(2);
    }
  }

  function prev() { setStep(1); }

  function handleGenerate() {
    if (!selected) { alert("Selecione uma receita."); return; }
    
    try {
      console.log('🚀 [DEBUG] Iniciando geração de ficha técnica...');
      
      const toppingIds = new Set<string>();
      const perFormOverrides: Record<string, number> = {};
      Object.entries(toppingMap).forEach(([id, cfg]) => {
        if (cfg.checked) {
          toppingIds.add(id);
          if (typeof cfg.perFormG === "number" && cfg.perFormG >= 0) {
            perFormOverrides[id] = cfg.perFormG;
          }
        }
      });

      console.log('📊 [DEBUG] Configurações dos toppings:', { toppingIds: Array.from(toppingIds), perFormOverrides });

      const payload = scaleWithToppings(selected, k, toppingIds, perFormOverrides);
      
      // Adicionar timestamp para controle de TTL
      const enrichedPayload = {
        ...payload,
        timestamp: Date.now(),
        generated_at: new Date().toISOString()
      };

      // Gerar chave única com UUID-like
      const payloadKey = `ficha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('💾 [DEBUG] Salvando payload no sessionStorage com key:', payloadKey);
      console.log('📦 [DEBUG] Payload completo:', enrichedPayload);
      
      sessionStorage.setItem(payloadKey, JSON.stringify(enrichedPayload));

      // Verificar se foi salvo corretamente
      const verificacao = sessionStorage.getItem(payloadKey);
      if (!verificacao) {
        throw new Error('Falha ao salvar dados no navegador');
      }

      console.log('✅ [DEBUG] Dados salvos com sucesso, abrindo preview...');
      const previewUrl = `/fichas-tecnicas/preview?key=${encodeURIComponent(payloadKey)}`;
      console.log('🔗 [DEBUG] URL do preview:', previewUrl);

      window.open(previewUrl, "_blank");
      setOpen(false);
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao gerar ficha técnica:', error);
      alert(`Erro ao gerar ficha técnica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar ficha técnica
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerar ficha técnica</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Receita</label>
              <Select onValueChange={setReceitaId} value={receitaId}>
                <SelectTrigger><SelectValue placeholder="Selecione a receita" /></SelectTrigger>
                <SelectContent>
                  {receitas.map(r => (<SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>))}
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
                  {[1,2,3,5,10].map(v => (<Button key={v} type="button" variant="outline" onClick={() => setK(v)}>{v}×</Button>))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">1× = receita base (1 forma). Ex.: 3× para três formas/rodadas.</p>
            </div>
          </div>
        )}

        {step === 2 && selected && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Marque os ingredientes que são TOPPINGS (não entram na batedeira) e defina o peso por forma (g)</div>
            <div className="max-h-80 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 w-10">Top</th>
                    <th className="text-left p-2">Ingrediente</th>
                    <th className="text-center p-2">Unid</th>
                    <th className="text-right p-2">Qtd base</th>
                    <th className="text-right p-2">Peso por forma (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.ingredientes.map((ing: Ingrediente) => {
                    const id = String(ing.id);
                    const cfg = toppingMap[id] ?? { checked: false, perFormG: undefined };
                    return (
                      <tr key={id} className="border-t">
                        <td className="p-2">
                          <Checkbox
                            checked={cfg.checked}
                            onCheckedChange={(v) => setToppingMap(m => ({ ...m, [id]: { ...m[id], checked: Boolean(v) }}))}
                          />
                        </td>
                        <td className="p-2">{ing.nome}</td>
                        <td className="p-2 text-center">{ing.unidade}</td>
                        <td className="p-2 text-right">{ing.quantidade}</td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            disabled={!cfg.checked}
                            value={cfg.perFormG ?? ""}
                            placeholder={isGrams(ing.unidade) ? String(ing.quantidade) : "—"}
                            onChange={(e) =>
                              setToppingMap(m => ({
                                ...m,
                                [id]: { ...m[id], perFormG: e.target.value === "" ? undefined : Number(e.target.value) }
                              }))
                            }
                            className="w-32"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Dica: para toppings em "un" (unidade), deixe "peso por forma" vazio — eles não entram nos somatórios de peso.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 2 && <Button variant="outline" onClick={prev}>Voltar</Button>}
          {step === 1 && <Button onClick={next}>Continuar</Button>}
          {step === 2 && <Button onClick={handleGenerate}>Gerar</Button>}
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}