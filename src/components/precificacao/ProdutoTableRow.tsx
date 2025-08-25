
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Copy, Trash2 } from "lucide-react";
import { ProdutoOptimizado } from "@/hooks/useOptimizedProdutoData";

interface ProdutoTableRowProps {
  produto: ProdutoOptimizado;
  getNomeCategoria: (categoriaId?: number) => string;
  getNomeSubcategoria: (subcategoriaId?: number) => string;
  onEditar: (produto: ProdutoOptimizado) => void;
  onDuplicar: (produto: ProdutoOptimizado) => void;
  onRemover: (produtoId: string) => void;
  isLoadingAction: boolean;
}

export const ProdutoTableRow: React.FC<ProdutoTableRowProps> = ({
  produto,
  getNomeCategoria,
  getNomeSubcategoria,
  onEditar,
  onDuplicar,
  onRemover,
  isLoadingAction
}) => {
  const margemVariant = produto.margem_real > 20 
    ? "default" 
    : produto.margem_real > 10 
    ? "secondary" 
    : "destructive";

  return (
    <TableRow key={produto.id}>
      <TableCell className="font-medium">{produto.nome}</TableCell>
      <TableCell>
        <Badge variant="outline">
          {getNomeCategoria(produto.categoria_id)}
        </Badge>
      </TableCell>
      <TableCell>
        {getNomeSubcategoria(produto.subcategoria_id) ? (
          <Badge variant="secondary">
            {getNomeSubcategoria(produto.subcategoria_id)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        R$ {produto.custo_unitario_calculado.toFixed(2)}
      </TableCell>
      <TableCell>
        {produto.preco_venda ? `R$ ${produto.preco_venda.toFixed(2)}` : "-"}
      </TableCell>
      <TableCell>
        <Badge variant={margemVariant}>
          {produto.margem_real.toFixed(1)}%
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={produto.ativo ? "default" : "secondary"}>
          {produto.ativo ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicar(produto)}
            disabled={isLoadingAction}
            title="Duplicar produto"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditar(produto)}
            disabled={isLoadingAction}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemover(produto.id)}
            disabled={isLoadingAction}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
