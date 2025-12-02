import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DistribuidorComExpositores {
  cliente_id: string;
  nome: string;
  status_cliente: string | null;
  giro_medio_semanal: number | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  numero_expositores: number;
  observacoes: string | null;
}

const CATEGORIA_DISTRIBUIDOR_ID = 16;

export function useDistribuidoresExpositores() {
  const queryClient = useQueryClient();

  // Buscar distribuidores com seus expositores
  const { data: distribuidores, isLoading, error } = useQuery({
    queryKey: ["distribuidores-expositores"],
    queryFn: async () => {
      // Buscar clientes da categoria Distribuidor
      const { data: clientes, error: clientesError } = await supabase
        .from("clientes")
        .select("id, nome, status_cliente, giro_medio_semanal, contato_nome, contato_telefone")
        .eq("categoria_estabelecimento_id", CATEGORIA_DISTRIBUIDOR_ID)
        .order("nome");

      if (clientesError) throw clientesError;
      if (!clientes) return [];

      // Buscar dados de expositores
      const { data: expositores, error: expositoresError } = await supabase
        .from("distribuidores_expositores")
        .select("cliente_id, numero_expositores, observacoes");

      if (expositoresError) throw expositoresError;

      // Mapear expositores por cliente_id
      const expositoresMap = new Map(
        (expositores || []).map((e) => [e.cliente_id, e])
      );

      // Combinar dados
      const result: DistribuidorComExpositores[] = clientes.map((cliente) => {
        const expositorData = expositoresMap.get(cliente.id);
        return {
          cliente_id: cliente.id,
          nome: cliente.nome,
          status_cliente: cliente.status_cliente,
          giro_medio_semanal: cliente.giro_medio_semanal,
          contato_nome: cliente.contato_nome,
          contato_telefone: cliente.contato_telefone,
          numero_expositores: expositorData?.numero_expositores ?? 0,
          observacoes: expositorData?.observacoes ?? null,
        };
      });

      return result;
    },
  });

  // Mutation para atualizar número de expositores
  const updateExpositoresMutation = useMutation({
    mutationFn: async ({
      clienteId,
      numeroExpositores,
      observacoes,
    }: {
      clienteId: string;
      numeroExpositores: number;
      observacoes?: string | null;
    }) => {
      // Upsert - insere ou atualiza
      const { error } = await supabase
        .from("distribuidores_expositores")
        .upsert(
          {
            cliente_id: clienteId,
            numero_expositores: numeroExpositores,
            observacoes: observacoes,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "cliente_id",
          }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distribuidores-expositores"] });
      toast.success("Expositores atualizados");
    },
    onError: (error) => {
      console.error("Erro ao atualizar expositores:", error);
      toast.error("Erro ao atualizar expositores");
    },
  });

  // Métricas calculadas
  const metricas = {
    distribuidoresAtivos: distribuidores?.filter((d) => d.status_cliente === "Ativo").length ?? 0,
    totalExpositores: distribuidores?.reduce((sum, d) => sum + d.numero_expositores, 0) ?? 0,
    giroSemanalTotal: distribuidores
      ?.filter((d) => d.status_cliente === "Ativo")
      .reduce((sum, d) => sum + (d.giro_medio_semanal ?? 0), 0) ?? 0,
  };

  return {
    distribuidores: distribuidores ?? [],
    isLoading,
    error,
    metricas,
    updateExpositores: updateExpositoresMutation.mutate,
    isUpdating: updateExpositoresMutation.isPending,
  };
}
