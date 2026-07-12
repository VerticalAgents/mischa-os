import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClienteIndustrial {
  id: string;
  nomeFantasia: string;
  razaoSocial?: string | null;
  tipoCliente: "INDUSTRIAL" | "AMBOS";
}

/**
 * Lista clientes elegíveis a possuir estoque consignado (private-label):
 * tipo_cliente = 'INDUSTRIAL' ou 'AMBOS'.
 */
export function useClientesIndustriais() {
  const [clientes, setClientes] = useState<ClienteIndustrial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome_fantasia, razao_social, tipo_cliente")
        .in("tipo_cliente", ["INDUSTRIAL", "AMBOS"])
        .order("nome_fantasia");
      if (!cancelled) {
        if (error) {
          console.error("Erro ao carregar clientes industriais:", error);
          setClientes([]);
        } else {
          setClientes(
            (data || []).map((c: any) => ({
              id: c.id,
              nomeFantasia: c.nome_fantasia,
              razaoSocial: c.razao_social,
              tipoCliente: c.tipo_cliente,
            })),
          );
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { clientes, loading };
}