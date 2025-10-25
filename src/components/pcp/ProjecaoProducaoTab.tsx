import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function ProjecaoProducaoTab() {
  const [incluirPrevistos, setIncluirPrevistos] = useState(false);
  const [loading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Dados mockados temporariamente
  const produtosOrdenados = useMemo(() => [], []);
  const quantidadeTotal = useMemo(() => 0, []);
  const agendamentosSemana: any[] = [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos Necessários
            </CardTitle>
            <CardDescription className="text-left">
              Quantidades para pedidos {incluirPrevistos ? "confirmados e previstos" : "confirmados"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="incluir-previstos" className="text-sm cursor-pointer whitespace-nowrap">
              Incluir previstos
            </Label>
            <Switch
              id="incluir-previstos"
              checked={incluirPrevistos}
              onCheckedChange={setIncluirPrevistos}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Calculando quantidades...</span>
          </div>
        ) : produtosOrdenados.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Nenhum pedido {incluirPrevistos ? "confirmado ou previsto" : "confirmado"} nesta semana
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Geral */}
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Quantidade Total Necessária</p>
              <p className="text-3xl font-bold text-primary">{quantidadeTotal}</p>
              <Badge variant="default" className="mt-2">
                {agendamentosSemana.length} {agendamentosSemana.length === 1 ? 'pedido' : 'pedidos'}
              </Badge>
            </div>

            {/* Produtos Individuais - Collapsible */}
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    {isDetailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                {produtosOrdenados.map((produto: any) => (
                  <div 
                    key={produto.produto_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{produto.produto_nome}</span>
                    </div>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {produto.quantidade}
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