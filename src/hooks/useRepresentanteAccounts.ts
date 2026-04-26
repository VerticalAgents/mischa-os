import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RepresentanteAccount {
  id: string;
  representante_id: number;
  auth_user_id: string;
  login_email: string;
  ativo: boolean;
}

export function useRepresentanteAccounts() {
  const [accounts, setAccounts] = useState<RepresentanteAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("representante_accounts")
        .select("id, representante_id, auth_user_id, login_email, ativo");
      if (error) throw error;
      setAccounts((data ?? []) as RepresentanteAccount[]);
    } catch (err) {
      console.error("Erro ao carregar acessos de representantes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const revogar = useCallback(
    async (accountId: string) => {
      try {
        const { error } = await supabase
          .from("representante_accounts")
          .update({ ativo: false })
          .eq("id", accountId);
        if (error) throw error;
        toast.success("Acesso revogado");
        await carregar();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "Erro ao revogar acesso");
      }
    },
    [carregar]
  );

  const reativar = useCallback(
    async (accountId: string) => {
      try {
        const { error } = await supabase
          .from("representante_accounts")
          .update({ ativo: true })
          .eq("id", accountId);
        if (error) throw error;
        toast.success("Acesso reativado");
        await carregar();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "Erro ao reativar acesso");
      }
    },
    [carregar]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { accounts, loading, carregar, revogar, reativar };
}