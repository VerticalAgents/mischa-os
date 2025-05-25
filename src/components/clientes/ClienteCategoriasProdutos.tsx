
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useCategoriaStore } from "@/hooks/useCategoriaStore";

interface ClienteCategoriasProdutosProps {
  categoriasSelecionadas: number[];
  onChange: (categorias: number[]) => void;
}

export default function ClienteCategoriasProdutos({ 
  categoriasSelecionadas, 
  onChange 
}: ClienteCategoriasProdutosProps) {
  const { categorias } = useCategoriaStore();
  
  const handleCategoriaToggle = (categoriaId: number, checked: boolean) => {
    if (checked) {
      onChange([...categoriasSelecionadas, categoriaId]);
    } else {
      onChange(categoriasSelecionadas.filter(id => id !== categoriaId));
    }
  };

  const hasNoCategories = categoriasSelecionadas.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          Categorias de Produtos
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione quais categorias de produtos este cliente pode receber
        </p>
      </div>

      <div className="space-y-3">
        {categorias.map(categoria => (
          <div key={categoria.id} className="flex items-center space-x-2">
            <Checkbox
              id={`categoria-${categoria.id}`}
              checked={categoriasSelecionadas.includes(categoria.id)}
              onCheckedChange={(checked) => 
                handleCategoriaToggle(categoria.id, checked as boolean)
              }
            />
            <Label 
              htmlFor={`categoria-${categoria.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              {categoria.nome}
              {categoria.descricao && (
                <span className="text-muted-foreground ml-1">
                  - {categoria.descricao}
                </span>
              )}
            </Label>
          </div>
        ))}
      </div>

      {hasNoCategories && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠ Nenhuma categoria de produto atribuída a este cliente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
