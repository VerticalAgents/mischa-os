
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bug, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClienteDebugInfo {
  cliente_id: string;
  cliente_nome: string;
  status: 'carregado' | 'filtrado' | 'erro' | 'sem_dados';
  motivo?: string;
  dados_originais?: any;
  dados_filtrados?: boolean;
}

interface DebugClientesCarregamentoProps {
  nomeAba: string;
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  filtrosAtivos?: any;
}

export function DebugClientesCarregamento({ 
  nomeAba, 
  dadosConsolidados, 
  filtrosAtivos 
}: DebugClientesCarregamentoProps) {
  const [debugInfo, setDebugInfo] = useState<ClienteDebugInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const analisarCarregamento = async () => {
    setLoading(true);
    setDebugInfo([]);
    
    try {
      console.log(`🔍 Iniciando análise de carregamento para aba: ${nomeAba}`);
      
      // 1. Buscar TODOS os clientes ativos do banco
      const { data: todosClientes, error } = await supabase
        .from('clientes')
        .select(`
          id,
          nome,
          status_cliente,
          ativo,
          representante_id,
          rota_entrega_id,
          categoria_estabelecimento_id,
          quantidade_padrao,
          periodicidade_padrao,
          meta_giro_semanal
        `)
        .eq('ativo', true);

      if (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        toast.error('Erro ao buscar clientes do banco');
        throw error;
      }

      console.log(`📊 Total de clientes ativos no banco: ${todosClientes?.length || 0}`);
      console.log(`📋 Clientes nos dados consolidados: ${dadosConsolidados.length}`);

      const resultados: ClienteDebugInfo[] = [];
      
      // 2. Verificar cada cliente do banco
      for (const cliente of todosClientes || []) {
        const clienteConsolidado = dadosConsolidados.find(c => c.cliente_id === cliente.id);
        
        if (clienteConsolidado) {
          // Cliente está presente
          resultados.push({
            cliente_id: cliente.id,
            cliente_nome: cliente.nome,
            status: 'carregado',
            dados_originais: cliente,
            dados_filtrados: false
          });
        } else {
          // Cliente não está presente - investigar por quê
          let motivo = 'Motivo desconhecido';
          
          if (cliente.status_cliente !== 'Ativo') {
            motivo = `Status inativo: ${cliente.status_cliente}`;
          } else if (!cliente.ativo) {
            motivo = 'Cliente marcado como inativo';
          } else if (!cliente.quantidade_padrao || !cliente.periodicidade_padrao) {
            motivo = 'Dados de periodicidade/quantidade não configurados';
          } else if (!cliente.meta_giro_semanal) {
            motivo = 'Meta de giro semanal não definida';
          } else {
            // Verificar se tem entregas nas últimas 4 semanas
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - 28);
            
            const { data: entregas } = await supabase
              .from('historico_entregas')
              .select('id')
              .eq('cliente_id', cliente.id)
              .eq('tipo', 'entrega')
              .gte('data', dataLimite.toISOString())
              .limit(1);
            
            if (!entregas || entregas.length === 0) {
              motivo = 'Nenhuma entrega nas últimas 4 semanas';
            } else {
              motivo = 'Erro na consolidação dos dados';
            }
          }
          
          resultados.push({
            cliente_id: cliente.id,
            cliente_nome: cliente.nome,
            status: 'filtrado',
            motivo,
            dados_originais: cliente
          });
        }
      }

      // 3. Verificar se o cliente específico "Bruno - Distribuidor" está presente
      const brunoDist = resultados.find(r => r.cliente_nome.toLowerCase().includes('bruno') && r.cliente_nome.toLowerCase().includes('distribuidor'));
      if (brunoDist) {
        console.log('🔍 Cliente "Bruno - Distribuidor" encontrado:', brunoDist);
      } else {
        console.log('⚠️ Cliente "Bruno - Distribuidor" não encontrado nos resultados');
      }

      // 4. Ordenar resultados: problemas primeiro
      resultados.sort((a, b) => {
        if (a.status === 'filtrado' && b.status === 'carregado') return -1;
        if (a.status === 'carregado' && b.status === 'filtrado') return 1;
        return a.cliente_nome.localeCompare(b.cliente_nome);
      });

      setDebugInfo(resultados);
      setShowDebug(true);
      
      const clientesComProblema = resultados.filter(r => r.status === 'filtrado').length;
      const clientesCarregados = resultados.filter(r => r.status === 'carregado').length;
      
      console.log(`✅ Análise concluída - Carregados: ${clientesCarregados}, Com problemas: ${clientesComProblema}`);
      toast.success(`Análise concluída: ${clientesCarregados} carregados, ${clientesComProblema} com problemas`);

    } catch (error) {
      console.error('❌ Erro na análise de carregamento:', error);
      toast.error('Erro ao analisar carregamento dos clientes');
    } finally {
      setLoading(false);
    }
  };

  const estatisticas = debugInfo.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug de Carregamento - {nomeAba}
            </span>
            <Button
              onClick={analisarCarregamento}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Analisando...' : 'Analisar Carregamento'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este debug analisa todos os clientes ativos e identifica por que alguns não aparecem nas tabelas desta aba.
          </p>
        </CardContent>
      </Card>

      {showDebug && debugInfo.length > 0 && (
        <div className="space-y-4">
          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{estatisticas.carregado || 0}</div>
                  <div className="text-sm text-muted-foreground">Carregados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{estatisticas.filtrado || 0}</div>
                  <div className="text-sm text-muted-foreground">Filtrados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{estatisticas.erro || 0}</div>
                  <div className="text-sm text-muted-foreground">Com Erro</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{debugInfo.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas para clientes com problemas */}
          {estatisticas.filtrado > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{estatisticas.filtrado} clientes</strong> não estão aparecendo nas tabelas desta aba. 
                Verifique os motivos na tabela abaixo.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabela de resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Dados Originais</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debugInfo.map((item) => (
                    <TableRow key={item.cliente_id}>
                      <TableCell className="font-medium">{item.cliente_nome}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            item.status === 'carregado' ? 'bg-green-100 text-green-800' :
                            item.status === 'filtrado' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {item.status === 'carregado' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {item.status === 'filtrado' && <XCircle className="h-3 w-3 mr-1" />}
                          {item.status === 'carregado' ? 'Carregado' : 
                           item.status === 'filtrado' ? 'Filtrado' : 'Erro'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.motivo || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          Status: {item.dados_originais?.status_cliente || 'N/A'}<br/>
                          Qtd: {item.dados_originais?.quantidade_padrao || 'N/A'}<br/>
                          Period: {item.dados_originais?.periodicidade_padrao || 'N/A'}<br/>
                          Meta: {item.dados_originais?.meta_giro_semanal || 'N/A'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
