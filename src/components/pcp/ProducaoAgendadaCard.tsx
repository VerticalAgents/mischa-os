import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Factory, Loader2, ChevronDown, ChevronUp, Package, Plus } from "lucide-react";

interface ProducaoAgendadaItem {
  produto_id: string;
  produto_nome: string;
  unidades: number;
  registros: number;
}

interface ProducaoAgendadaCardProps {
  produtos: ProducaoAgendadaItem[];
  totalUnidades: number;
  totalRegistros: number;
  loading: boolean;
  onNovaProducao?: () => void;
}

export default function ProducaoAgendadaCard({ produtos, totalUnidades, totalRegistros, loading, onNovaProducao }: ProducaoAgendadaCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
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
        ) : produtos.length === 0 ? (
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
                {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'}
              </Badge>
            </div>

            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                {produtos.map((produto) => (
                  <div
                    key={produto.produto_id || produto.produto_nome}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{produto.produto_nome}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {produto.registros} {produto.registros === 1 ? 'registro' : 'registros'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {produto.unidades}
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
