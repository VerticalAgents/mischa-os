
import { Card } from "@/components/ui/card";
import { useProporoesPadrao } from "@/hooks/useProporoesPadrao";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { Package } from "lucide-react";

interface ResumoQuantidadeProdutosProps {
  pedidos: any[];
}

export const ResumoQuantidadeProdutos = ({ pedidos }: ResumoQuantidadeProdutosProps) => {
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const { produtos } = useProdutoStore();
  
  // Calcular quantidades por produto
  const calcularQuantidadesTotais = async () => {
    const quantidadesPorProduto: { [nome: string]: number } = {};
    
    for (const pedido of pedidos) {
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
  
  React.useEffect(() => {
    const carregarQuantidades = async () => {
      const quantidades = await calcularQuantidadesTotais();
      setQuantidadesTotais(quantidades);
    };
    
    carregarQuantidades();
  }, [pedidos]);

  const totalGeral = Object.values(quantidadesTotais).reduce((sum, qty) => sum + qty, 0);
  const produtosComQuantidade = Object.entries(quantidadesTotais).filter(([_, qty]) => qty > 0);

  if (produtosComQuantidade.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Resumo de Produtos para Despacho</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          Total: {totalGeral} unidades
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {produtosComQuantidade.map(([nomeProduto, quantidade]) => (
          <div 
            key={nomeProduto}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 text-center"
          >
            <div className="font-medium text-sm text-gray-800 mb-1 truncate" title={nomeProduto}>
              {nomeProduto}
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {quantidade}
            </div>
            <div className="text-xs text-muted-foreground">unidades</div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-sm text-muted-foreground text-center">
        {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} • 
        {produtosComQuantidade.length} produto{produtosComQuantidade.length !== 1 ? 's' : ''}
      </div>
    </Card>
  );
};
