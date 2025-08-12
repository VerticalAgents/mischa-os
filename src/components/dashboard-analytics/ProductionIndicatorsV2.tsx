
import { useState } from "react";
import { CalendarIcon, TrendingUpIcon, CheckCircleIcon, AlertTriangleIcon, BoxIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DateRange } from "react-day-picker";
import { addDays, subDays } from "date-fns";
import { useProductionAnalytics, ProductionFilters } from "@/hooks/useProductionAnalytics";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function ProductionIndicatorsV2() {
  const { produtos } = useSupabaseProdutos();
  
  const [filters, setFilters] = useState<ProductionFilters>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    aggregation: 'day',
    productId: undefined,
    status: undefined
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.startDate,
    to: filters.endDate
  });

  const { loading, kpis, timeSeriesData, topProducts, statusDistribution, tableData } = useProductionAnalytics(filters);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setFilters(prev => ({
        ...prev,
        startDate: range.from!,
        endDate: range.to!
      }));
    }
  };

  const handleFilterChange = (key: keyof ProductionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BoxIcon className="h-5 w-5" />
            Indicadores de Produção
          </CardTitle>
          <CardDescription>
            Análise detalhada da produção com dados reais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <DatePickerWithRange
                date={dateRange}
                onDateChange={handleDateRangeChange}
              />
            </div>
            
            <Select value={filters.aggregation} onValueChange={(value: any) => handleFilterChange('aggregation', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Diário</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.productId || "all"} onValueChange={(value) => handleFilterChange('productId', value === "all" ? undefined : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os produtos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {produtos.filter(p => p.ativo).map(produto => (
                  <SelectItem key={produto.id} value={produto.id}>
                    {produto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange('status', value === "all" ? undefined : value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Registrado">Registrado</SelectItem>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades Produzidas</CardTitle>
            <BoxIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalUnitsProduced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.totalFormsProduced} formas utilizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Confirmação</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.confirmationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {kpis.totalRecords} registros no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimento Médio</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.averageYield.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Rendimento por forma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variação Planejado vs Real</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.plannedVsActualVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpis.plannedVsActualVariance > 0 ? '+' : ''}{kpis.plannedVsActualVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Em relação ao planejado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Produção ao Longo do Tempo</CardTitle>
            <CardDescription>Comparativo entre produção realizada e planejada</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="produced" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Produzido"
                />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Planejado"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Status dos registros de produção</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Produtos Mais Produzidos</CardTitle>
          <CardDescription>Ranking por unidades produzidas no período</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalUnits" fill="#8b5cf6" name="Unidades" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento da Produção</CardTitle>
          <CardDescription>Registros de produção no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          {tableData.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum registro de produção encontrado no período selecionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Formas</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rendimento</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="font-medium">{record.productName}</TableCell>
                      <TableCell className="text-right">{record.formsProduced}</TableCell>
                      <TableCell className="text-right">{record.unitsCalculated}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          record.status === 'Confirmado' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.yieldUsed ? record.yieldUsed.toFixed(1) : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.observations || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
