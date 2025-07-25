
import { useState } from "react";
import { Calendar, TrendingUp, Package, DollarSign, Users, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import AuditoriaEntregas from "./AuditoriaEntregas";
import EntregasIndicadores from "./EntregasIndicadores";

export default function EntregasAnalyticsTab() {
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAuditoria, setShowAuditoria] = useState(false);

  const handlePeriodoChange = () => {
    // Trigger refetch when period changes
    console.log('Período alterado:', { dataInicio, dataFim });
  };

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              valor faturado no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              clientes únicos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              por entrega no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para navegação */}
      <Tabs defaultValue="indicadores" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger 
            value="auditoria"
            onClick={() => setShowAuditoria(true)}
          >
            Auditoria Entregas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="indicadores" className="mt-0">
          <EntregasIndicadores 
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        </TabsContent>
        
        <TabsContent value="auditoria" className="mt-0">
          {showAuditoria && (
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
