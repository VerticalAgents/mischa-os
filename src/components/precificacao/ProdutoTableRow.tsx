
import React, { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Copy, Trash2 } from "lucide-react";
import { ProdutoOptimizado } from "@/hooks/useOptimizedProdutoData";

interface ProdutoTableRowProps {
  produto: ProdutoOptimizado;
  getNomeCategoria: (categoriaId?: number) => string;
  getNomeSubcategoria: (subcategoriaId?: number) => string;
  onEditar: (produto: ProdutoOptimizado) => void;
  onDuplicar: (produto: ProdutoOptimizado) => void;
  onRemover: (produtoId: string) => void;
  onAtualizarOrdem: (produtoId: string, novaOrdem: number | null) => void;
  isLoadingAction: boolean;
}

export const ProdutoTableRow: React.FC<ProdutoTableRowProps> = ({
  produto,
  getNomeCategoria,
  getNomeSubcategoria,
  onEditar,
  onDuplicar,
  onRemover,
  onAtualizarOrdem,
  isLoadingAction
}) => {
  const [ordemLocal, setOrdemLocal] = useState<string>(
    produto.ordem_categoria?.toString() || ""
  );

  const margemVariant = produto.margem_real > 20 
    ? "default" 
    : produto.margem_real > 10 
    ? "secondary" 
    : "destructive";

  const handleOrdemBlur = () => {
    const valorNumerico = ordemLocal.trim() === "" ? null : parseInt(ordemLocal);
    if (valorNumerico !== null && (isNaN(valorNumerico) || valorNumerico < 1)) {
      setOrdemLocal(produto.ordem_categoria?.toString() || "");
      return;
    }
    if (valorNumerico !== produto.ordem_categoria) {
      onAtualizarOrdem(produto.id, valorNumerico);
    }
  };

  const handleOrdemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <TableRow key={produto.id}>
      <TableCell className="w-[60px] text-center text-muted-foreground">
        {produto.gestaoclick_produto_id || "-"}
      </TableCell>
      <TableCell className="w-[80px]">
        <Input
          type="text"
          value={ordemLocal}
          onChange={(e) => setOrdemLocal(e.target.value)}
          onBlur={handleOrdemBlur}
          onKeyDown={handleOrdemKeyDown}
          placeholder="-"
          className="w-[60px] h-8 text-center"
          disabled={isLoadingAction}
        />
      </TableCell>
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
