
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleGoogleLogin = () => {
    setGoogleModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 rounded-xl border bg-card p-8 shadow-lg">
        {/* Logo and Title */}
        <div className="flex flex-col items-center space-y-4">
          <img src="/logo.svg" alt="Mischa's Bakery" className="h-20 w-20" />
          <h1 className="text-center text-3xl font-bold tracking-tight">Mischa's Bakery</h1>
          <p className="text-center text-muted-foreground">Sistema de Gestão</p>
        </div>
        
        <div className="w-full border-t my-4" />

        {/* Google Login Button */}
        <Button 
          variant="outline" 
          className="flex w-full items-center justify-center gap-2"
          onClick={handleGoogleLogin}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Entrar com Google
        </Button>

        <div className="relative flex w-full items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative bg-card px-3 text-sm text-muted-foreground">
            ou
          </div>
        </div>

        {/* Developer Login Form */}
        <form className="flex w-full flex-col space-y-4" onSubmit={handleDevLogin}>
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de usuário"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                Processando...
              </>
            ) : (
              "Entrar como desenvolvedor"
            )}
          </Button>
        </form>
      </div>

      {/* Google Login Modal */}
      <Dialog open={googleModalOpen} onOpenChange={setGoogleModalOpen}>
        <DialogContent>
          <DialogTitle>Acesso Restrito</DialogTitle>
          <DialogDescription>
            O login com Google ainda não está disponível. Este sistema está em fase de desenvolvimento e acesso é restrito.
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
