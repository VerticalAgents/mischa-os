
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, AlertTriangle, CheckCircle, Calculator, Database } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface EntregaDetalhada {
  id: string;
  data: string;
  quantidade: number;
  tipo: string;
}

interface PassoAPassoData {
  cliente: DadosAnaliseGiroConsolidados;
  entregas4Semanas: EntregaDetalhada[];
  giroHistoricoCalculado: number;
  giroProjetado: number;
  metaGiroSemanal: number;
  achievement: number;
  semaforo: 'verde' | 'amarelo' | 'vermelho';
  alertas: string[];
}

interface PassoAPassoDebugProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
}

export function PassoAPassoDebug({ dadosConsolidados }: PassoAPassoDebugProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [dadosDebug, setDadosDebug] = useState<PassoAPassoData | null>(null);
  const [loading, setLoading] = useState(false);

  const clientesFiltrados = dadosConsolidados.filter(cliente => 
    cliente.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const analisarCliente = async (clienteId: string) => {
    setLoading(true);
    setDadosDebug(null); // Limpar dados anteriores
    
    try {
      console.log('🔍 Iniciando análise do cliente:', clienteId);
      
      const cliente = dadosConsolidados.find(c => c.cliente_id === clienteId);
      if (!cliente) {
        toast.error('Cliente não encontrado');
        return;
      }

      console.log('✅ Cliente encontrado:', cliente.cliente_nome);

      // 1. Buscar entregas das últimas 4 semanas (28 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 28);
      
      console.log('📅 Buscando entregas desde:', dataLimite.toISOString());

      const { data: entregas, error } = await supabase
        .from('historico_entregas')
        .select('id, data, quantidade, tipo')
        .eq('cliente_id', clienteId)
        .eq('tipo', 'entrega')
        .gte('data', dataLimite.toISOString())
        .order('data', { ascending: false });

      if (error) {
        console.error('❌ Erro na consulta Supabase:', error);
        toast.error('Erro ao buscar entregas do cliente');
        throw error;
      }

      console.log('📦 Entregas encontradas:', entregas?.length || 0);

      // 2. Calcular giro histórico correto (média semanal das últimas 4 semanas)
      const totalEntregas = entregas?.reduce((total, entrega) => total + entrega.quantidade, 0) || 0;
      const giroHistoricoCalculado = Math.round(totalEntregas / 4);

      console.log('🔢 Cálculo do giro histórico:', {
        totalEntregas,
        semanas: 4,
        giroHistoricoCalculado
      });

      // 3. Calcular giro projetado baseado na periodicidade
      const giroProjetado = cliente.quantidade_padrao && cliente.periodicidade_padrao 
        ? Math.round((cliente.quantidade_padrao / cliente.periodicidade_padrao) * 7)
        : 0;

      console.log('📊 Giro projetado:', {
        quantidade_padrao: cliente.quantidade_padrao,
        periodicidade_padrao: cliente.periodicidade_padrao,
        giroProjetado
      });

      // 4. Calcular achievement
      const metaGiroSemanal = cliente.meta_giro_semanal || 0;
      const achievement = metaGiroSemanal > 0 ? (giroHistoricoCalculado / metaGiroSemanal) * 100 : 0;

      // 5. Determinar semáforo baseado no achievement
      let semaforo: 'verde' | 'amarelo' | 'vermelho' = 'vermelho';
      if (achievement >= 90) {
        semaforo = 'verde';
      } else if (achievement >= 70) {
        semaforo = 'amarelo';
      }

      // 6. Gerar alertas para inconsistências
      const alertas: string[] = [];
      
      if (!entregas || entregas.length === 0) {
        alertas.push('⚠️ Nenhuma entrega encontrada nas últimas 4 semanas');
      }
      
      if (giroHistoricoCalculado !== cliente.giro_medio_historico) {
        alertas.push(`🔍 Discrepância: Giro histórico calculado (${giroHistoricoCalculado}) difere do valor na base (${cliente.giro_medio_historico})`);
      }
      
      if (giroProjetado === 0) {
        alertas.push('⚠️ Não foi possível calcular giro projetado (quantidade_padrao ou periodicidade_padrao não definidos)');
      }
      
      if (metaGiroSemanal === 0) {
        alertas.push('⚠️ Meta de giro semanal não definida');
      }

      if (totalEntregas > 0 && entregas && entregas.length < 4) {
        alertas.push(`📊 Poucas entregas encontradas (${entregas.length} registros) para cálculo confiável`);
      }

      // Montar resultado final
      const resultado: PassoAPassoData = {
        cliente,
        entregas4Semanas: entregas || [],
        giroHistoricoCalculado,
        giroProjetado,
        metaGiroSemanal,
        achievement: Math.round(achievement),
        semaforo,
        alertas
      };

      console.log('✅ Análise concluída:', resultado);
      setDadosDebug(resultado);
      toast.success('Análise concluída com sucesso');

    } catch (error) {
      console.error('❌ Erro geral na análise:', error);
      toast.error('Erro ao analisar cliente. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Análise Passo a Passo - Debug de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Giro Histórico (Base)</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.cliente_id}>
                      <TableCell>{cliente.cliente_nome}</TableCell>
                      <TableCell>{cliente.giro_medio_historico}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setClienteSelecionado(cliente.cliente_id);
                            analisarCliente(cliente.cliente_id);
                          }}
                          disabled={loading}
                        >
                          {loading && clienteSelecionado === cliente.cliente_id ? 'Analisando...' : 'Analisar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Análise */}
      {dadosDebug && (
        <div className="space-y-6">
          {/* Alertas */}
          {dadosDebug.alertas.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {dadosDebug.alertas.map((alerta, index) => (
                    <div key={index}>{alerta}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Resumo dos Cálculos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumo dos Cálculos - {dadosDebug.cliente.cliente_nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{dadosDebug.giroHistoricoCalculado}</div>
                  <div className="text-sm text-muted-foreground">Giro Histórico Correto</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{dadosDebug.giroProjetado}</div>
                  <div className="text-sm text-muted-foreground">Giro Projetado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{dadosDebug.achievement}%</div>
                  <div className="text-sm text-muted-foreground">Achievement</div>
                </div>
                <div className="text-center">
                  <Badge 
                    variant="secondary" 
                    className={
                      dadosDebug.semaforo === 'verde' ? 'bg-green-100 text-green-800' :
                      dadosDebug.semaforo === 'amarelo' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {dadosDebug.semaforo}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Semáforo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passo a Passo do Cálculo */}
          <Card>
            <CardHeader>
              <CardTitle>Passo a Passo do Cálculo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">1. Busca das Entregas (Últimas 4 Semanas)</h4>
                  <p className="text-sm text-muted-foreground">
                    Consulta: historico_entregas WHERE cliente_id = &apos;{dadosDebug.cliente.cliente_id}&apos; 
                    AND tipo = &apos;entrega&apos; AND data &gt;= últimas 4 semanas
                  </p>
                  <p className="text-sm">
                    Resultado: {dadosDebug.entregas4Semanas.length} entregas encontradas
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold">2. Cálculo do Giro Histórico</h4>
                  <p className="text-sm text-muted-foreground">
                    Fórmula: SOMA(quantidade_entregas) / 4 semanas
                  </p>
                  <p className="text-sm">
                    Cálculo: {dadosDebug.entregas4Semanas.reduce((sum, e) => sum + e.quantidade, 0)} unidades ÷ 4 semanas = {dadosDebug.giroHistoricoCalculado} unidades/semana
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold">3. Cálculo do Giro Projetado</h4>
                  <p className="text-sm text-muted-foreground">
                    Fórmula: (quantidade_padrao / periodicidade_padrao) × 7 dias
                  </p>
                  <p className="text-sm">
                    Cálculo: ({dadosDebug.cliente.quantidade_padrao || 0} ÷ {dadosDebug.cliente.periodicidade_padrao || 0}) × 7 = {dadosDebug.giroProjetado} unidades/semana
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold">4. Cálculo do Achievement</h4>
                  <p className="text-sm text-muted-foreground">
                    Fórmula: (giro_historico / meta_giro_semanal) × 100
                  </p>
                  <p className="text-sm">
                    Cálculo: ({dadosDebug.giroHistoricoCalculado} ÷ {dadosDebug.metaGiroSemanal}) × 100 = {dadosDebug.achievement}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes das Entregas */}
          <Card>
            <CardHeader>
              <CardTitle>Entregas das Últimas 4 Semanas</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosDebug.entregas4Semanas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosDebug.entregas4Semanas.map((entrega) => (
                      <TableRow key={entrega.id}>
                        <TableCell>
                          {format(new Date(entrega.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{entrega.quantidade}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entrega.tipo}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma entrega encontrada nas últimas 4 semanas
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
