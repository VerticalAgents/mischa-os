import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, ShoppingCart, Receipt, Loader2 } from "lucide-react";
import { useIndicadoresFinanceiros } from "@/hooks/useIndicadoresFinanceiros";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
export default function IndicadoresTab() {
  const [periodo, setPeriodo] = useState("mes-passado");
  const {
    indicadores,
    loading,
    error
  } = useIndicadoresFinanceiros(periodo);
  // Renderizar sempre o seletor de período
  const renderPeriodoSelector = () => <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Indicadores Financeiros</CardTitle>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes-passado">Mês Passado</SelectItem>
              <SelectItem value="mes-atual">Mês Atual</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!loading && indicadores && <CardDescription className="text-left">
            Período: {indicadores.periodoAnalise.dataInicio.toLocaleDateString()} a {indicadores.periodoAnalise.dataFim.toLocaleDateString()} 
            {" • "}
            {indicadores.metadados.totalEntregasAnalisadas} entregas analisadas
          </CardDescription>}
      </CardHeader>
    </Card>;
  if (loading) {
    return <div className="space-y-6">
        {renderPeriodoSelector()}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando indicadores...</p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  if (error) {
    return <div className="space-y-6">
        {renderPeriodoSelector()}
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-center">Erro ao carregar indicadores: {error}</p>
          </CardContent>
        </Card>
      </div>;
  }
  if (!indicadores || indicadores.metadados.totalEntregasAnalisadas === 0) {
    return <div className="space-y-6">
        {renderPeriodoSelector()}
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Nenhuma entrega encontrada no período selecionado</p>
          </CardContent>
        </Card>
      </div>;
  }
  const dadosGraficoComparativo = indicadores.precoMedioPorCategoria.map(preco => {
    const custo = indicadores.custoMedioPorCategoria.find(c => c.categoriaId === preco.categoriaId);
    return {
      categoria: preco.categoriaNome,
      precoMedio: preco.precoMedio,
      custoMedio: custo?.custoMedio || 0,
      margem: preco.precoMedio - (custo?.custoMedio || 0)
    };
  });
  return <div className="space-y-6">
      {/* Header com período */}
      {renderPeriodoSelector()}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-left">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(indicadores.ticketMedio.geral.ticketMedio)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              {indicadores.ticketMedio.geral.totalEntregas} entregas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-left">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(indicadores.ticketMedio.geral.faturamentoTotal)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              {periodo === 'mes-atual' ? 'Mês Atual' : periodo === 'mes-passado' ? 'Mês Passado' : `Período de ${periodo} dias`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{indicadores.metadados.clientesAtendidos}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              {indicadores.metadados.categoriasComVendas} categorias vendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {indicadores.precoMedioPorCategoria.length > 0 ? (indicadores.precoMedioPorCategoria.reduce((acc, p) => {
                const custo = indicadores.custoMedioPorCategoria.find(c => c.categoriaId === p.categoriaId);
                return acc + (p.precoMedio - (custo?.custoMedio || 0)) / p.precoMedio * 100;
              }, 0) / indicadores.precoMedioPorCategoria.length).toFixed(1) + '%' : '0%'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              Média ponderada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preço Médio por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Preço Médio de Venda</CardTitle>
            <CardDescription className="text-left">Ponderado pelo volume de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {indicadores.precoMedioPorCategoria.map(cat => <div key={cat.categoriaId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-left">{cat.categoriaNome}</p>
                    <p className="text-sm text-muted-foreground">
                      {cat.volumeTotal} unidades • {cat.numeroClientes} clientes
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    {formatCurrency(cat.precoMedio)}
                  </p>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Custo Médio por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Custo Médio por Categoria</CardTitle>
            <CardDescription className="text-left">Ponderado pelo volume de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {indicadores.custoMedioPorCategoria.map(cat => <div key={cat.categoriaId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-left">{cat.categoriaNome}</p>
                    <p className="text-sm text-muted-foreground text-left">
                      {cat.volumeTotal} unidades vendidas
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    {formatCurrency(cat.custoMedio)}
                  </p>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Faturamento Médio Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Faturamento Médio por Categoria</CardTitle>
            <CardDescription className="text-left">Por cliente que comprou a categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {indicadores.faturamentoMedioPorCategoria.map(cat => <div key={cat.categoriaId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-left">{cat.categoriaNome}</p>
                    <p className="text-sm text-muted-foreground text-left">
                      {cat.numeroClientesAtivos} clientes ativos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(cat.faturamentoMedioPorCliente)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(cat.faturamentoTotal)}
                    </p>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Médio por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Médio por Categoria</CardTitle>
            <CardDescription className="text-left">Faturamento por entrega</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {indicadores.ticketMedio.porCategoria.map(cat => <div key={cat.categoriaId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-left">{cat.categoriaNome}</p>
                    <p className="text-sm text-muted-foreground text-left">
                      {cat.numeroEntregas} entregas
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    {formatCurrency(cat.ticketMedio)}
                  </p>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Margem de Contribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Margem de Contribuição Média</CardTitle>
            <CardDescription className="text-left">Preço médio - Custo médio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {indicadores.precoMedioPorCategoria.map(preco => {
                const custo = indicadores.custoMedioPorCategoria.find(c => c.categoriaId === preco.categoriaId);
                const margemContribuicao = preco.precoMedio - (custo?.custoMedio || 0);
                return (
                  <div key={preco.categoriaId} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-left">{preco.categoriaNome}</p>
                      <p className="text-sm text-muted-foreground text-left">
                        {formatCurrency(preco.precoMedio)} - {formatCurrency(custo?.custoMedio || 0)}
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {formatCurrency(margemContribuicao)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Individuais por Categoria */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Análise Comparativa: Preço vs Custo</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dadosGraficoComparativo.map(categoria => <Card key={categoria.categoria}>
              <CardHeader>
                <CardTitle>{categoria.categoria}</CardTitle>
                <CardDescription className="text-left">Margem de contribuição: {formatCurrency(categoria.margem)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[categoria]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="categoria" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }} />
                    <Legend />
                    <Bar dataKey="precoMedio" fill="hsl(var(--primary))" name="Preço Médio" />
                    <Bar dataKey="custoMedio" fill="hsl(var(--destructive))" name="Custo Médio" />
                    <Bar dataKey="margem" fill="hsl(var(--success))" name="Margem" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </div>;
}