import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRepresentanteId } from "@/hooks/useMyRepresentanteId";
import { MODELO_DISPLAYS } from "@/utils/pedidoDisplays";

// O modelo não muda durante a sessão: uma leitura por representante basta.
const cache = new Map<number, string>();

/**
 * Diz se o representante logado vende em displays (canal da Imigração).
 * Quem não é representante, ou é do modelo antigo, recebe `false`.
 */
export function useModeloPedidoRep() {
  const { representanteId, loading: carregandoRep } = useMyRepresentanteId();
  const [modelo, setModelo] = useState<string | null>(
    representanteId != null ? cache.get(representanteId) ?? null : null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      if (carregandoRep) return;
      if (representanteId == null) {
        setModelo(null);
        setLoading(false);
        return;
      }
      if (cache.has(representanteId)) {
        setModelo(cache.get(representanteId)!);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("representantes")
        .select("modelo_pedido_padrao")
        .eq("id", representanteId)
        .maybeSingle();
      if (cancelado) return;
      if (error) console.error("Erro ao ler o modelo de pedido do representante:", error);
      const valor = (data as { modelo_pedido_padrao?: string } | null)?.modelo_pedido_padrao ?? "padrao";
      if (!error) cache.set(representanteId, valor);
      setModelo(valor);
      setLoading(false);
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [representanteId, carregandoRep]);

  return { vendeEmDisplays: modelo === MODELO_DISPLAYS, loading: loading || carregandoRep };
}
