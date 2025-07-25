
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Database, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface PassoAPassoDebugProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
}

export function PassoAPassoDebug({ dadosConsolidados }: PassoAPassoDebugProps) {
  const [expandedCliente, setExpandedCliente] = useState<string | null>(null);

  const toggleExpanded = (clienteId: string) => {
    setExpandedCliente(expandedCliente === clienteId ? null : clienteId);
  };

  const calcularGiroProjetado = (item: DadosAnaliseGiroConsolidados): number => {
    if (!item.quantidade_padrao || !item.periodicidade_padrao) return 0;
    return Math.round((item.quantidade_padrao / item.periodicidade_padrao) * 7);
  };

  return (
    <div className="space-y-6">
      {/* Explicação geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Passo a Passo - Origem dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">1. Dados Consolidados (Materialized View)</h3>
              <p className="text-sm text-gray-700">
                Os dados vêm da tabela <code className="bg-gray-100 px-1 rounded">dados_analise_giro_materialized</code> 
                que é uma view materializada no Supabase que consolida informações de múltiplas tabelas.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">2. Giro Histórico</h3>
              <p className="text-sm text-gray-700">
                Campo <code className="bg-gray-100 px-1 rounded">giro_medio_historico</code> - 
                Calculado com base no histórico de entregas das últimas 4 semanas.
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">3. Giro Projetado</h3>
              <p className="text-sm text-gray-700">
                Calculado como: <code className="bg-gray-100 px-1 rounded">(quantidade_padrao / periodicidade_padrao) * 7</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de clientes com detalhes */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {dadosConsolidados.map((item) => {
                const giroProjetado = calcularGiroProjetado(item);
                const giroHistorico = item.giro_medio_historico;
                const diferenca = giroProjetado > 0 ? ((giroHistorico - giroProjetado) / giroProjetado) * 100 : 0;
                const isExpanded = expandedCliente === item.cliente_id;
                
                return (
                  <div key={item.cliente_id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(item.cliente_id)}
                          className="p-1 h-6 w-6"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <span className="font-medium">{item.cliente_nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Histórico: {giroHistorico.toFixed(1)}
                        </Badge>
                        <Badge variant="outline">
                          Projetado: {giroProjetado.toFixed(1)}
                        </Badge>
                        <Badge 
                          variant={diferenca >= -10 && diferenca <= 10 ? 'default' : 'destructive'}
                        >
                          {diferenca > 0 ? '+' : ''}{diferenca.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        <Separator />
                        
                        {/* Dados brutos */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              Dados Brutos (Banco)
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>ID:</strong> {item.cliente_id}</p>
                              <p><strong>Status:</strong> {item.status_cliente}</p>
                              <p><strong>Quantidade Padrão:</strong> {item.quantidade_padrao || 'N/A'}</p>
                              <p><strong>Periodicidade Padrão:</strong> {item.periodicidade_padrao || 'N/A'} dias</p>
                              <p><strong>Giro Médio Histórico:</strong> {item.giro_medio_historico}</p>
                              <p><strong>Giro Última Semana:</strong> {item.giro_ultima_semana}</p>
                              <p><strong>Desvio Padrão:</strong> {item.desvio_padrao_giro.toFixed(2)}</p>
                              <p><strong>Variação %:</strong> {item.variacao_percentual.toFixed(1)}%</p>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-3 rounded">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Calculator className="h-4 w-4" />
                              Cálculos Derivados
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Giro Projetado:</strong></p>
                              <p className="ml-2">({item.quantidade_padrao || 0} / {item.periodicidade_padrao || 0}) × 7</p>
                              <p className="ml-2">= {giroProjetado.toFixed(1)} unidades/semana</p>
                              
                              <p className="mt-2"><strong>Diferença:</strong></p>
                              <p className="ml-2">({giroHistorico} - {giroProjetado}) / {giroProjetado} × 100</p>
                              <p className="ml-2">= {diferenca.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Análise */}
                        <div className="bg-yellow-50 p-3 rounded">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Análise
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Semáforo:</strong> 
                              <Badge 
                                variant={item.semaforo_performance === 'verde' ? 'default' : 'destructive'}
                                className="ml-2"
                              >
                                {item.semaforo_performance}
                              </Badge>
                            </p>
                            <p><strong>Achievement Meta:</strong> {item.achievement_meta.toFixed(1)}%</p>
                            <p><strong>Faturamento Semanal Previsto:</strong> R$ {item.faturamento_semanal_previsto.toFixed(2)}</p>
                            <p><strong>Data Consolidação:</strong> {new Date(item.data_consolidacao).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Alertas */}
                        {(Math.abs(diferenca) > 50) && (
                          <div className="bg-red-50 p-3 rounded border border-red-200">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-700">
                              <AlertCircle className="h-4 w-4" />
                              Possíveis Problemas
                            </h4>
                            <div className="space-y-1 text-sm text-red-700">
                              {diferenca > 50 && (
                                <p>• Giro histórico muito acima do projetado - verificar se há entregas extras não planejadas</p>
                              )}
                              {diferenca < -50 && (
                                <p>• Giro histórico muito abaixo do projetado - verificar se há entregas em atraso ou canceladas</p>
                              )}
                              {!item.quantidade_padrao && (
                                <p>• Quantidade padrão não definida - cliente pode estar mal configurado</p>
                              )}
                              {!item.periodicidade_padrao && (
                                <p>• Periodicidade padrão não definida - cliente pode estar mal configurado</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
