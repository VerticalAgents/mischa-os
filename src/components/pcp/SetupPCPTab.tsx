import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Info, Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useMediaVendasSemanais } from "@/hooks/useMediaVendasSemanais";
import { cn } from "@/lib/utils";

type Modo = "fixo" | "percentual" | "cobertura";

interface ProdutoAtivo {
  id: string;
  nome: string;
}

const MODOS: { id: Modo; titulo: string; descricao: string }[] = [
  {
    id: "fixo",
    titulo: "Fixo por produto",
    descricao: "Defino manualmente um alvo em unidades para cada produto.",
  },
  {
    id: "percentual",
    titulo: "% da média histórica",
    descricao: "Alvo varia conforme a média de vendas das últimas 12 semanas.",
  },
  {
    id: "cobertura",
    titulo: "Cobertura por dias",
    descricao: "Alvo = média semanal × dias / 7. Cobre os primeiros dias da semana.",
  },
];

export default function SetupPCPTab() {
  const { configuracoesProducao, atualizarConfiguracoesProducao } = useConfigStore();
  const { mediaVendasPorProduto } = useMediaVendasSemanais();

  const [modo, setModo] = useState<Modo>(configuracoesProducao?.estoqueAlvoModo ?? "cobertura");
  const [percentual, setPercentual] = useState<number>(configuracoesProducao?.estoqueAlvoPercentual ?? 20);
  const [coberturaDias, setCoberturaDias] = useState<number>(
    configuracoesProducao?.estoqueAlvoCoberturaDias ?? configuracoesProducao?.coberturaAlvoDias ?? 3
  );
  const [fixoPorProduto, setFixoPorProduto] = useState<Record<string, number>>(
    configuracoesProducao?.estoqueAlvoFixoPorProduto ?? {}
  );

  const [produtos, setProdutos] = useState<ProdutoAtivo[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        setLoadingProdutos(true);
        const { data, error } = await supabase
          .from("produtos_finais")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome");
        if (error) throw error;
        setProdutos(data || []);
      } catch (e) {
        console.error("Erro ao carregar produtos:", e);
      } finally {
        setLoadingProdutos(false);
      }
    };
    fetchProdutos();
  }, []);

  // Pré-visualização
  const mediaTotalSemanal = useMemo(
    () => Object.values(mediaVendasPorProduto).reduce((s, v) => s + (v || 0), 0),
    [mediaVendasPorProduto]
  );

  const previewAlvoTotal = useMemo(() => {
    if (modo === "fixo") {
      return Object.values(fixoPorProduto).reduce((s, v) => s + (Number(v) || 0), 0);
    }
    if (modo === "percentual") {
      return Math.round((mediaTotalSemanal * percentual) / 100);
    }
    return Math.round((mediaTotalSemanal * coberturaDias) / 7);
  }, [modo, percentual, coberturaDias, fixoPorProduto, mediaTotalSemanal]);

  const handleFixoChange = (produtoId: string, valor: string) => {
    const num = Math.max(0, parseInt(valor || "0", 10));
    setFixoPorProduto((prev) => ({ ...prev, [produtoId]: isNaN(num) ? 0 : num }));
  };

  const handleSalvar = () => {
    atualizarConfiguracoesProducao({
      ...(configuracoesProducao as any),
      estoqueAlvoModo: modo,
      estoqueAlvoPercentual: percentual,
      estoqueAlvoCoberturaDias: coberturaDias,
      estoqueAlvoFixoPorProduto: fixoPorProduto,
      coberturaAlvoDias: coberturaDias, // compat
    });
    toast({
      title: "Setup salvo",
      description: "O Estoque Alvo será aplicado na Sugestão de Produção.",
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure como o <strong>Estoque Alvo</strong> de cada produto é calculado. Esse alvo alimenta diretamente
          o card <strong>Sugestão de Produção</strong> no Dashboard.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Estoque Alvo</CardTitle>
          </div>
          <CardDescription>
            Selecione um dos três modos abaixo. Apenas o modo selecionado é aplicado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seletor de modos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MODOS.map((m) => {
              const ativo = modo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModo(m.id)}
                  className={cn(
                    "text-left rounded-lg border p-4 transition-colors",
                    ativo
                      ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <p className={cn("font-medium", ativo && "text-blue-600 dark:text-blue-400")}>{m.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.descricao}</p>
                </button>
              );
            })}
          </div>

          {/* Painel do modo selecionado */}
          {modo === "fixo" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Estoque alvo por produto (un)</Label>
                <span className="text-xs text-muted-foreground">
                  Total alvo: <strong className="text-foreground">{previewAlvoTotal} un</strong>
                </span>
              </div>
              <div className="border rounded-md divide-y max-h-[420px] overflow-y-auto">
                {loadingProdutos ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : produtos.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">Nenhum produto ativo.</p>
                ) : (
                  produtos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm flex-1 truncate">{p.nome}</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-28"
                        value={fixoPorProduto[p.id] ?? 0}
                        onChange={(e) => handleFixoChange(p.id, e.target.value)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {modo === "percentual" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <Label htmlFor="percentual">Percentual da média semanal (%)</Label>
                  <Input
                    id="percentual"
                    type="number"
                    min={0}
                    max={500}
                    value={percentual}
                    onChange={(e) => setPercentual(Math.max(0, Number(e.target.value)))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cálculo por produto: <code>média_semanal × {percentual}% </code>
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                  <p className="text-muted-foreground">Pré-visualização</p>
                  <p>Média total semanal: <strong>{Math.round(mediaTotalSemanal)} un</strong></p>
                  <p>Alvo total: <strong className="text-blue-600 dark:text-blue-400">{previewAlvoTotal} un</strong></p>
                </div>
              </div>
              <ProdutosAlvoLista
                produtos={produtos}
                loading={loadingProdutos}
                mediaVendasPorProduto={mediaVendasPorProduto}
                calcAlvo={(media) => Math.round((media * percentual) / 100)}
              />
            </div>
          )}

          {modo === "cobertura" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <Label htmlFor="dias">Cobertura alvo (dias)</Label>
                  <Input
                    id="dias"
                    type="number"
                    min={0}
                    max={14}
                    value={coberturaDias}
                    onChange={(e) => setCoberturaDias(Math.max(0, Number(e.target.value)))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Estoque com que a fábrica fecha na sexta. Recomendado: 3 dias (cobre seg/ter/qua).
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                  <p className="text-muted-foreground">Pré-visualização</p>
                  <p>Média total semanal: <strong>{Math.round(mediaTotalSemanal)} un</strong></p>
                  <p>
                    Alvo total para {coberturaDias} {coberturaDias === 1 ? "dia" : "dias"}:{" "}
                    <strong className="text-blue-600 dark:text-blue-400">{previewAlvoTotal} un</strong>
                  </p>
                </div>
              </div>
              <ProdutosAlvoLista
                produtos={produtos}
                loading={loadingProdutos}
                mediaVendasPorProduto={mediaVendasPorProduto}
                calcAlvo={(media) => Math.round((media * coberturaDias) / 7)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSalvar} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Setup
        </Button>
      </div>
    </div>
  );
}

interface ProdutosAlvoListaProps {
  produtos: ProdutoAtivo[];
  loading: boolean;
  mediaVendasPorProduto: Record<string, number>;
  calcAlvo: (media: number) => number;
}

function ProdutosAlvoLista({ produtos, loading, mediaVendasPorProduto, calcAlvo }: ProdutosAlvoListaProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">Alvo por produto</Label>
      <div className="border rounded-md max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : produtos.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">Nenhum produto ativo.</p>
        ) : (
          <table className="table-fixed w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2 w-1/2">Produto</th>
                <th className="text-right font-medium px-3 py-2 w-1/4">Média semanal</th>
                <th className="text-right font-medium px-3 py-2 w-1/4">Alvo (un)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {produtos.map((p) => {
                const media = mediaVendasPorProduto[p.id] ?? 0;
                const alvo = calcAlvo(media);
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2 truncate">{p.nome}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {Math.round(media)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-blue-600 dark:text-blue-400">
                      {alvo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}