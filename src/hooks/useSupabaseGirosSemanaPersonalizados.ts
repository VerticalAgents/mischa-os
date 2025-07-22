
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GiroSemanalPersonalizado {
  id: string;
  cliente_id: string;
  categoria_id: number;
  giro_semanal: number;
  created_at: string;
  updated_at: string;
}

export function useSupabaseGirosSemanaPersonalizados() {
  const [giros, setGiros] = useState<GiroSemanalPersonalizado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const carregarGiros = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('giros_semanais_personalizados')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setGiros(data || []);
    } catch (error) {
      console.error('Erro ao carregar giros personalizados:', error);
      toast({
        title: "Erro ao carregar giros",
        description: "Não foi possível carregar os giros personalizados",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const carregarGirosPorCliente = async (clienteId: string): Promise<GiroSemanalPersonalizado[]> => {
    try {
      const { data, error } = await supabase
        .from('giros_semanais_personalizados')
        .select('*')
        .eq('cliente_id', clienteId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar giros personalizados por cliente:', error);
      return [];
    }
  };

  const obterGiroPersonalizado = (clienteId: string, categoriaId: number): number | null => {
    const giro = giros.find(g => g.cliente_id === clienteId && g.categoria_id === categoriaId);
    return giro ? giro.giro_semanal : null;
  };

  const salvarGiroPersonalizado = async (clienteId: string, categoriaId: number, giroSemanal: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('giros_semanais_personalizados')
        .upsert({
          cliente_id: clienteId,
          categoria_id: categoriaId,
          giro_semanal: giroSemanal
        }, {
          onConflict: 'cliente_id,categoria_id'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar lista local
      await carregarGiros();
      
      toast({
        title: "Giro atualizado",
        description: `Giro semanal atualizado para ${giroSemanal} unidades`,
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar giro personalizado:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o giro personalizado",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removerGiroPersonalizado = async (clienteId: string, categoriaId: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('giros_semanais_personalizados')
        .delete()
        .eq('cliente_id', clienteId)
        .eq('categoria_id', categoriaId);

      if (error) throw error;
      
      // Atualizar lista local
      await carregarGiros();
      
      toast({
        title: "Giro resetado",
        description: "Giro voltou ao cálculo automático",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao remover giro personalizado:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível resetar o giro",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarGiros();
  }, []);

  return {
    giros,
    isLoading,
    carregarGiros,
    carregarGirosPorCliente,
    obterGiroPersonalizado,
    salvarGiroPersonalizado,
    removerGiroPersonalizado
  };
}
