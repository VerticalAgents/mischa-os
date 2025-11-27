import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Factory, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRendimentosReceitaProduto } from '@/hooks/useRendimentosReceitaProduto';
import { useMediaVendasSemanais } from '@/hooks/useMediaVendasSemanais';
import { useEstoqueDisponivel } from '@/hooks/useEstoqueDisponivel';

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
  
  // Usar useEstoqueDisponivel para ter o estoque calculado igual ao PCP
  const { produtos: produtosEstoque, loading: loadingEstoque } = useEstoqueDisponivel({});
  const { obterRendimentoPorProduto, loading: loadingRendimentos } = useRendimentosReceitaProduto();
  const { mediaVendasPorProduto, loading: loadingMediaVendas } = useMediaVendasSemanais();

  // Calcular sugestões usando a mesma lógica do PCP (sem filtro de proporção)
  const sugestoes = useMemo(() => {
    if (loadingRendimentos || loadingMediaVendas || loadingEstoque) return null;

    const produtosComSugestao = produtosEstoque
      .map(produto => {
        const rendimentoInfo = obterRendimentoPorProduto(produto.produto_id);
        const rendimento = rendimentoInfo?.rendimento || null;
        const tem_rendimento = !!rendimento && rendimento > 0;
        const mediaVendas = mediaVendasPorProduto[produto.produto_id] || 0;
        
        // Usar estoque_disponivel que já considera pedidos separados
        const estoqueDisponivel = produto.estoque_disponivel;
        
        // Estoque alvo = 20% da média de vendas das últimas 12 semanas
        const estoqueAlvo = Math.round(mediaVendas * 0.20);
        
        // Calcular quantidade a produzir (mesma lógica do PCP)
        let quantidadeBase = 0;
        let quantidadeEstoqueAlvo = 0;
        
        if (estoqueDisponivel < 0) {
          // Estoque negativo: cobrir déficit + atingir estoque alvo
          quantidadeBase = -estoqueDisponivel;
          quantidadeEstoqueAlvo = estoqueAlvo;
        } else {
          // Estoque positivo: só produzir o que falta para estoque alvo
          quantidadeBase = 0;
          quantidadeEstoqueAlvo = Math.max(0, estoqueAlvo - estoqueDisponivel);
        }
        
        const quantidadeAProduzir = quantidadeBase + quantidadeEstoqueAlvo;

        // Calcular formas sugeridas
        const formasSugeridas = tem_rendimento && quantidadeAProduzir > 0
          ? Math.ceil(quantidadeAProduzir / rendimento)
          : 0;

        return {
          id: produto.produto_id,
          nome: produto.produto_nome,
          formasSugeridas,
          quantidadeAProduzir,
          estoqueDisponivel,
          temRendimento: tem_rendimento,
          naoPrecisaProduzir: quantidadeAProduzir === 0
        };
      })
      // Filtrar produtos que precisam produção e têm rendimento
      .filter(p => p.formasSugeridas > 0)
      .sort((a, b) => b.formasSugeridas - a.formasSugeridas);

    const totalFormas = produtosComSugestao.reduce((acc, p) => acc + p.formasSugeridas, 0);
    
    // Contar produtos com estoque suficiente (não precisam produzir)
    const produtosComEstoqueSuficiente = produtosEstoque.filter(produto => {
      const rendimentoInfo = obterRendimentoPorProduto(produto.produto_id);
      const rendimento = rendimentoInfo?.rendimento || null;
      const mediaVendas = mediaVendasPorProduto[produto.produto_id] || 0;
      const estoqueDisponivel = produto.estoque_disponivel;
      const estoqueAlvo = Math.round(mediaVendas * 0.20);
      
      let quantidadeAProduzir = 0;
      if (estoqueDisponivel < 0) {
        quantidadeAProduzir = -estoqueDisponivel + estoqueAlvo;
      } else {
        quantidadeAProduzir = Math.max(0, estoqueAlvo - estoqueDisponivel);
      }
      
      return quantidadeAProduzir === 0 && rendimento && rendimento > 0;
    }).length;

    const top5 = produtosComSugestao.slice(0, 5);

    return {
      totalFormas,
      totalProdutos: produtosComSugestao.length,
      produtosComEstoqueSuficiente,
      top5
    };
  }, [produtosEstoque, obterRendimentoPorProduto, mediaVendasPorProduto, loadingRendimentos, loadingMediaVendas, loadingEstoque]);

  const isLoading = loadingRendimentos || loadingMediaVendas || loadingEstoque;

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
              {sugestoes.produtosComEstoqueSuficiente > 0 && (
                <Badge variant="outline" className="mt-2 text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                  {sugestoes.produtosComEstoqueSuficiente} com estoque suficiente
                </Badge>
              )}
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
