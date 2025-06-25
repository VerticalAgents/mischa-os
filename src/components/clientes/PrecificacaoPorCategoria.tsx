
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Função para definir valores padrão
  const definirValoresPadrao = (categoriasIds: number[]) => {
    const precosIniciais: Record<number, number> = {};
    categoriasIds.forEach(categoriaId => {
      const categoria = categorias.find(cat => cat.id === categoriaId);
      if (categoria && categoria.nome.toLowerCase().includes('revenda padrão')) {
        precosIniciais[categoriaId] = 4.50;
      } else {
        precosIniciais[categoriaId] = 0;
      }
    });
    return precosIniciais;
  };

  // Carregar preços existentes do cliente
  useEffect(() => {
    const carregarPrecos = async () => {
      if (clienteId && categoriasHabilitadas.length > 0) {
        try {
          console.log('PrecificacaoPorCategoria: Carregando preços para cliente:', clienteId);
          const precosCarregados = await carregarPrecosPorCliente(clienteId);
          
          // Criar mapa de preços carregados
          const precosMap: Record<number, number> = {};
          precosCarregados.forEach(preco => {
            precosMap[preco.categoria_id] = preco.preco_unitario;
          });
          
          // Definir valores padrão para categorias sem preços definidos
          const precosCompletos = definirValoresPadrao(categoriasHabilitadas);
          
          // Sobrescrever com preços carregados onde existirem
          categoriasHabilitadas.forEach(categoriaId => {
            if (precosMap[categoriaId] !== undefined) {
              precosCompletos[categoriaId] = precosMap[categoriaId];
            }
          });
          
          console.log('PrecificacaoPorCategoria: Preços finais:', precosCompletos);
          setPrecosLocal(precosCompletos);
          setIsLoaded(true);
        } catch (error) {
          console.error('PrecificacaoPorCategoria: Erro ao carregar preços:', error);
          // Em caso de erro, usar valores padrão
          setPrecosLocal(definirValoresPadrao(categoriasHabilitadas));
          setIsLoaded(true);
        }
      } else if (categoriasHabilitadas.length > 0) {
        // Para novo cliente ou sem ID, definir valores padrão
        console.log('PrecificacaoPorCategoria: Definindo valores padrão para novo cliente');
        setPrecosLocal(definirValoresPadrao(categoriasHabilitadas));
        setIsLoaded(true);
      } else {
        // Limpar quando não há categorias
        setPrecosLocal({});
        setIsLoaded(true);
      }
    };

    // Reset no carregamento quando mudam as dependências
    setIsLoaded(false);
    carregarPrecos();
  }, [clienteId, carregarPrecosPorCliente, categoriasHabilitadas, categorias]);

  // Atualizar preços quando categorias habilitadas mudarem
  useEffect(() => {
    if (isLoaded) {
      setPrecosLocal(prev => {
        const novosPrecosLocal = { ...prev };
        
        // Adicionar preços para novas categorias habilitadas
        categoriasHabilitadas.forEach(categoriaId => {
          if (!(categoriaId in novosPrecosLocal)) {
            const categoria = categorias.find(cat => cat.id === categoriaId);
            if (categoria && categoria.nome.toLowerCase().includes('revenda padrão')) {
              novosPrecosLocal[categoriaId] = 4.50;
            } else {
              novosPrecosLocal[categoriaId] = 0;
            }
          }
        });
        
        // Remover preços de categorias não habilitadas
        Object.keys(novosPrecosLocal).forEach(categoriaIdStr => {
          const categoriaId = Number(categoriaIdStr);
          if (!categoriasHabilitadas.includes(categoriaId)) {
            delete novosPrecosLocal[categoriaId];
          }
        });
        
        return novosPrecosLocal;
      });
    }
  }, [categoriasHabilitadas, categorias, isLoaded]);

  // Notificar mudanças de preços para o componente pai
  useEffect(() => {
    if (isLoaded) {
      const precosArray = Object.entries(precosLocal).map(([categoriaId, preco]) => ({
        categoria_id: Number(categoriaId),
        preco_unitario: preco || 0
      }));
      
      console.log('PrecificacaoPorCategoria: Notificando mudanças de preços:', precosArray);
      onPrecosChange(precosArray);
    }
  }, [precosLocal, onPrecosChange, isLoaded]);

  const handlePrecoChange = (categoriaId: number, valor: string) => {
    // Remover caracteres não numéricos exceto vírgula e ponto
    const valorLimpo = valor.replace(/[^\d.,]/g, '');
    
    // Converter vírgula para ponto e validar número
    const valorFormatado = valorLimpo.replace(',', '.');
    const preco = parseFloat(valorFormatado);
    
    // Se não é um número válido, definir como 0
    const precoFinal = isNaN(preco) ? 0 : preco;
    
    console.log('PrecificacaoPorCategoria: Alterando preço da categoria', categoriaId, 'para', precoFinal);
    
    setPrecosLocal(prev => ({
      ...prev,
      [categoriaId]: precoFinal
    }));
  };

  const formatarPrecoParaExibicao = (preco: number): string => {
    if (preco === 0) return '';
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
                  value={formatarPrecoParaExibicao(precosLocal[categoria.id] || 0)}
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
