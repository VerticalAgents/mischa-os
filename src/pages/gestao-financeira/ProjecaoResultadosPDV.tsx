import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Users, DollarSign, Package, Truck } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import BreadcrumbNavigation from '@/components/common/Breadcrumb';
import { useOptimizedFinancialProjection } from '@/hooks/useOptimizedFinancialProjection';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseCategoriasProduto } from '@/hooks/useSupabaseCategoriasProduto';
import { useSupabaseGirosSemanaPersonalizados } from '@/hooks/useSupabaseGirosSemanaPersonalizados';
import GiroInlineEditor from '@/components/gestao-financeira/GiroInlineEditor';
import ResumoGeralTab from '@/components/gestao-financeira/ResumoGeralTab';
import LazyTabs from '@/components/gestao-financeira/LazyTabs';

export default function ProjecaoResultadosPDV() {
  const { precosDetalhados, isLoading, recalcular, faturamentoMensal, faturamentoSemanal } = useOptimizedFinancialProjection();
  const { clientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { obterGiroPersonalizado } = useSupabaseGirosSemanaPersonalizados();
  const [faturamentoMedioRevenda, setFaturamentoMedioRevenda] = useState(0);

  // Função para verificar se uma categoria é "Revenda Padrão"
  const isCategoriaRevenda = (categoriaNome: string): boolean => {
    const nome = categoriaNome.toLowerCase();
    return nome.includes('revenda') || nome.includes('padrão');
  };

  // Calcular faturamento médio apenas para clientes com categoria Revenda Padrão
  useEffect(() => {
    if (!precosDetalhados || precosDetalhados.length === 0) {
      setFaturamentoMedioRevenda(0);
      return;
    }

    console.log('🔍 Calculando faturamento médio para clientes Revenda Padrão...');

    // Filtrar apenas dados de clientes com categoria "Revenda Padrão"
    const dadosRevenda = precosDetalhados.filter(detalhe => 
      isCategoriaRevenda(detalhe.categoriaNome)
    );

    console.log('📊 Dados filtrados para Revenda Padrão:', dadosRevenda);

    if (dadosRevenda.length === 0) {
      setFaturamentoMedioRevenda(0);
      return;
    }

    // Agrupar por cliente para evitar contar o mesmo cliente múltiplas vezes
    const faturamentoPorCliente = new Map<string, number>();
    
    dadosRevenda.forEach(detalhe => {
      const faturamentoAtual = faturamentoPorCliente.get(detalhe.clienteId) || 0;
      const faturamentoMensal = detalhe.faturamentoSemanal * 4; // 4 semanas por mês
      faturamentoPorCliente.set(detalhe.clienteId, faturamentoAtual + faturamentoMensal);
    });

    // Calcular média
    const totalFaturamento = Array.from(faturamentoPorCliente.values()).reduce((sum, valor) => sum + valor, 0);
    const numeroClientes = faturamentoPorCliente.size;
    const media = numeroClientes > 0 ? totalFaturamento / numeroClientes : 0;

    console.log('💰 Faturamento médio calculado:', {
      totalFaturamento,
      numeroClientes,
      media
    });

    setFaturamentoMedioRevenda(media);
  }, [precosDetalhados]);

  // Calcular métricas gerais
  const clientesAtivos = clientes?.filter(c => c.statusCliente === 'Ativo').length || 0;
  const totalFaturamentoMensal = precosDetalhados?.reduce((sum, item) => sum + (item.faturamentoSemanal * 4), 0) || 0;

  // Agrupar dados por categoria para análise
  const dadosPorCategoria = precosDetalhados?.reduce((acc, item) => {
    const categoria = item.categoriaNome;
    if (!acc[categoria]) {
      acc[categoria] = {
        clientes: new Set(),
        faturamentoMensal: 0,
        quantidadeMedia: 0
      };
    }
    
    acc[categoria].clientes.add(item.clienteId);
    acc[categoria].faturamentoMensal += item.faturamentoSemanal * 4;
    
    return acc;
  }, {} as Record<string, { clientes: Set<string>; faturamentoMensal: number; quantidadeMedia: number }>) || {};

  // Converter Set para array length para contagem
  const categoriasSumarizadas = Object.entries(dadosPorCategoria).map(([nome, dados]) => ({
    nome,
    clientesCount: dados.clientes.size,
    faturamentoMensal: dados.faturamentoMensal,
    faturamentoMedio: dados.clientes.size > 0 ? dados.faturamentoMensal / dados.clientes.size : 0
  }));

  const verificarSeGiroPersonalizado = (clienteId: string, categoriaId: number): boolean => {
    return obterGiroPersonalizado(clienteId, categoriaId) !== null;
  };

  const handleGiroAtualizado = () => {
    recalcular();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <BreadcrumbNavigation />
        <PageHeader
          title="Projeção de Resultados por PDV"
          description="Análise financeira e projeção de resultados por ponto de venda"
        />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando projeções otimizadas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Projeção de Resultados por PDV"
        description="Análise financeira e projeção de resultados por ponto de venda"
      />

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDVs Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Pontos de venda em operação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {faturamentoMedioRevenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensal (apenas Revenda Padrão)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalFaturamentoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensal (todas as categorias)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {clientesAtivos > 0 ? (totalFaturamentoMensal / clientesAtivos).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Por PDV/mês
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="detalhada" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detalhada">Projeção Detalhada por Cliente</TabsTrigger>
          <TabsTrigger value="categoria">Análise por Categoria</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Executivo</TabsTrigger>
          <TabsTrigger value="resumo-geral">Resumo Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhada" className="space-y-4">
          <LazyTabs
            precosDetalhados={precosDetalhados || []}
            verificarSeGiroPersonalizado={verificarSeGiroPersonalizado}
            handleGiroAtualizado={handleGiroAtualizado}
            isCategoriaRevenda={isCategoriaRevenda}
          />
        </TabsContent>

        <TabsContent value="categoria" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoriasSumarizadas.map((categoria) => (
              <Card key={categoria.nome}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {categoria.nome}
                  </CardTitle>
                  <CardDescription>
                    {categoria.clientesCount} clientes ativos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Faturamento Total:</span>
                    <span className="font-semibold">
                      R$ {categoria.faturamentoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Faturamento Médio:</span>
                    <span className="font-semibold">
                      R$ {categoria.faturamentoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Participação:</span>
                    <span className="font-semibold">
                      {totalFaturamentoMensal > 0 ? ((categoria.faturamentoMensal / totalFaturamentoMensal) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Executivo</CardTitle>
              <CardDescription>
                Principais indicadores de performance por categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {faturamentoMedioRevenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Faturamento Médio Revenda Padrão
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {categoriasSumarizadas.filter(c => isCategoriaRevenda(c.nome)).reduce((sum, c) => sum + c.clientesCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    PDVs Revenda Padrão
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {categoriasSumarizadas.filter(c => !isCategoriaRevenda(c.nome)).reduce((sum, c) => sum + c.clientesCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    PDVs Outras Categorias
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Observações Importantes:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• O <strong>Faturamento Médio</strong> considera apenas clientes com categoria "Revenda Padrão"</li>
                  <li>• Clientes que são exclusivamente "Food Service" não são incluídos no cálculo da média</li>
                  <li>• O <strong>Faturamento Total</strong> inclui todas as categorias de produtos</li>
                  <li>• Valores calculados com base em projeções de giro semanal × 4 semanas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumo-geral" className="space-y-4">
          <ResumoGeralTab
            faturamentoMensal={faturamentoMensal}
            faturamentoSemanal={faturamentoSemanal}
            precosDetalhados={precosDetalhados || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}