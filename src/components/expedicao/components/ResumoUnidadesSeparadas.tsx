
import React from "react";
import { Card } from "@/components/ui/card";
import { useProporoesPadrao } from "@/hooks/useProporoesPadrao";
import { useEstoqueProdutos } from "@/hooks/useEstoqueProdutos";
import { Package, Loader2 } from "lucide-react";

interface ResumoUnidadesSeparadasProps {
  pedidosSeparados: any[];
  pedidosDespachados: any[];
}

export const ResumoUnidadesSeparadas = ({ pedidosSeparados, pedidosDespachados }: ResumoUnidadesSeparadasProps) => {
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const { produtos, loading: loadingEstoque, obterProdutoPorNome } = useEstoqueProdutos();
  
  // Combinar todos os pedidos (separados + despachados)
  const todosPedidos = [...pedidosSeparados, ...pedidosDespachados];
  
  // Calcular quantidades por produto
  const calcularQuantidadesTotais = async () => {
    const quantidadesPorProduto: { [nome: string]: number } = {};
    
    for (const pedido of todosPedidos) {
      if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados?.length > 0) {
        // Pedido alterado - usar itens personalizados
        pedido.itens_personalizados.forEach((item: any) => {
          const nomeProduto = item.produto || item.nome || 'Produto desconhecido';
          quantidadesPorProduto[nomeProduto] = (quantidadesPorProduto[nomeProduto] || 0) + item.quantidade;
        });
      } else {
        // Pedido padrão - usar proporções cadastradas
        try {
          const quantidadesProporcao = await calcularQuantidadesPorProporcao(pedido.quantidade_total);
          quantidadesProporcao.forEach(item => {
            quantidadesPorProduto[item.produto] = (quantidadesPorProduto[item.produto] || 0) + item.quantidade;
          });
        } catch (error) {
          console.warn('Erro ao calcular proporções para pedido:', pedido.id, error);
          
          // Fallback: distribuir igualmente entre produtos ativos
          const produtosAtivos = produtos.filter(p => p.ativo);
          if (produtosAtivos.length > 0) {
            const quantidadePorProduto = Math.floor(pedido.quantidade_total / produtosAtivos.length);
            const resto = pedido.quantidade_total % produtosAtivos.length;
            
            produtosAtivos.forEach((produto, index) => {
              const quantidade = quantidadePorProduto + (index < resto ? 1 : 0);
              quantidadesPorProduto[produto.nome] = (quantidadesPorProduto[produto.nome] || 0) + quantidade;
            });
          }
        }
      }
    }
    
    return quantidadesPorProduto;
  };

  const [quantidadesTotais, setQuantidadesTotais] = React.useState<{ [nome: string]: number }>({});
  const [calculando, setCalculando] = React.useState(true);
  
  React.useEffect(() => {
    const carregarQuantidades = async () => {
      if (loadingEstoque) return; // Aguardar estoque carregar
      
      setCalculando(true);
      try {
        const quantidades = await calcularQuantidadesTotais();
        setQuantidadesTotais(quantidades);
      } catch (error) {
        console.error('Erro ao calcular quantidades:', error);
      } finally {
        setCalculando(false);
      }
    };
    
    carregarQuantidades();
  }, [pedidosSeparados, pedidosDespachados, loadingEstoque, produtos]);

  const totalGeral = Object.values(quantidadesTotais).reduce((sum, qty) => sum + qty, 0);
  const produtosComQuantidade = Object.entries(quantidadesTotais).filter(([_, qty]) => qty > 0);

  // Loading state
  if (loadingEstoque || calculando) {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <h3 className="text-lg font-semibold">Carregando resumo de unidades separadas...</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg p-3 text-center bg-gray-100 animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (produtosComQuantidade.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Resumo de Unidades Separadas</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          Total: {totalGeral} unidades
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {produtosComQuantidade.map(([nomeProduto, quantidade]) => (
          <div 
            key={nomeProduto}
            className="border rounded-lg p-3 text-center bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
          >
            <div className="font-medium text-sm text-gray-800 mb-1 truncate" title={nomeProduto}>
              {nomeProduto}
            </div>
            <div className="text-2xl font-bold text-green-700">
              {quantidade}
            </div>
            <div className="text-xs text-muted-foreground">unidades</div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-sm text-muted-foreground text-center">
        {pedidosSeparados.length} separado{pedidosSeparados.length !== 1 ? 's' : ''} • 
        {pedidosDespachados.length} despachado{pedidosDespachados.length !== 1 ? 's' : ''} • 
        {produtosComQuantidade.length} produto{produtosComQuantidade.length !== 1 ? 's' : ''}
      </div>
    </Card>
  );
};
