import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";

/**
 * Retorna o representante_id vinculado ao usuário logado, caso ele seja um
 * representante comercial. Null caso contrário (admin/staff/etc).
 */
export function useMyRepresentanteId() {
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useUserRoles();
  const [representanteId, setRepresentanteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (roleLoading) return;
      if (!user || userRole !== "representante") {
        setRepresentanteId(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc("get_my_representante_id");
        if (error) throw error;
        if (!cancelled) setRepresentanteId((data as number) ?? null);
      } catch (err) {
        console.error("Erro ao buscar representante_id do usuário:", err);
        if (!cancelled) setRepresentanteId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, userRole, roleLoading]);

  return { representanteId, loading };
}