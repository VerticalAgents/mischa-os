import { memo, useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Factory, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRendimentosReceitaProduto } from '@/hooks/useRendimentosReceitaProduto';
import { useMediaVendasSemanais } from '@/hooks/useMediaVendasSemanais';
import { useSupabaseProporoesPadrao } from '@/hooks/useSupabaseProporoesPadrao';
import { supabase } from '@/integrations/supabase/client';

interface ProdutoFinal {
  id: string;
  nome: string;
  estoque_atual: number | null;
}

const LoadingState = memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[150px] w-full" />
    </CardContent>
  </Card>
));

LoadingState.displayName = 'LoadingState';

export default function HomeSugestaoProducao() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<ProdutoFinal[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  
  const { obterRendimentoPorProduto, loading: loadingRendimentos } = useRendimentosReceitaProduto();
  const { mediaVendasPorProduto, loading: loadingMediaVendas } = useMediaVendasSemanais();
  const { proporcoes, loading: loadingProporcoes } = useSupabaseProporoesPadrao();

  useEffect(() => {
    const buscarProdutos = async () => {
      try {
        const { data, error } = await supabase
          .from('produtos_finais')
          .select('id, nome, estoque_atual')
          .eq('ativo', true);

        if (error) throw error;
        setProdutos(data || []);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoadingProdutos(false);
      }
    };

    buscarProdutos();
  }, []);

  const sugestoes = useMemo(() => {
    if (loadingRendimentos || loadingMediaVendas || loadingProdutos || loadingProporcoes) return null;

    const proporcoesMap = new Map(proporcoes.map(p => [p.produto_id, p.percentual]));

    const produtosComSugestao = produtos
      .filter(p => proporcoesMap.get(p.id) && proporcoesMap.get(p.id)! > 0)
      .map(produto => {
        const rendimentoInfo = obterRendimentoPorProduto(produto.id);
        const rendimento = rendimentoInfo?.rendimento || null;
        const mediaVendas = mediaVendasPorProduto[produto.id] || 0;
        const estoqueAtual = produto.estoque_atual || 0;
        const estoqueAlvo = Math.round(mediaVendas * 0.20);
        
        let quantidadeAProduzir = 0;
        if (estoqueAtual < 0) {
          quantidadeAProduzir = -estoqueAtual + estoqueAlvo;
        } else {
          quantidadeAProduzir = Math.max(0, estoqueAlvo - estoqueAtual);
        }

        const formasSugeridas = rendimento && quantidadeAProduzir > 0
          ? Math.ceil(quantidadeAProduzir / rendimento)
          : 0;

        return {
          id: produto.id,
          nome: produto.nome,
          formasSugeridas,
          quantidadeAProduzir,
          estoqueAtual
        };
      })
      .filter(p => p.formasSugeridas > 0)
      .sort((a, b) => b.formasSugeridas - a.formasSugeridas);

    const totalFormas = produtosComSugestao.reduce((acc, p) => acc + p.formasSugeridas, 0);
    const top5 = produtosComSugestao.slice(0, 5);

    return {
      totalFormas,
      totalProdutos: produtosComSugestao.length,
      top5
    };
  }, [produtos, obterRendimentoPorProduto, mediaVendasPorProduto, proporcoes, loadingRendimentos, loadingMediaVendas, loadingProdutos, loadingProporcoes]);

  const isLoading = loadingRendimentos || loadingMediaVendas || loadingProdutos || loadingProporcoes;

  if (isLoading) return <LoadingState />;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() => navigate('/pcp?tab=projecao')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Sugestão de Produção
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!sugestoes || sugestoes.totalFormas === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Factory className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Estoque em dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Total */}
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{sugestoes.totalFormas}</div>
              <div className="text-xs text-muted-foreground">
                formas sugeridas ({sugestoes.totalProdutos} produtos)
              </div>
            </div>

            {/* Top 5 */}
            <div className="space-y-1.5">
              {sugestoes.top5.map(produto => (
                <div 
                  key={produto.id} 
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground truncate max-w-[60%]">
                    {produto.nome}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {produto.formasSugeridas} formas
                  </Badge>
                </div>
              ))}
            </div>

            {/* Ver mais */}
            <div className="flex items-center justify-center text-xs text-primary pt-2 border-t">
              <span>Ver detalhes</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
