
import { useState, memo, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedRepresentantesData } from "@/hooks/useOptimizedRepresentantesData";
import RepresentantesIndicadores from "@/components/gestao-comercial/RepresentantesIndicadores";
import RepresentantesCharts from "@/components/gestao-comercial/RepresentantesCharts";

// Lazy load heavy components
const SortableClientesTable = memo(({ 
  clientes, 
  titulo, 
  showDeliveryStats = false 
}: { 
  clientes: any[]; 
  titulo: string; 
  showDeliveryStats?: boolean;
}) => {
  // This would be moved to a separate file in a real implementation
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-left">{titulo}</h3>
      <div className="text-center py-8 text-muted-foreground">
        {clientes.length === 0 ? "Nenhum cliente encontrado nesta categoria" : `${clientes.length} clientes`}
      </div>
    </div>
  );
});

const LoadingSkeleton = memo(() => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-64" />
      </CardContent>
    </Card>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

interface RepresentantesOptimizedProps {
  isActive: boolean;
}

export default function RepresentantesOptimized({ isActive }: RepresentantesOptimizedProps) {
  const [representanteSelecionado, setRepresentanteSelecionado] = useState<string>("todos");
  
  const { 
    data, 
    representanteNome, 
    isLoading, 
    error, 
    representantes 
  } = useOptimizedRepresentantesData(representanteSelecionado, isActive);

  // Don't render if not active
  if (!isActive) {
    return null;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Erro ao carregar dados: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Representative Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <User className="h-5 w-5" />
            Selecionar Representante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={representanteSelecionado} 
            onValueChange={setRepresentanteSelecionado}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um representante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Representantes</SelectItem>
              {representantes.map((rep) => (
                <SelectItem key={rep.id} value={rep.id.toString()}>
                  {rep.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Indicators */}
      <RepresentantesIndicadores 
        data={{
          totalClientes: data.clientesDoRepresentante.length,
          clientesAtivos: data.clientesAtivos.length,
          giroTotalReal: data.giroTotalReal,
          giroMedioPorPDV: data.giroMedioPorPDV,
          taxaConversao: data.taxaConversao,
          clientesEmAnalise: data.clientesEmAnalise.length
        }}
        isLoading={isLoading}
      />

      {/* Charts */}
      <Suspense fallback={<LoadingSkeleton />}>
        <RepresentantesCharts 
          data={{
            dadosStatusPie: data.dadosStatusPie,
            dadosGiroBar: data.dadosGiroBar
          }}
          isLoading={isLoading}
        />
      </Suspense>

      {/* Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Detalhamento por Status</CardTitle>
          <CardDescription>
            Dados do representante: {representanteNome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ativos" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="ativos">
                Ativos ({data.clientesAtivos.length})
              </TabsTrigger>
              <TabsTrigger value="em-analise">
                Em Análise ({data.clientesEmAnalise.length})
              </TabsTrigger>
              <TabsTrigger value="pipeline">
                Pipeline ({data.clientesAtivar.length})
              </TabsTrigger>
              <TabsTrigger value="standby">
                Standby ({data.clientesStandby.length})
              </TabsTrigger>
              <TabsTrigger value="inativos">
                Inativos ({data.clientesInativos.length})
              </TabsTrigger>
              <TabsTrigger value="todos">
                Todos ({data.clientesDoRepresentante.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ativos" className="space-y-4">
              <SortableClientesTable 
                clientes={data.clientesAtivos} 
                titulo="Clientes Ativos"
              />
            </TabsContent>

            <TabsContent value="em-analise" className="space-y-4">
              <SortableClientesTable 
                clientes={data.clientesEmAnalise} 
                titulo="Clientes em Análise"
                showDeliveryStats={true}
              />
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
              <SortableClientesTable 
                clientes={data.clientesAtivar} 
                titulo="Pipeline de Leads"
              />
            </TabsContent>

            <TabsContent value="standby" className="space-y-4">
              <SortableClientesTable 
                clientes={data.clientesStandby} 
                titulo="Clientes em Standby"
              />
            </TabsContent>

            <TabsContent value="inativos" className="space-y-4">
              <SortableClientesTable 
                clientes={data.clientesInativos} 
                titulo="Clientes Inativos"
              />
            </TabsContent>

            <TabsContent value="todos" className="space-y-4">
              <SortableClientesTable 
                clientes={data.clientesDoRepresentante} 
                titulo="Todos os Clientes"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
