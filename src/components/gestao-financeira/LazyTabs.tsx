import { lazy, Suspense, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load das tabelas pesadas
const FaturamentoTable = lazy(() => import('./FaturamentoTable'));
const CustosTable = lazy(() => import('./CustosTable'));
const ResultadosTable = lazy(() => import('./ResultadosTable'));

interface LazyTabsProps {
  precosDetalhados: any[];
  verificarSeGiroPersonalizado: (clienteId: string, categoriaId: number) => boolean;
  handleGiroAtualizado: () => void;
  isCategoriaRevenda: (categoriaNome: string) => boolean;
}

// Componente de loading para as tabelas
const TableSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-6 w-full" />
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

export default function LazyTabs({
  precosDetalhados,
  verificarSeGiroPersonalizado,
  handleGiroAtualizado,
  isCategoriaRevenda
}: LazyTabsProps) {
  // Memoizar props para evitar re-renders desnecessários
  const memoizedProps = useMemo(() => ({
    precosDetalhados,
    verificarSeGiroPersonalizado,
    handleGiroAtualizado,
    isCategoriaRevenda
  }), [precosDetalhados, verificarSeGiroPersonalizado, handleGiroAtualizado, isCategoriaRevenda]);

  return (
    <Tabs defaultValue="faturamento" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
        <TabsTrigger value="custos">Custos</TabsTrigger>
        <TabsTrigger value="resultados">Resultados</TabsTrigger>
      </TabsList>

      <TabsContent value="faturamento" className="space-y-4">
        <Suspense fallback={<TableSkeleton />}>
          <FaturamentoTable {...memoizedProps} />
        </Suspense>
      </TabsContent>

      <TabsContent value="custos" className="space-y-4">
        <Suspense fallback={<TableSkeleton />}>
          <CustosTable
            precosDetalhados={memoizedProps.precosDetalhados}
            isCategoriaRevenda={memoizedProps.isCategoriaRevenda}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="resultados" className="space-y-4">
        <Suspense fallback={<TableSkeleton />}>
          <ResultadosTable
            precosDetalhados={memoizedProps.precosDetalhados}
            isCategoriaRevenda={memoizedProps.isCategoriaRevenda}
          />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}