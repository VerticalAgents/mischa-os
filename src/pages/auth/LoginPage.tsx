
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { SplashCursorDemo } from '@/components/ui/splash-cursor-demo';

const LoginPage = () => {
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const { signInWithGoogle, loading } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      setGoogleModalOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4 relative">
      {/* Fundo com efeito fluido */}
      <SplashCursorDemo />
      
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 rounded-xl border bg-card p-8 shadow-lg z-10">
        {/* Logo and Title */}
        <div className="flex flex-col items-center space-y-4">
          <img src="/logo.svg" alt="Mischa's Bakery" className="h-20 w-20" />
          <h1 className="text-center text-3xl font-bold tracking-tight">Mischa's Bakery</h1>
          <p className="text-center text-muted-foreground">Sistema de Gestão</p>
        </div>
        
        <div className="w-full border-t my-4" />

        {/* Google Login Button */}
        <Button 
          className="flex w-full items-center justify-center gap-2"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
              Processando...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Entrar com Google
            </>
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Faça login com sua conta Google para acessar o sistema
        </div>
      </div>

      {/* Google Login Error Modal */}
      <Dialog open={googleModalOpen} onOpenChange={setGoogleModalOpen}>
        <DialogContent>
          <DialogTitle>Configuração Necessária</DialogTitle>
          <DialogDescription>
            Para usar o login com Google, você precisa configurar o provedor Google no Supabase. 
            Verifique a configuração na aba Authentication &gt; Providers do seu projeto Supabase.
          </DialogDescription>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setGoogleModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
