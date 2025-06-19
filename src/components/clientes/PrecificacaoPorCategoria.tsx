
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

interface PrecificacaoPorCategoriaProps {
  categoriasHabilitadas: number[];
  clienteId?: string;
  onPrecosChange: (precos: { categoria_id: number; preco_unitario: number }[]) => void;
}

export default function PrecificacaoPorCategoria({
  categoriasHabilitadas,
  clienteId,
  onPrecosChange
}: PrecificacaoPorCategoriaProps) {
  const { categorias } = useSupabaseCategoriasProduto();
  const { precos, carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  const [precosLocal, setPrecosLocal] = useState<Record<number, number>>({});

  // Carregar preços existentes do cliente
  useEffect(() => {
    const carregarPrecos = async () => {
      if (clienteId) {
        try {
          const precosCarregados = await carregarPrecosPorCliente(clienteId);
          const precosMap: Record<number, number> = {};
          
          precosCarregados.forEach(preco => {
            precosMap[preco.categoria_id] = preco.preco_unitario;
          });
          
          setPrecosLocal(precosMap);
        } catch (error) {
          console.error('Erro ao carregar preços:', error);
        }
      }
    };

    carregarPrecos();
  }, [clienteId, carregarPrecosPorCliente]);

  // Notificar mudanças de preços para o componente pai
  useEffect(() => {
    const precosArray = Object.entries(precosLocal).map(([categoriaId, preco]) => ({
      categoria_id: Number(categoriaId),
      preco_unitario: preco
    }));
    
    onPrecosChange(precosArray);
  }, [precosLocal, onPrecosChange]);

  const handlePrecoChange = (categoriaId: number, valor: string) => {
    // Converter vírgula para ponto e validar número
    const valorFormatado = valor.replace(',', '.');
    const preco = parseFloat(valorFormatado) || 0;
    
    setPrecosLocal(prev => ({
      ...prev,
      [categoriaId]: preco
    }));
  };

  const formatarPrecoParaExibicao = (preco: number): string => {
    return preco.toFixed(2).replace('.', ',');
  };

  // Filtrar apenas categorias habilitadas
  const categoriasParaPrecificar = categorias.filter(cat => 
    categoriasHabilitadas.includes(cat.id)
  );

  // Não exibir se não houver categorias habilitadas
  if (categoriasParaPrecificar.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Precificação por Categoria
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure preços específicos para cada categoria habilitada
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CHANGELOG: [x] Bloco visual renderizado, [ ] Conexão com Supabase concluída, [ ] Página de projeção criada */}
        {categoriasParaPrecificar.map((categoria) => (
          <div key={categoria.id} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {categoria.nome}
                </Badge>
                {categoria.descricao && (
                  <span className="text-xs text-muted-foreground">
                    {categoria.descricao}
                  </span>
                )}
              </div>
            </div>
            <div className="w-32">
              <Label htmlFor={`preco-${categoria.id}`} className="text-xs">
                Preço Unitário
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id={`preco-${categoria.id}`}
                  type="text"
                  placeholder="0,00"
                  value={precosLocal[categoria.id] ? formatarPrecoParaExibicao(precosLocal[categoria.id]) : ''}
                  onChange={(e) => handlePrecoChange(categoria.id, e.target.value)}
                  className="pl-10 text-right"
                />
              </div>
            </div>
          </div>
        ))}
        
        <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
          💡 Os preços configurados aqui serão usados para cálculos de projeção de resultados específicos deste cliente.
        </div>
      </CardContent>
    </Card>
  );
}
