import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Loader2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuantidadesSeparadas } from "@/hooks/useQuantidadesSeparadas";

interface ProdutosEmExpedicaoProps {
  pedidosSeparados: any[];
  pedidosDespachados: any[];
}

export const ProdutosEmExpedicao = ({ pedidosSeparados, pedidosDespachados }: ProdutosEmExpedicaoProps) => {
  const { quantidadesPorProduto, calculando } = useQuantidadesSeparadas(pedidosSeparados, pedidosDespachados);
  const [isOpen, setIsOpen] = useState(true);

  const totalGeral = Object.values(quantidadesPorProduto).reduce((sum, qty) => sum + qty, 0);
  const produtosComQuantidade = Object.entries(quantidadesPorProduto).filter(([_, qty]) => qty > 0);

  // Loading state
  if (calculando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            Produtos em Expedição
          </CardTitle>
          <CardDescription>Carregando resumo...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg border animate-pulse mb-4">
            <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-8 bg-muted-foreground/20 rounded mb-1"></div>
            <div className="h-6 bg-muted-foreground/20 rounded w-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-3 bg-muted animate-pulse">
                <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-8 bg-muted-foreground/20 rounded mb-1"></div>
                <div className="h-3 bg-muted-foreground/20 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (produtosComQuantidade.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Produtos em Expedição
          </CardTitle>
          <CardDescription>
            Detalhamento por produto em separação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8 italic">
            Nenhum produto em expedição
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          Produtos em Expedição
        </CardTitle>
        <CardDescription>
          Detalhamento por produto em separação
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Bloco azul de destaque com total */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            Total em Expedição
          </p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalGeral}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {pedidosSeparados.length} separado{pedidosSeparados.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary">
              {pedidosDespachados.length} despachado{pedidosDespachados.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary">
              {produtosComQuantidade.length} produto{produtosComQuantidade.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        
        {/* Collapsible com detalhes por produto */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              Detalhes por Produto
            </p>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {produtosComQuantidade.map(([nomeProduto, quantidade]) => (
                <div 
                  key={nomeProduto}
                  className="border rounded-lg p-3 text-center hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1 truncate" title={nomeProduto}>
                    {nomeProduto}
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {quantidade}
                  </div>
                  <div className="text-xs text-muted-foreground">unidades</div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
