import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Filter } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatarValor, UnidadeMedida, QuebraItem } from "@/hooks/useProducaoDashboard";

interface ProducaoQuebraCardProps {
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  itens: QuebraItem[];
  unidade: UnidadeMedida;
  mostrarCategoria?: boolean;
  toggleProporcao?: {
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
  };
  limite?: number;
}

export default function ProducaoQuebraCard({
  titulo,
  descricao,
  icon: Icon,
  itens,
  unidade,
  mostrarCategoria = false,
  toggleProporcao,
  limite,
}: ProducaoQuebraCardProps) {
  const lista = limite ? itens.slice(0, limite) : itens;

  return (
    // min-w-0: sem isso o cartao e um item de grid com largura minima "auto",
    // entao o nome do produto (que nao quebra linha, por causa do truncate) empurra
    // a coluna inteira e a pagina ganha rolagem lateral no celular.
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4 shrink-0" />
              {titulo}
            </CardTitle>
            <CardDescription className="text-left">{descricao}</CardDescription>
          </div>
          {toggleProporcao && (
            <div className="flex items-center gap-2 shrink-0">
              <Label
                htmlFor="filtro-proporcao"
                className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
              >
                <Filter className="h-3.5 w-3.5 inline mr-1" />
                Com proporção
              </Label>
              <Switch
                id="filtro-proporcao"
                checked={toggleProporcao.checked}
                onCheckedChange={toggleProporcao.onCheckedChange}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {lista.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum registro no período com os filtros aplicados
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map(item => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    {item.cor && (
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.cor }}
                      />
                    )}
                    <span className="text-sm font-medium truncate">{item.nome}</span>
                    {mostrarCategoria && item.categoriaNome && (
                      <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
                        {item.categoriaNome}
                      </Badge>
                    )}
                  </div>
                  {/* Colunas de largura fixa: sem isso o valor "desliza" de linha
                      para linha, porque a largura do badge muda com o percentual
                      ("7,7%" e "37,5%" nao ocupam o mesmo espaco). */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-[92px] text-right text-sm font-semibold tabular-nums">
                      {formatarValor(item.valor, unidade)}
                    </span>
                    <Badge
                      variant="secondary"
                      className="w-[52px] justify-center text-[11px] tabular-nums"
                    >
                      {item.percentual.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(item.percentual, 100)}%`,
                      backgroundColor: item.cor || 'hsl(var(--primary))',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
