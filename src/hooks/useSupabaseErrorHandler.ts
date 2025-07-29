
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useSupabaseErrorHandler = () => {
  const { refreshSession } = useAuth();

  const handleError = async (error: any, retryFunction?: () => Promise<any>) => {
    console.log('useSupabaseErrorHandler: Handling error:', error);

    // Check if it's a JWT expired error
    if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
      console.log('useSupabaseErrorHandler: JWT expired, attempting refresh...');
      toast.info('Sessão expirada, renovando automaticamente...');
      
      try {
        await refreshSession();
        
        // If we have a retry function, try the original request again
        if (retryFunction) {
          console.log('useSupabaseErrorHandler: Retrying original request...');
          await retryFunction();
          return;
        }
      } catch (refreshError) {
        console.error('useSupabaseErrorHandler: Failed to refresh session:', refreshError);
        toast.error('Não foi possível renovar a sessão. Faça login novamente.');
        return;
      }
    }

    // Handle other types of errors
    if (error?.message) {
      console.error('useSupabaseErrorHandler: Other error:', error.message);
      toast.error(`Erro: ${error.message}`);
    }
  };

  return { handleError };
};
