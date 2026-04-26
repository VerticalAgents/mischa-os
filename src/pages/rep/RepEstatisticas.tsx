import { useEffect, memo, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useMyRepresentanteId } from "@/hooks/useMyRepresentanteId";
import { useOptimizedRepresentantesData } from "@/hooks/useOptimizedRepresentantesData";
import RepresentantesIndicadoresOptimized from "@/components/gestao-comercial/RepresentantesIndicadoresOptimized";
import RepresentantesCharts from "@/components/gestao-comercial/RepresentantesCharts";

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

export default function RepEstatisticas() {
  const { clientes, carregarClientes } = useClienteStore();
  const { representanteId, loading: repIdLoading } = useMyRepresentanteId();

  useEffect(() => {
    if (!clientes.length) {
      carregarClientes();
    }
  }, [clientes.length, carregarClientes]);

  const repIdString = representanteId ? String(representanteId) : "";
  const { data, isLoading, error } = useOptimizedRepresentantesData(
    repIdString || "todos",
    !!repIdString
  );

  if (repIdLoading || (!data && isLoading)) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center text-destructive">
            Erro ao carregar dados: {error.message}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Estatísticas Comerciais</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores e gráficos da sua carteira de clientes
          </p>
        </div>
      </div>

      {data && (
        <>
          <RepresentantesIndicadoresOptimized
            data={{
              totalClientes: data.clientesDoRepresentante.length,
              clientesAtivos: data.clientesAtivos.length,
              giroTotalReal: data.giroTotalReal,
              giroMedioPorPDV: data.giroMedioPorPDV,
              taxaConversao: data.taxaConversao,
              clientesEmAnalise: data.clientesEmAnalise.length,
            }}
            isLoading={isLoading}
          />

          <RepresentantesCharts
            data={{
              dadosStatusPie: data.dadosStatusPie,
              dadosGiroBar: data.dadosGiroBar,
            }}
            isLoading={isLoading}
          />

          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <SortableClientesTable
              clientes={data.clientesDoRepresentante as any}
              titulo={`Meus Clientes (${data.clientesDoRepresentante.length})`}
              showDeliveryStats
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
