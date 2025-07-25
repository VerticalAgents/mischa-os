
import { useState, useEffect } from "react";
import { Calendar, TrendingUp, Package, DollarSign, Users, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEntregasIndicadores } from "@/hooks/useEntregasIndicadores";
import AuditoriaEntregas from "./AuditoriaEntregas";
import EntregasIndicadores from "./EntregasIndicadores";

export default function EntregasAnalyticsTab() {
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState("indicadores");

  const { indicadores, loading, recalcular } = useEntregasIndicadores(dataInicio, dataFim);

  const handlePeriodoChange = () => {
    recalcular();
  };

  const IndicadorCard = ({ title, value, icon: Icon, loading: cardLoading }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {cardLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">
          no período selecionado
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header com seleção de período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Entregas</h2>
          <p className="text-muted-foreground">
            Indicadores de performance e faturamento das entregas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="dataInicio">De:</Label>
            <Input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dataFim">Até:</Label>
            <Input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handlePeriodoChange} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Aplicar Filtro
          </Button>
        </div>
      </div>

      {/* Indicadores principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IndicadorCard
          title="Total de Entregas"
          value={indicadores.totalEntregas}
          icon={Package}
          loading={loading}
        />
        <IndicadorCard
          title="Faturamento Total"
          value={`R$ ${indicadores.faturamentoTotal.toFixed(2).replace('.', ',')}`}
          icon={DollarSign}
          loading={loading}
        />
        <IndicadorCard
          title="Clientes Atendidos"
          value={indicadores.clientesAtendidos}
          icon={Users}
          loading={loading}
        />
        <IndicadorCard
          title="Ticket Médio"
          value={`R$ ${indicadores.ticketMedio.toFixed(2).replace('.', ',')}`}
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Tabs para navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria Entregas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="indicadores" className="mt-0">
          <EntregasIndicadores 
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        </TabsContent>
        
        <TabsContent value="auditoria" className="mt-0">
          {activeTab === "auditoria" && (
            <AuditoriaEntregas 
              dataInicio={dataInicio}
              dataFim={dataFim}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
