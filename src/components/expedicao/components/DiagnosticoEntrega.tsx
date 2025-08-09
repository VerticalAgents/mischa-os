
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  executarDiagnosticoCompleto, 
  verificarMovimentacoesEstoque,
  verificarSaldosProdutos 
} from '@/utils/stockDeductionUtils';
import { Search, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export const DiagnosticoEntrega = () => {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const executarDiagnostico = async () => {
    setLoading(true);
    try {
      const resultado = await executarDiagnosticoCompleto();
      setDiagnostico(resultado);
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Diagnóstico de Baixa Automática
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={executarDiagnostico}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Executando...' : 'Executar Diagnóstico'}
        </Button>

        {diagnostico && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostico.resumo.entregaTemItensComProdutoId)}
                <span className="text-sm">Itens com produto_id</span>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostico.resumo.houveBaixaAutomatica)}
                <span className="text-sm">Baixa automática executada</span>
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-medium mb-2">Última Entrega</h4>
              <div className="space-y-1 text-sm">
                <div><strong>ID:</strong> {diagnostico.ultimaEntrega.id}</div>
                <div><strong>Quantidade:</strong> {diagnostico.ultimaEntrega.quantidade}</div>
                <div><strong>Itens no histórico:</strong> {diagnostico.ultimaEntrega.itens.length}</div>
              </div>
              
              {diagnostico.ultimaEntrega.itens.length > 0 && (
                <div className="mt-2">
                  <strong>Itens:</strong>
                  <div className="ml-4 space-y-1">
                    {diagnostico.ultimaEntrega.itens.map((item: any, index: number) => (
                      <div key={index} className="text-xs">
                        {item.produto_nome} - {item.quantidade} unidades
                        {item.produto_id ? 
                          <Badge variant="secondary" className="ml-2">com ID</Badge> :
                          <Badge variant="destructive" className="ml-2">sem ID</Badge>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-medium mb-2">Movimentações de Estoque</h4>
              {diagnostico.movimentacoes.length > 0 ? (
                <div className="space-y-1">
                  {diagnostico.movimentacoes.map((mov: any, index: number) => (
                    <div key={index} className="text-sm">
                      Produto: {mov.produto_id} - Quantidade: {mov.quantidade} - Tipo: {mov.tipo}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Nenhuma movimentação encontrada para esta entrega
                </div>
              )}
            </div>

            {diagnostico.resumo.totalProdutosAtivos > 0 && (
              <div className="text-sm text-muted-foreground">
                {diagnostico.resumo.totalProdutosAtivos} produtos ativos encontrados no sistema
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
