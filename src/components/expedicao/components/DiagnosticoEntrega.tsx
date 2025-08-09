
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  executarDiagnosticoCompleto, 
  verificarMovimentacoesEstoque,
  verificarSaldosProdutos,
  verificarObjetosBanco,
  verificarFeatureFlags
} from '@/utils/stockDeductionUtils';
import { Search, CheckCircle, AlertCircle, XCircle, Database, Flag } from 'lucide-react';

export const DiagnosticoEntrega = () => {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [objetosBanco, setObjetosBanco] = useState<any>(null);
  const [featureFlags, setFeatureFlags] = useState<any>(null);

  const executarDiagnosticoCompleto = async () => {
    setLoading(true);
    try {
      console.log('🔍 Executando diagnóstico completo...');
      
      // Verificar objetos do banco
      const objetos = await verificarObjetosBanco();
      setObjetosBanco(objetos);
      console.log('📊 Objetos do banco verificados:', objetos);

      // Verificar feature flags
      const flags = await verificarFeatureFlags();
      setFeatureFlags(flags);
      console.log('🚩 Feature flags verificadas:', flags);

      // Diagnóstico da última entrega
      const resultado = await executarDiagnosticoCompleto();
      setDiagnostico(resultado);
      console.log('📦 Diagnóstico da entrega:', resultado);
      
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Diagnóstico Completo - Baixa Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={executarDiagnosticoCompleto}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Executando diagnóstico...' : 'Executar Diagnóstico Completo'}
          </Button>

          {/* Status dos objetos do banco */}
          {objetosBanco && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4" />
                  Status dos Objetos do Banco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(objetosBanco.app_feature_flags)}
                    <span>Tabela app_feature_flags</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(objetosBanco.get_feature_flag)}
                    <span>Função get_feature_flag</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(objetosBanco.compute_entrega_itens)}
                    <span>Função compute_entrega_itens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(objetosBanco.process_entrega)}
                    <span>Função process_entrega</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(objetosBanco.trigger_process_entrega)}
                    <span>Função trigger_process_entrega</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(objetosBanco.after_insert_trigger)}
                    <span>Trigger after_insert</span>
                  </div>
                </div>
                
                {objetosBanco.constraint_unique && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                    ✅ Constraint única configurada: previne duplicação de movimentações
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status das feature flags */}
          {featureFlags && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flag className="h-4 w-4" />
                  Feature Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  {featureFlags.flags.map((flag: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{flag.flag_name}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(flag.enabled)}
                        <Badge variant={flag.enabled ? "default" : "secondary"}>
                          {flag.enabled ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnóstico da última entrega */}
          {diagnostico && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Última Entrega Processada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostico.resumo.entregaTemItensComProdutoId)}
                    <span className="text-sm">Itens com produto_id válido</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostico.resumo.houveBaixaAutomatica)}
                    <span className="text-sm">Baixa automática executada</span>
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="font-medium mb-2">Detalhes da Entrega</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>ID:</strong> {diagnostico.ultimaEntrega.id}</div>
                    <div><strong>Quantidade total:</strong> {diagnostico.ultimaEntrega.quantidade}</div>
                    <div><strong>Itens registrados:</strong> {diagnostico.ultimaEntrega.itens.length}</div>
                    <div><strong>Data:</strong> {new Date(diagnostico.ultimaEntrega.data).toLocaleString()}</div>
                  </div>
                  
                  {diagnostico.ultimaEntrega.itens.length > 0 && (
                    <div className="mt-2">
                      <strong>Itens detalhados:</strong>
                      <div className="ml-4 space-y-1">
                        {diagnostico.ultimaEntrega.itens.map((item: any, index: number) => (
                          <div key={index} className="text-xs flex items-center justify-between">
                            <span>{item.produto_nome || item.nome || 'Produto sem nome'} - {item.quantidade} unidades</span>
                            {item.produto_id ? 
                              <Badge variant="default" className="ml-2">ID: {item.produto_id.substring(0, 8)}...</Badge> :
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
                        <div key={index} className="text-sm p-2 bg-green-50 rounded">
                          <div><strong>Produto:</strong> {mov.produto_id.substring(0, 8)}...</div>
                          <div><strong>Quantidade:</strong> -{mov.quantidade} ({mov.tipo})</div>
                          <div><strong>Data:</strong> {new Date(mov.data_movimentacao).toLocaleString()}</div>
                          <div><strong>Observação:</strong> {mov.observacao}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-2 bg-yellow-50 rounded">
                      ⚠️ Nenhuma movimentação encontrada para esta entrega
                    </div>
                  )}
                </div>

                {diagnostico.resumo.totalProdutosAtivos > 0 && (
                  <div className="text-sm text-muted-foreground p-2 bg-blue-50 rounded">
                    📊 {diagnostico.resumo.totalProdutosAtivos} produtos ativos encontrados no sistema
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
