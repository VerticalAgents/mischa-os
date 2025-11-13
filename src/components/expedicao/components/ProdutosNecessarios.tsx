import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuantidadesSeparadas } from "@/hooks/useQuantidadesSeparadas";

interface ProdutosNecessariosProps {
  pedidosSeparados: any[];
  pedidosDespachados: any[];
}

export const ProdutosNecessarios = ({ pedidosSeparados, pedidosDespachados }: ProdutosNecessariosProps) => {
  const { quantidadesPorProduto, calculando } = useQuantidadesSeparadas(pedidosSeparados, pedidosDespachados);

  const totalGeral = Object.values(quantidadesPorProduto).reduce((sum, qty) => sum + qty, 0);

  if (calculando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            Produtos Necessários
          </CardTitle>
          <CardDescription>Calculando quantidades...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg border animate-pulse">
            <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-8 bg-muted-foreground/20 rounded mb-1"></div>
            <div className="h-6 bg-muted-foreground/20 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          Produtos Necessários
        </CardTitle>
        <CardDescription>
          Quantidades em processo de expedição
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-muted-foreground mb-1">
            Quantidade Total a Expedir
          </p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalGeral}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge variant="secondary">
              {pedidosSeparados.length} pedido{pedidosSeparados.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
