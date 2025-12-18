import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GerarNFResult {
  success: boolean;
  nfId: string | null;
  error?: string;
}

interface GerarNFsEmMassaResult {
  sucesso: number;
  falha: number;
  erros: string[];
}

export function useGestaoClickNF() {
  const [loading, setLoading] = useState(false);

  const gerarNF = async (agendamentoId: string, clienteId: string): Promise<GerarNFResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, nfId: null, error: "Usuário não autenticado" };
      }

      const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
        body: {
          action: "criar_nf",
          agendamento_id: agendamentoId,
          cliente_id: clienteId
        }
      });

      if (error) {
        console.error("[useGestaoClickNF] Error:", error);
        return { success: false, nfId: null, error: error.message };
      }

      if (data?.error) {
        return { success: false, nfId: null, error: data.error };
      }

      return { 
        success: true, 
        nfId: data?.nf_id || null 
      };
    } catch (err: any) {
      console.error("[useGestaoClickNF] Exception:", err);
      return { success: false, nfId: null, error: err.message };
    }
  };

  const gerarNFsEmMassa = async (
    agendamentos: { id: string; clienteId: string }[]
  ): Promise<GerarNFsEmMassaResult> => {
    setLoading(true);
    let sucesso = 0;
    let falha = 0;
    const erros: string[] = [];

    // Process sequentially to avoid rate limiting
    for (const ag of agendamentos) {
      const result = await gerarNF(ag.id, ag.clienteId);
      if (result.success) {
        sucesso++;
      } else {
        falha++;
        if (result.error) {
          erros.push(result.error);
        }
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
    return { sucesso, falha, erros };
  };

  const abrirNF = (nfId: string) => {
    const url = `https://app.gestaoclick.com/notas_fiscais/visualizar/${nfId}`;
    window.open(url, "_blank");
    toast.info("Abrindo NF no GestaoClick...");
  };

  return {
    gerarNF,
    gerarNFsEmMassa,
    abrirNF,
    loading
  };
}
