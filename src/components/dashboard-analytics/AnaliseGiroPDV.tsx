
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Cliente } from "@/types";
import { DREData } from "@/types/projections";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { supabase } from "@/integrations/supabase/client";
import { differenceInWeeks, subWeeks, format } from "date-fns";

interface AnaliseGiroPDVProps {
  clientes: Cliente[];
  baseDRE: DREData | null;
}

interface GiroPDV {
  clienteId: string;
  clienteNome: string;
  mediaSemanal: number;
  mediaQuinzenal: number;
  mediaMensal: number;
  totalEntregas: number;
  ultimaEntrega?: Date;
}

interface GiroGlobal {
  giroSemanal: number;
  giroQuinzenal: number;
  giroMensal: number;
  totalPDVsAtivos: number;
}

export default function AnaliseGiroPDV({ clientes, baseDRE }: AnaliseGiroPDVProps) {
  const [dadosGiro, setDadosGiro] = useState<GiroPDV[]>([]);
  const [giroGlobal, setGiroGlobal] = useState<GiroGlobal>({
    giroSemanal: 0,
    giroQuinzenal: 0,
    giroMensal: 0,
    totalPDVsAtivos: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carregarDadosGiro();
  }, [clientes]);

  const carregarDadosGiro = async () => {
    try {
      setIsLoading(true);
      
      // Data limite: 4 semanas atrás
      const dataLimite = subWeeks(new Date(), 4);
      
      // Buscar histórico de entregas das últimas 4 semanas
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
      const girosPorCliente = new Map<string, { totalEntregas: number; semanas: Set<string>; ultimaEntrega?: Date }>();
      
      historico?.forEach(entrega => {
        const clienteId = entrega.cliente_id;
        const dataEntrega = new Date(entrega.data);
        const semanaAno = format(dataEntrega, 'yyyy-ww'); // Ano-semana
        
        if (!girosPorCliente.has(clienteId)) {
          girosPorCliente.set(clienteId, { 
            totalEntregas: 0, 
            semanas: new Set(), 
            ultimaEntrega: dataEntrega 
          });
        }
        
        const dadosCliente = girosPorCliente.get(clienteId)!;
        dadosCliente.totalEntregas += entrega.quantidade;
        dadosCliente.semanas.add(semanaAno);
        
        if (!dadosCliente.ultimaEntrega || dataEntrega > dadosCliente.ultimaEntrega) {
          dadosCliente.ultimaEntrega = dataEntrega;
        }
      });

      // Calcular giro por PDV
      const giroPDVs: GiroPDV[] = [];
      let totalGiroSemanal = 0;

      clientes
        .filter(cliente => cliente.ativo && cliente.statusCliente === 'Ativo')
        .forEach(cliente => {
          const dadosCliente = girosPorCliente.get(cliente.id);
          
          if (dadosCliente && dadosCliente.semanas.size >= 2) { // Pelo menos 2 semanas de dados
            const semanasComDados = dadosCliente.semanas.size;
            const mediaSemanal = Math.round(dadosCliente.totalEntregas / semanasComDados);
            const mediaQuinzenal = mediaSemanal * 2;
            const mediaMensal = mediaSemanal * 4;
            
            giroPDVs.push({
              clienteId: cliente.id,
              clienteNome: cliente.nome,
              mediaSemanal,
              mediaQuinzenal,
              mediaMensal,
              totalEntregas: dadosCliente.totalEntregas,
              ultimaEntrega: dadosCliente.ultimaEntrega
            });
            
            totalGiroSemanal += mediaSemanal;
          }
        });

      // Ordenar por média semanal decrescente
      giroPDVs.sort((a, b) => b.mediaSemanal - a.mediaSemanal);

      // Calcular giro global
      const giroGlobalData: GiroGlobal = {
        giroSemanal: totalGiroSemanal,
        giroQuinzenal: totalGiroSemanal * 2,
        giroMensal: totalGiroSemanal * 4,
        totalPDVsAtivos: giroPDVs.length
      };

      setDadosGiro(giroPDVs);
      setGiroGlobal(giroGlobalData);
      
      console.log('✅ Dados de giro carregados:', { giroPDVs: giroPDVs.length, giroGlobal: giroGlobalData });
      
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

  return (
    <div className="space-y-6">
      {/* Bloco de Giro Previsto */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Giro Previsto por PDV</CardTitle>
            <CardDescription>Média baseada nas últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dadosGiro.length > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Média Semanal</span>
                    <span className="font-semibold">
                      {Math.round(giroGlobal.giroSemanal / giroGlobal.totalPDVsAtivos || 0)} un
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Média Quinzenal</span>
                    <span className="font-semibold">
                      {Math.round((giroGlobal.giroSemanal * 2) / giroGlobal.totalPDVsAtivos || 0)} un
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Média Mensal</span>
                    <span className="font-semibold">
                      {Math.round((giroGlobal.giroSemanal * 4) / giroGlobal.totalPDVsAtivos || 0)} un
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Dados insuficientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Giro Previsto Geral</CardTitle>
            <CardDescription>Somatório de todos os PDVs ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Semanal</span>
                <span className="font-semibold">{giroGlobal.giroSemanal.toLocaleString()} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Quinzenal</span>
                <span className="font-semibold">{giroGlobal.giroQuinzenal.toLocaleString()} un</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Giro Mensal</span>
                <span className="font-semibold">{giroGlobal.giroMensal.toLocaleString()} un</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">PDVs Ativos</span>
                  <Badge variant="outline">{giroGlobal.totalPDVsAtivos}</Badge>
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
            Giro detalhado por cliente baseado nas entregas das últimas 4 semanas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dadosGiro.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Média Semanal</TableHead>
                  <TableHead className="text-center">Média Quinzenal</TableHead>
                  <TableHead className="text-center">Média Mensal</TableHead>
                  <TableHead className="text-center">Total Entregas</TableHead>
                  <TableHead className="text-center">Última Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosGiro.map((pdv, index) => (
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
                      <span className="font-semibold">{pdv.mediaSemanal}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{pdv.mediaQuinzenal}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{pdv.mediaMensal}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{pdv.totalEntregas}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {pdv.ultimaEntrega && (
                        <span className="text-sm text-muted-foreground">
                          {format(pdv.ultimaEntrega, 'dd/MM/yyyy')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Ainda não há dados suficientes para análise de giro.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                É necessário pelo menos 2 semanas de entregas registradas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
