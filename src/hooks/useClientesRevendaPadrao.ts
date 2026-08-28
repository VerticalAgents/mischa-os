import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Quais dos clientes informados têm uma categoria acionada no cadastro.
 *
 * Existe para a proporção de uso único, que só vale para clientes de
 * "Revenda Padrão". Fica num hook próprio (e não dentro do diálogo) porque a
 * pergunta "este cliente é de revenda?" tende a aparecer em outros lugares —
 * e porque assim dá para trocá-lo por um stub na verificação visual, já que
 * não existe login disponível no ambiente de desenvolvimento.
 */
export const useClientesComCategoria = (
  clienteIds: string[],
  categoriaId: number | null
) => {
  const [porCliente, setPorCliente] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // A chave estabiliza o efeito: o array de ids é recriado a cada render pelo
  // chamador, e comparar por referência dispararia a consulta sem parar.
  const chave = clienteIds.slice().sort().join(",");

  useEffect(() => {
    if (categoriaId == null || clienteIds.length === 0) {
      setPorCliente({});
      return;
    }

    let cancelado = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, categorias_habilitadas")
        .in("id", clienteIds);

      if (cancelado) return;

      if (error) {
        console.error("Erro ao carregar categorias dos clientes:", error);
        setPorCliente({});
        setLoading(false);
        return;
      }

      const mapa: Record<string, boolean> = {};
      (data || []).forEach((c: any) => {
        const habilitadas = Array.isArray(c.categorias_habilitadas)
          ? c.categorias_habilitadas
          : [];
        mapa[String(c.id)] = habilitadas.includes(categoriaId);
      });

      setPorCliente(mapa);
      setLoading(false);
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, categoriaId]);

  return { porCliente, loading };
};
