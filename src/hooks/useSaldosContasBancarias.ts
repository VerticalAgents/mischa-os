import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SaldoContaBancaria {
  id: string;
  contaBancariaId: string;
  nomeConta: string | null;
  saldoInicial: number;
  dataReferencia: string; // yyyy-mm-dd
}

async function resolveOwnerId(userId: string): Promise<string> {
  try {
    const { data } = await supabase.rpc("get_owner_id", { _user_id: userId });
    return (data as string) || userId;
  } catch {
    return userId;
  }
}

export function useSaldosContasBancarias() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["saldos-contas-bancarias"],
    enabled: !!user,
    queryFn: async (): Promise<SaldoContaBancaria[]> => {
      const { data, error } = await supabase
        .from("saldos_contas_bancarias")
        .select("id, conta_bancaria_id, nome_conta, saldo_inicial, data_referencia");
      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id,
        contaBancariaId: String(r.conta_bancaria_id),
        nomeConta: r.nome_conta,
        saldoInicial: Number(r.saldo_inicial) || 0,
        dataReferencia: r.data_referencia,
      }));
    },
  });

  const salvar = useMutation({
    mutationFn: async (input: {
      contaBancariaId: string;
      nomeConta?: string | null;
      saldoInicial: number;
      dataReferencia: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const ownerId = await resolveOwnerId(user.id);
      const { error } = await supabase.from("saldos_contas_bancarias").upsert(
        {
          user_id: ownerId,
          conta_bancaria_id: input.contaBancariaId,
          nome_conta: input.nomeConta ?? null,
          saldo_inicial: input.saldoInicial,
          data_referencia: input.dataReferencia,
        },
        { onConflict: "user_id,conta_bancaria_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saldos-contas-bancarias"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa-gc"] });
      toast.success("Saldo atualizado");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar saldo"),
  });

  return {
    saldos: query.data || [],
    loading: query.isLoading,
    error: query.error as Error | null,
    salvar: salvar.mutateAsync,
    salvando: salvar.isPending,
  };
}