import React from "react";
import { Card } from "@/components/ui/card";
import { useProporoesPadrao } from "@/hooks/useProporoesPadrao";
import { useEstoqueProdutos } from "@/hooks/useEstoqueProdutos";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { Package, AlertTriangle, Loader2 } from "lucide-react";

interface ResumoQuantidadeProdutosProps {
  pedidos: any[];
}

export const ResumoQuantidadeProdutos = ({ pedidos }: ResumoQuantidadeProdutosProps) => {
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const { produtos, loading: loadingEstoque, obterProdutoPorNome } = useEstoqueProdutos();
  const { pedidos: todosPedidos } = useExpedicaoStore();
  
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

  // Calcular quantidades separadas (pedidos separados + despachados)
  const calcularQuantidadesSeparadas = async () => {
    const quantidadesSeparadas: { [nome: string]: number } = {};
    
    // Filtrar pedidos que estão separados ou despachados
    const pedidosSeparados = todosPedidos.filter(pedido => 
      pedido.substatus_pedido === 'Separado' || pedido.substatus_pedido === 'Despachado'
    );
    
    for (const pedido of pedidosSeparados) {
      if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados?.length > 0) {
        pedido.itens_personalizados.forEach((item: any) => {
          const nomeProduto = item.produto || item.nome || 'Produto desconhecido';
          quantidadesSeparadas[nomeProduto] = (quantidadesSeparadas[nomeProduto] || 0) + item.quantidade;
        });
      } else {
        try {
          const quantidadesProporcao = await calcularQuantidadesPorProporcao(pedido.quantidade_total);
          quantidadesProporcao.forEach(item => {
            quantidadesSeparadas[item.produto] = (quantidadesSeparadas[item.produto] || 0) + item.quantidade;
          });
        } catch (error) {
          console.warn('Erro ao calcular proporções para pedido separado:', pedido.id, error);
          
          const produtosAtivos = produtos.filter(p => p.ativo);
          if (produtosAtivos.length > 0) {
            const quantidadePorProduto = Math.floor(pedido.quantidade_total / produtosAtivos.length);
            const resto = pedido.quantidade_total % produtosAtivos.length;
            
            produtosAtivos.forEach((produto, index) => {
              const quantidade = quantidadePorProduto + (index < resto ? 1 : 0);
              quantidadesSeparadas[produto.nome] = (quantidadesSeparadas[produto.nome] || 0) + quantidade;
            });
          }
        }
      }
    }
    
    return quantidadesSeparadas;
  };

  const [quantidadesTotais, setQuantidadesTotais] = React.useState<{ [nome: string]: number }>({});
  const [quantidadesSeparadas, setQuantidadesSeparadas] = React.useState<{ [nome: string]: number }>({});
  const [calculando, setCalculando] = React.useState(true);
  
  React.useEffect(() => {
    const carregarQuantidades = async () => {
      if (loadingEstoque) return; // Aguardar estoque carregar
      
      setCalculando(true);
      try {
        const [quantidades, quantidadesSep] = await Promise.all([
          calcularQuantidadesTotais(),
          calcularQuantidadesSeparadas()
        ]);
        setQuantidadesTotais(quantidades);
        setQuantidadesSeparadas(quantidadesSep);
      } catch (error) {
        console.error('Erro ao calcular quantidades:', error);
      } finally {
        setCalculando(false);
      }
    };
    
    carregarQuantidades();
  }, [pedidos, loadingEstoque, produtos, todosPedidos]);

  // Verificar estoque disponível para cada produto
  const verificarEstoque = (nomeProduto: string, quantidadeNecessaria: number, quantidadeSeparada: number) => {
    const produto = obterProdutoPorNome(nomeProduto);
    if (!produto) return { temEstoque: false, estoqueDisponivel: 0 };
    
    const estoqueAtual = produto.estoque_atual || 0;
    const estoqueDisponivel = estoqueAtual - quantidadeSeparada;
    
    return {
      temEstoque: estoqueDisponivel >= quantidadeNecessaria,
      estoqueDisponivel: Math.max(0, estoqueDisponivel) // Não mostrar valores negativos
    };
  };

  const totalGeral = Object.values(quantidadesTotais).reduce((sum, qty) => sum + qty, 0);
  const produtosComQuantidade = Object.entries(quantidadesTotais).filter(([_, qty]) => qty > 0);

  // Verificar se há produtos com estoque insuficiente
  const produtosSemEstoque = produtosComQuantidade.filter(([nomeProduto, quantidade]) => {
    const quantidadeSeparada = quantidadesSeparadas[nomeProduto] || 0;
    const { temEstoque } = verificarEstoque(nomeProduto, quantidade, quantidadeSeparada);
    return !temEstoque;
  });

  // Loading state
  if (loadingEstoque || calculando) {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <h3 className="text-lg font-semibold">Carregando resumo de produtos...</h3>
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
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Resumo de Produtos para Despacho</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          Total: {totalGeral} unidades
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {produtosComQuantidade.map(([nomeProduto, quantidade]) => {
          const quantidadeSeparada = quantidadesSeparadas[nomeProduto] || 0;
          const { temEstoque, estoqueDisponivel } = verificarEstoque(nomeProduto, quantidade, quantidadeSeparada);
          
          return (
            <div 
              key={nomeProduto}
              className={`border rounded-lg p-3 text-center ${
                temEstoque 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                  : 'bg-gradient-to-r from-red-100 to-red-200 border-red-400'
              }`}
            >
              <div className="font-medium text-sm text-gray-800 mb-1 truncate" title={nomeProduto}>
                {nomeProduto}
              </div>
              <div className={`text-2xl font-bold ${
                temEstoque ? 'text-blue-700' : 'text-red-800'
              }`}>
                {quantidade}
              </div>
              <div className="text-xs text-muted-foreground">unidades</div>
              
              <div className={`mt-2 flex items-center justify-center gap-1 text-xs ${
                temEstoque ? 'text-green-700' : 'text-red-700'
              }`}>
                {!temEstoque && <AlertTriangle className="h-3 w-3" />}
                <span>Estoque: {estoqueDisponivel}</span>
              </div>
              
              <div className="mt-1 flex items-center justify-center text-xs text-gray-600">
                <span>Separado: {quantidadeSeparada}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {produtosSemEstoque.length > 0 && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Atenção: Estoque insuficiente
          </div>
          <div className="text-xs text-red-700 mt-1">
            {produtosSemEstoque.length === 1 
              ? `O produto ${produtosSemEstoque[0][0]} não possui estoque suficiente.`
              : `${produtosSemEstoque.length} produtos não possuem estoque suficiente.`
            }
          </div>
        </div>
      )}
      
      <div className="mt-3 text-sm text-muted-foreground text-center">
        {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} • 
        {produtosComQuantidade.length} produto{produtosComQuantidade.length !== 1 ? 's' : ''}
      </div>
    </Card>
  );
};
