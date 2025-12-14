import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AIUsageStats {
  hoje: number;
  semana: number;
  mes: number;
}

interface UseAIUsageReturn {
  stats: AIUsageStats;
  loading: boolean;
  limiteHoje: number;
  registrarUso: (tokensEstimados?: number) => Promise<void>;
  recarregar: () => Promise<void>;
}

const LIMITE_DIARIO_PADRAO = 50;

export function useAIUsage(): UseAIUsageReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<AIUsageStats>({ hoje: 0, semana: 0, mes: 0 });
  const [loading, setLoading] = useState(true);

  const carregarStats = useCallback(async () => {
    if (!user?.id) {
      setStats({ hoje: 0, semana: 0, mes: 0 });
      setLoading(false);
      return;
    }

    try {
      const agora = new Date();
      const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const inicioSemana = new Date(inicioHoje);
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

      // Query all logs for this month (most efficient)
      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", inicioMes.toISOString())
        .eq("sucesso", true);

      if (error) throw error;

      const logs = data || [];
      
      // Count locally
      let hoje = 0, semana = 0, mes = 0;
      logs.forEach(log => {
        const logDate = new Date(log.created_at);
        mes++;
        if (logDate >= inicioSemana) semana++;
        if (logDate >= inicioHoje) hoje++;
      });

      setStats({ hoje, semana, mes });
    } catch (err) {
      console.error("Erro ao carregar stats de uso:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const registrarUso = useCallback(async (tokensEstimados: number = 0) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("ai_usage_logs")
        .insert({
          user_id: user.id,
          tokens_estimados: tokensEstimados,
          tipo_requisicao: "chat",
          sucesso: true
        });

      if (error) throw error;

      // Update local stats
      setStats(prev => ({
        hoje: prev.hoje + 1,
        semana: prev.semana + 1,
        mes: prev.mes + 1
      }));
    } catch (err) {
      console.error("Erro ao registrar uso:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    carregarStats();
  }, [carregarStats]);

  return {
    stats,
    loading,
    limiteHoje: LIMITE_DIARIO_PADRAO,
    registrarUso,
    recarregar: carregarStats
  };
}
