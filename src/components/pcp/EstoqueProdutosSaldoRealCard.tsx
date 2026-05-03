import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Boxes, Loader2, Package, ChevronDown, ChevronUp } from "lucide-react";
import { useEstoqueComExpedicao } from "@/hooks/useEstoqueComExpedicao";

export default function EstoqueProdutosSaldoRealCard() {
  const { produtos, loading } = useEstoqueComExpedicao();
  const [open, setOpen] = useState(false);

  const ativos = useMemo(
    () => produtos.filter((p) => p.ativo).sort((a, b) => a.nome.localeCompare(b.nome)),
    [produtos]
  );
  const totalReal = useMemo(
    () => ativos.reduce((s, p) => s + (Number(p.saldoReal) || 0), 0),
    [ativos]
  );

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            Estoque de Produtos
          </CardTitle>
          <CardDescription className="text-left">
            Saldo real (físico) por produto ativo
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando estoque...</span>
          </div>
        ) : ativos.length === 0 ? (
          <div className="text-center py-8">
            <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum produto ativo</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Saldo Real Total</p>
              <p className="text-3xl font-bold text-primary">
                {totalReal.toLocaleString("pt-BR")}
              </p>
              <Badge variant="default" className="mt-2">
                {ativos.length} {ativos.length === 1 ? "SKU" : "SKUs"}
              </Badge>
            </div>

            <Collapsible open={open} onOpenChange={setOpen}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                {ativos.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{p.nome}</span>
                    </div>
                    <Badge
                      variant={p.saldoReal <= 0 ? "destructive" : "secondary"}
                      className="text-base px-3 py-1 tabular-nums"
                    >
                      {p.saldoReal}
                    </Badge>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}