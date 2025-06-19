
import { useState, useEffect } from 'react';
import { useSupabaseCategoriasProduto } from '@/hooks/useSupabaseCategoriasProduto';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PrecosPorCategoriaSelectorProps {
  categoriasHabilitadas: number[];
  precosIniciais?: { categoria_id: number; preco_unitario: number }[];
  onChange: (precos: { categoria_id: number; preco_unitario: number }[]) => void;
}

export default function PrecosPorCategoriaSelector({
  categoriasHabilitadas,
  precosIniciais = [],
  onChange
}: PrecosPorCategoriaSelectorProps) {
  const { categorias } = useSupabaseCategoriasProduto();
  const [precos, setPrecos] = useState<{ [key: number]: number }>({});

  // Inicializar preços com valores iniciais
  useEffect(() => {
    const precosMap: { [key: number]: number } = {};
    precosIniciais.forEach(preco => {
      precosMap[preco.categoria_id] = preco.preco_unitario;
    });
    setPrecos(precosMap);
  }, [precosIniciais]);

  // Notificar mudanças para o componente pai
  useEffect(() => {
    const precosArray = Object.entries(precos)
      .filter(([categoriaId, preco]) => categoriasHabilitadas.includes(Number(categoriaId)) && preco > 0)
      .map(([categoriaId, preco]) => ({
        categoria_id: Number(categoriaId),
        preco_unitario: preco
      }));
    onChange(precosArray);
  }, [precos, onChange, categoriasHabilitadas]);

  const handlePrecoChange = (categoriaId: number, valor: string) => {
    const preco = parseFloat(valor) || 0;
    setPrecos(prev => ({
      ...prev,
      [categoriaId]: preco
    }));
  };

  const categoriasEscolhidas = categorias.filter(cat => 
    categoriasHabilitadas.includes(cat.id)
  );

  if (categoriasEscolhidas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preços por Categoria</CardTitle>
          <CardDescription>
            Selecione pelo menos uma categoria de produto para definir preços personalizados
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Preços por Categoria</CardTitle>
        <CardDescription>
          Defina preços unitários específicos para cada categoria habilitada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoriasEscolhidas.map(categoria => (
          <div key={categoria.id} className="grid grid-cols-2 gap-4 items-center">
            <Label htmlFor={`preco-${categoria.id}`} className="text-sm">
              {categoria.nome}
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                id={`preco-${categoria.id}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={precos[categoria.id] || ''}
                onChange={(e) => handlePrecoChange(categoria.id, e.target.value)}
                className="text-right"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
