import { useState, memo, Suspense, lazy, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GiroAnalysisFilters } from "@/types/giroAnalysis";

const SortableClientesTable = lazy(() => import("@/components/common/SortableClientesTable"));

const LoadingSkeleton = memo(() => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
));

interface StatusDetalhamentoProps {
  filtros: GiroAnalysisFilters;
}

export function StatusDetalhamento({ filtros }: StatusDetalhamentoProps) {
  const { clientes, loading } = useClienteStore();

  // Fetch representantes
  const { data: representantes = [] } = useQuery({
    queryKey: ['status-representantes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('representantes')
        .select('id, nome');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch rotas
  const { data: rotas = [] } = useQuery({
    queryKey: ['status-rotas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rotas_entrega')
        .select('id, nome');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch categorias estabelecimento
  const { data: categoriasEstabelecimento = [] } = useQuery({
    queryKey: ['status-categorias-estabelecimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_estabelecimento')
        .select('id, nome');
      if (error) throw error;
      return data || [];
    }
  });

  // Criar mapas para lookup
  const representanteMap = useMemo(() => {
    const map = new Map<number, string>();
    representantes.forEach(r => map.set(r.id, r.nome));
    return map;
  }, [representantes]);

  const rotaMap = useMemo(() => {
    const map = new Map<number, string>();
    rotas.forEach(r => map.set(r.id, r.nome));
    return map;
  }, [rotas]);

  const categoriaMap = useMemo(() => {
    const map = new Map<number, string>();
    categoriasEstabelecimento.forEach(c => map.set(c.id, c.nome));
    return map;
  }, [categoriasEstabelecimento]);

  // Aplicar filtros aos clientes
  const clientesFiltrados = useMemo(() => {
    let filtered = [...clientes];

    if (filtros.representante) {
      filtered = filtered.filter(c => {
        const repNome = c.representanteId ? representanteMap.get(c.representanteId) : null;
        return repNome === filtros.representante;
      });
    }

    if (filtros.rota) {
      filtered = filtered.filter(c => {
        const rotaNome = c.rotaEntregaId ? rotaMap.get(c.rotaEntregaId) : null;
        return rotaNome === filtros.rota;
      });
    }

    if (filtros.categoria_estabelecimento) {
      filtered = filtered.filter(c => {
        const catNome = c.categoriaEstabelecimentoId ? categoriaMap.get(c.categoriaEstabelecimentoId) : null;
        return catNome === filtros.categoria_estabelecimento;
      });
    }

    return filtered;
  }, [clientes, filtros, representanteMap, rotaMap, categoriaMap]);

  // Agrupar por status
  const clientesAtivos = useMemo(() => 
    clientesFiltrados.filter(c => c.statusCliente === 'Ativo'), 
    [clientesFiltrados]
  );
  
  const clientesEmAnalise = useMemo(() => 
    clientesFiltrados.filter(c => c.statusCliente === 'Em análise'), 
    [clientesFiltrados]
  );
  
  const clientesPipeline = useMemo(() => 
    clientesFiltrados.filter(c => c.statusCliente === 'A ativar'), 
    [clientesFiltrados]
  );
  
  const clientesStandby = useMemo(() => 
    clientesFiltrados.filter(c => c.statusCliente === 'Standby'), 
    [clientesFiltrados]
  );
  
  const clientesInativos = useMemo(() => 
    clientesFiltrados.filter(c => c.statusCliente === 'Inativo'), 
    [clientesFiltrados]
  );

  // Descrição do filtro ativo
  const filtroDescricao = useMemo(() => {
    const partes: string[] = [];
    if (filtros.representante) partes.push(`Representante: ${filtros.representante}`);
    if (filtros.rota) partes.push(`Rota: ${filtros.rota}`);
    if (filtros.categoria_estabelecimento) partes.push(`Categoria: ${filtros.categoria_estabelecimento}`);
    return partes.length > 0 ? partes.join(' | ') : 'Todos os clientes';
  }, [filtros]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-left">
          <Users className="h-5 w-5" />
          Detalhamento por Status
        </CardTitle>
        <CardDescription>
          {filtroDescricao}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ativos" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="ativos">
              Ativos ({clientesAtivos.length})
            </TabsTrigger>
            <TabsTrigger value="em-analise">
              Em Análise ({clientesEmAnalise.length})
            </TabsTrigger>
            <TabsTrigger value="pipeline">
              Pipeline ({clientesPipeline.length})
            </TabsTrigger>
            <TabsTrigger value="standby">
              Standby ({clientesStandby.length})
            </TabsTrigger>
            <TabsTrigger value="inativos">
              Inativos ({clientesInativos.length})
            </TabsTrigger>
            <TabsTrigger value="todos">
              Todos ({clientesFiltrados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="space-y-4">
            <Suspense fallback={<LoadingSkeleton />}>
              <SortableClientesTable 
                clientes={clientesAtivos} 
                titulo="Clientes Ativos"
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="em-analise" className="space-y-4">
            <Suspense fallback={<LoadingSkeleton />}>
              <SortableClientesTable 
                clientes={clientesEmAnalise} 
                titulo="Clientes em Análise"
                showDeliveryStats={true}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <Suspense fallback={<LoadingSkeleton />}>
              <SortableClientesTable 
                clientes={clientesPipeline} 
                titulo="Pipeline de Leads"
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="standby" className="space-y-4">
            <Suspense fallback={<LoadingSkeleton />}>
              <SortableClientesTable 
                clientes={clientesStandby} 
                titulo="Clientes em Standby"
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="inativos" className="space-y-4">
            <Suspense fallback={<LoadingSkeleton />}>
              <SortableClientesTable 
                clientes={clientesInativos} 
                titulo="Clientes Inativos"
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="todos" className="space-y-4">
            <Suspense fallback={<LoadingSkeleton />}>
              <SortableClientesTable 
                clientes={clientesFiltrados} 
                titulo="Todos os Clientes"
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
