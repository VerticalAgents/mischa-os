
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, DollarSign, Users, Package } from 'lucide-react';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';

export default function AnaliseGiroPDV() {
  const { 
    faturamentoSemanal, 
    faturamentoMensal, 
    isLoading, 
    disponivel, 
    precosDetalhados,
    recalcular 
  } = useFaturamentoPrevisto();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const stats = {
    totalClientes: [...new Set(precosDetalhados.map(p => p.clienteId))].length,
    totalCategorias: [...new Set(precosDetalhados.map(p => p.categoriaId))].length,
    precosPersonalizados: precosDetalhados.filter(p => p.precoPersonalizado).length,
    totalGiroSemanal: precosDetalhados.reduce((sum, p) => sum + p.giroSemanal, 0)
  };

  if (!disponivel && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projeção Detalhada por Cliente
          </CardTitle>
          <CardDescription>
            Análise detalhada do giro médio por PDV com preços personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado disponível para análise.</p>
            <p className="text-sm mt-1">Configure clientes ativos com categorias habilitadas primeiro.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Semanal</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? '...' : formatarMoeda(faturamentoSemanal)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Mensal</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? '...' : formatarMoeda(faturamentoMensal)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">{stats.totalClientes}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preços Personalizados</p>
                <p className="text-2xl font-bold text-orange-600">{stats.precosPersonalizados}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projeção Detalhada por Cliente
              </CardTitle>
              <CardDescription>
                Análise detalhada com preços personalizados por cliente e categoria
              </CardDescription>
            </div>
            <Button
              onClick={recalcular}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando projeções detalhadas...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Preço Unitário</TableHead>
                    <TableHead className="text-right">Giro Semanal (un)</TableHead>
                    <TableHead className="text-right">Faturamento Semanal</TableHead>
                    <TableHead className="text-right">Faturamento Mensal</TableHead>
                    <TableHead className="text-center">Tipo Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {precosDetalhados.length > 0 ? (
                    precosDetalhados.map((item, index) => (
                      <TableRow key={`${item.clienteId}-${item.categoriaId}-${index}`}>
                        <TableCell className="font-medium">{item.clienteNome}</TableCell>
                        <TableCell>{item.categoriaNome}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatarMoeda(item.precoUnitario)}
                        </TableCell>
                        <TableCell className="text-right">{item.giroSemanal}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatarMoeda(item.faturamentoSemanal)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatarMoeda(item.faturamentoSemanal * 4)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={item.precoPersonalizado ? "default" : "secondary"}
                            className={item.precoPersonalizado ? "bg-orange-100 text-orange-800" : ""}
                          >
                            {item.precoPersonalizado ? "Personalizado" : "Padrão"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="h-8 w-8" />
                          <p>Nenhum dado disponível</p>
                          <p className="text-sm">Configure clientes e categorias primeiro</p>
                        </div>
                      </TableCell>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Resumo da Tabela */}
          {precosDetalhados.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex flex-wrap gap-4 text-sm">
                <span><strong>Total de registros:</strong> {precosDetalhados.length}</span>
                <span><strong>Clientes únicos:</strong> {stats.totalClientes}</span>
                <span><strong>Preços personalizados:</strong> {stats.precosPersonalizados}</span>
                <span><strong>Giro semanal total:</strong> {stats.totalGiroSemanal} unidades</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
