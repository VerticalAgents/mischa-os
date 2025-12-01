
import { useState, memo, Suspense, lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedRepresentantesData } from "@/hooks/useOptimizedRepresentantesData";
import RepresentantesIndicadoresOptimized from "@/components/gestao-comercial/RepresentantesIndicadoresOptimized";
import RepresentantesCharts from "@/components/gestao-comercial/RepresentantesCharts";

// Lazy load heavy components
const SortableClientesTable = lazy(() => import("@/components/common/SortableClientesTable"));

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
      <RepresentantesIndicadoresOptimized 
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
    </div>
  );
}
