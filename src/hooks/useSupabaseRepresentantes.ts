
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Representante {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
}

interface UseSupabaseRepresentantesReturn {
  representantes: Representante[];
  loading: boolean;
  error: string | null;
  carregarRepresentantes: () => Promise<void>;
}

export function useSupabaseRepresentantes(): UseSupabaseRepresentantesReturn {
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarRepresentantes = useCallback(async () => {
    if (loading) return; // Evita múltiplas chamadas simultâneas
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('representantes')
        .select('*')
        .order('nome');

      if (supabaseError) {
        console.error('Erro ao carregar representantes:', supabaseError);
        setError('Erro ao carregar representantes');
        return;
      }

      setRepresentantes(data || []);
    } catch (err) {
      console.error('Erro ao carregar representantes:', err);
      setError('Erro inesperado ao carregar representantes');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Carrega automaticamente na primeira renderização
  useEffect(() => {
    carregarRepresentantes();
  }, []); // Remove carregarRepresentantes das dependências para evitar loops

  return {
    representantes,
    loading,
    error,
    carregarRepresentantes
  };
}
