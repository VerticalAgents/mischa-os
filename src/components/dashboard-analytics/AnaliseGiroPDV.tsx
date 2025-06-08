
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Cliente } from "@/types";
import { DREData } from "@/types/projections";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

interface AnaliseGiroPDVProps {
  clientes: Cliente[];
  baseDRE: DREData | null;
}

interface GiroPDV {
  clienteId: string;
  clienteNome: string;
  giroPrevisto: number; // From cliente.giroMedioSemanal
  giroRealizado: number; // From historico_entregas last 28 days
  totalEntregasRealizadas: number;
  ultimaEntrega?: Date;
}

interface GiroGlobal {
  previsto: {
    giroSemanal: number;
    giroQuinzenal: number;
    giroMensal: number;
    totalPDVsAtivos: number;
  };
  realizado: {
    giroSemanal: number;
    giroQuinzenal: number;
    giroMensal: number;
    totalEntregasUltimos28Dias: number;
  };
}

export default function AnaliseGiroPDV({ clientes, baseDRE }: AnaliseGiroPDVProps) {
  const [dadosGiro, setDadosGiro] = useState<GiroPDV[]>([]);
  const [giroGlobal, setGiroGlobal] = useState<GiroGlobal>({
    previsto: {
      giroSemanal: 0,
      giroQuinzenal: 0,
      giroMensal: 0,
      totalPDVsAtivos: 0
    },
    realizado: {
      giroSemanal: 0,
      giroQuinzenal: 0,
      giroMensal: 0,
      totalEntregasUltimos28Dias: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carregarDadosGiro();
  }, [clientes]);

  const carregarDadosGiro = async () => {
    try {
      setIsLoading(true);
      
      // Data limite: 28 dias atrás
      const dataLimite = subDays(new Date(), 28);
      
      // Buscar histórico de entregas dos últimos 28 dias
      const { data: historico, error } = await supabase
        .from('historico_entregas')
        .select('cliente_id, data, quantidade, tipo')
        .eq('tipo', 'entrega')
        .gte('data', dataLimite.toISOString());

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        return;
      }

      // Processar dados por cliente
      const entregasPorCliente = new Map<string, { totalEntregas: number; ultimaEntrega?: Date }>();
      
      historico?.forEach(entrega => {
        const clienteId = entrega.cliente_id;
        const dataEntrega = new Date(entrega.data);
        
        if (!entregasPorCliente.has(clienteId)) {
          entregasPorCliente.set(clienteId, { 
            totalEntregas: 0,
            ultimaEntrega: dataEntrega 
          });
        }
        
        const dadosCliente = entregasPorCliente.get(clienteId)!;
        dadosCliente.totalEntregas += entrega.quantidade;
        
        if (!dadosCliente.ultimaEntrega || dataEntrega > dadosCliente.ultimaEntrega) {
          dadosCliente.ultimaEntrega = dataEntrega;
        }
      });

      // Filtrar apenas clientes ativos
      const clientesAtivos = clientes.filter(cliente => 
        cliente.ativo && cliente.statusCliente === 'Ativo'
      );

      // Calcular giro por PDV
      const giroPDVs: GiroPDV[] = [];
      let totalGiroPrevistoSemanal = 0;
      let totalGiroRealizadoUltimos28Dias = 0;

      clientesAtivos.forEach(cliente => {
        const dadosEntregas = entregasPorCliente.get(cliente.id);
        
        // Giro previsto vem direto do campo giroMedioSemanal do cliente
        const giroPrevisto = cliente.giroMedioSemanal || 0;
        
        // Giro realizado = total entregue nos últimos 28 dias / 4 semanas
        const giroRealizado = dadosEntregas ? Math.round(dadosEntregas.totalEntregas / 4) : 0;
        
        giroPDVs.push({
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          giroPrevisto,
          giroRealizado,
          totalEntregasRealizadas: dadosEntregas?.totalEntregas || 0,
          ultimaEntrega: dadosEntregas?.ultimaEntrega
        });
        
        totalGiroPrevistoSemanal += giroPrevisto;
        totalGiroRealizadoUltimos28Dias += dadosEntregas?.totalEntregas || 0;
      });

      // Ordenar por giro previsto decrescente
      giroPDVs.sort((a, b) => b.giroPrevisto - a.giroPrevisto);

      // Calcular giro global
      const giroGlobalData: GiroGlobal = {
        previsto: {
          giroSemanal: totalGiroPrevistoSemanal,
          giroQuinzenal: totalGiroPrevistoSemanal * 2,
          giroMensal: totalGiroPrevistoSemanal * 4,
          totalPDVsAtivos: clientesAtivos.length
        },
        realizado: {
          giroSemanal: Math.round(totalGiroRealizadoUltimos28Dias / 4), // Total dos últimos 28 dias / 4 semanas
          giroQuinzenal: Math.round((totalGiroRealizadoUltimos28Dias / 4) * 2),
          giroMensal: Math.round((totalGiroRealizadoUltimos28Dias / 4) * 4),
          totalEntregasUltimos28Dias: totalGiroRealizadoUltimos28Dias
        }
      };

      setDadosGiro(giroPDVs);
      setGiroGlobal(giroGlobalData);
      
      console.log('✅ Dados de giro carregados:', { 
        giroPDVs: giroPDVs.length, 
        giroGlobal: giroGlobalData,
        clientesAtivos: clientesAtivos.length 
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados de giro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando análise de giro...</p>
        </div>
      </div>
    );
  }

  // Calcular média por PDV (previsto e realizado)
  const mediaPorPDVPrevisto = giroGlobal.previsto.totalPDVsAtivos > 0 
    ? Math.round(giroGlobal.previsto.giroSemanal / giroGlobal.previsto.totalPDVsAtivos) 
    : 0;
  
  const mediaPorPDVRealizado = giroGlobal.previsto.totalPDVsAtivos > 0 
    ? Math.round(giroGlobal.realizado.giroSemanal / giroGlobal.previsto.totalPDVsAtivos) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Blocos de Giro Previsto */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Giro Previsto por PDV
            </CardTitle>
            <CardDescription>Baseado no cadastro dos clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média Semanal</span>
                <span className="font-semibold">{mediaPorPDVPrevisto} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média Quinzenal</span>
                <span className="font-semibold">{mediaPorPDVPrevisto * 2} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média Mensal</span>
                <span className="font-semibold">{mediaPorPDVPrevisto * 4} un</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Giro Previsto Geral
            </CardTitle>
            <CardDescription>Soma de todos os PDVs ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Semanal</span>
                <span className="font-semibold">{giroGlobal.previsto.giroSemanal.toLocaleString()} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Quinzenal</span>
                <span className="font-semibold">{giroGlobal.previsto.giroQuinzenal.toLocaleString()} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Mensal</span>
                <span className="font-semibold">{giroGlobal.previsto.giroMensal.toLocaleString()} un</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">PDVs Ativos</span>
                  <Badge variant="outline">{giroGlobal.previsto.totalPDVsAtivos}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blocos de Giro Realizado */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              Giro Realizado por PDV
            </CardTitle>
            <CardDescription>Baseado nas entregas dos últimos 28 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média Semanal</span>
                <span className="font-semibold">{mediaPorPDVRealizado} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média Quinzenal</span>
                <span className="font-semibold">{mediaPorPDVRealizado * 2} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média Mensal</span>
                <span className="font-semibold">{mediaPorPDVRealizado * 4} un</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              Giro Realizado Geral
            </CardTitle>
            <CardDescription>Total entregue nos últimos 28 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Semanal</span>
                <span className="font-semibold">{giroGlobal.realizado.giroSemanal.toLocaleString()} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Quinzenal</span>
                <span className="font-semibold">{giroGlobal.realizado.giroQuinzenal.toLocaleString()} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Mensal</span>
                <span className="font-semibold">{giroGlobal.realizado.giroMensal.toLocaleString()} un</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Últimos 28 Dias</span>
                  <Badge variant="secondary">{giroGlobal.realizado.totalEntregasUltimos28Dias.toLocaleString()}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de PDVs */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Individual por PDV</CardTitle>
          <CardDescription>
            Comparação entre giro previsto (cadastro) e realizado (entregas últimos 28 dias)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dadosGiro.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Giro Previsto (Sem.)</TableHead>
                  <TableHead className="text-center">Giro Realizado (Sem.)</TableHead>
                  <TableHead className="text-center">Variação</TableHead>
                  <TableHead className="text-center">Total Entregue (28d)</TableHead>
                  <TableHead className="text-center">Última Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosGiro.map((pdv, index) => {
                  const variacao = pdv.giroPrevisto > 0 
                    ? ((pdv.giroRealizado - pdv.giroPrevisto) / pdv.giroPrevisto * 100)
                    : 0;
                  
                  return (
                    <TableRow key={pdv.clienteId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          {pdv.clienteNome}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-blue-600">{pdv.giroPrevisto}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-green-600">{pdv.giroRealizado}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={variacao >= 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{pdv.totalEntregasRealizadas}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {pdv.ultimaEntrega && (
                          <span className="text-sm text-muted-foreground">
                            {format(pdv.ultimaEntrega, 'dd/MM/yyyy')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Ainda não há dados suficientes para análise de giro.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                É necessário pelo menos algumas entregas registradas nos últimos 28 dias.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
