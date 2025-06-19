
import { useState, useEffect } from "react";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CategoriasProdutoSelectorProps {
  value: number[];
  onChange: (categorias: number[]) => void;
}

export default function CategoriasProdutoSelector({ 
  value, 
  onChange 
}: CategoriasProdutoSelectorProps) {
  const { categorias } = useSupabaseCategoriasProduto();
  const [categoriasHabilitadas, setCategoriasHabilitadas] = useState<number[]>(value || []);

  useEffect(() => {
    setCategoriasHabilitadas(value || []);
  }, [value]);

  const handleCategoriaToggle = (categoriaId: number) => {
    const novasCategorias = categoriasHabilitadas.includes(categoriaId)
      ? categoriasHabilitadas.filter(id => id !== categoriaId)
      : [...categoriasHabilitadas, categoriaId];
    
    setCategoriasHabilitadas(novasCategorias);
    onChange(novasCategorias);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Categorias de Produtos Habilitadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoriasHabilitadas.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ⚠ Nenhuma categoria de produto atribuída a este cliente.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          {categorias.map((categoria) => (
            <div key={categoria.id} className="flex items-center space-x-2">
              <Checkbox
                id={`categoria-${categoria.id}`}
                checked={categoriasHabilitadas.includes(categoria.id)}
                onCheckedChange={() => handleCategoriaToggle(categoria.id)}
              />
              <label
                htmlFor={`categoria-${categoria.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {categoria.nome}
              </label>
              {categoria.descricao && (
                <span className="text-xs text-muted-foreground">
                  - {categoria.descricao}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {categorias.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria disponível no sistema.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
