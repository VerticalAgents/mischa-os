import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Plus, TrendingDown, BarChart3 } from "lucide-react";
import { ProdutoComEstoqueDetalhado } from "@/hooks/useEstoqueComExpedicao";
import { ProporcaoPadrao } from "@/hooks/useSupabaseProporoesPadrao";

interface CategoriaEstoqueGroupProps {
  categoria: {
    id: number;
    nome: string;
  };
  produtos: ProdutoComEstoqueDetalhado[];
  proporcoes: ProporcaoPadrao[];
  mostrarSaldoTotal: boolean;
  onEntradaRapida: (produtoId: string, quantidade: number) => void;
  onAbrirMovimentacao: (produto: any) => void;
  onAbrirBaixa: (produto: any) => void;
  onVerHistorico: (produtoId: string) => void;
  getStatusEstoque: (saldo: number) => { variant: "destructive" | "secondary" | "outline" | "default", label: string };
}

export default function CategoriaEstoqueGroup({
  categoria,
  produtos,
  proporcoes,
  mostrarSaldoTotal,
  onEntradaRapida,
  onAbrirMovimentacao,
  onAbrirBaixa,
  onVerHistorico,
  getStatusEstoque
}: CategoriaEstoqueGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filtrarPorProporcao, setFiltrarPorProporcao] = useState(true);

  // Filtrar produtos por proporção se for categoria "Revenda Padrão"
  const produtosFiltrados = useMemo(() => {
    if (categoria.nome === "Revenda Padrão" && filtrarPorProporcao) {
      return produtos.filter(p => {
        const proporcao = proporcoes.find(prop => prop.produto_id === p.id);
        return proporcao && proporcao.percentual > 0;
      });
    }
    return produtos;
  }, [produtos, proporcoes, categoria.nome, filtrarPorProporcao]);

  const isRevendaPadrao = categoria.nome === "Revenda Padrão";
  const produtosTotal = produtos.length;
  const produtosMostrados = produtosFiltrados.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            <h3 className="font-semibold text-lg">{categoria.nome}</h3>
            <Badge variant="outline">
              {isRevendaPadrao && filtrarPorProporcao && produtosMostrados !== produtosTotal
                ? `${produtosMostrados} de ${produtosTotal} produtos`
                : `${produtosMostrados} produtos`
              }
            </Badge>
          </div>
          
          {isRevendaPadrao && (
            <div 
              className="flex items-center gap-2 mr-2" 
              onClick={(e) => e.stopPropagation()}
            >
              <Switch 
                checked={filtrarPorProporcao}
                onCheckedChange={setFiltrarPorProporcao}
                id={`filtro-proporcao-${categoria.id}`}
              />
              <Label 
                htmlFor={`filtro-proporcao-${categoria.id}`} 
                className="text-sm cursor-pointer whitespace-nowrap"
              >
                Apenas proporção &gt; 0%
              </Label>
            </div>
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                {mostrarSaldoTotal && (
                  <TableHead className="text-center">Saldo Total</TableHead>
                )}
                <TableHead className="text-center">Saldo Real</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={mostrarSaldoTotal ? 5 : 4} className="text-center py-4 text-muted-foreground">
                    {isRevendaPadrao && filtrarPorProporcao
                      ? "Nenhum produto com proporção > 0% nesta categoria"
                      : "Nenhum produto nesta categoria"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                produtosFiltrados.map((produto) => {
                  const status = getStatusEstoque(produto.saldoReal);
                  
                  return (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div className="font-medium">{produto.nome}</div>
                      </TableCell>
                      {mostrarSaldoTotal && (
                        <TableCell className="text-center">
                          <span className="font-mono text-muted-foreground">{produto.saldoAtual}</span>
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <span className={`font-mono font-bold text-lg ${
                          status.variant === "destructive" ? "text-destructive" : "text-primary"
                        }`}>
                          {produto.saldoReal}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEntradaRapida(produto.id, 1)}
                            title="Entrada rápida (+1)"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAbrirBaixa(produto)}
                            disabled={produto.saldoReal <= 0}
                            title="Baixa de estoque"
                          >
                            <TrendingDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAbrirMovimentacao(produto)}
                            title="Nova movimentação"
                          >
                            Movimentar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onVerHistorico(produto.id)}
                            title="Ver histórico"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
