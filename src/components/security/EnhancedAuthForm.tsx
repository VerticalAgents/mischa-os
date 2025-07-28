
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
});

const registerSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um caractere especial'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, 'Nome é obrigatório')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

interface EnhancedAuthFormProps {
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export function EnhancedAuthForm({ mode, onModeChange }: EnhancedAuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { 
    logAuthAttempt, 
    logSecurityEvent, 
    validatePassword, 
    validateEmail, 
    checkAccountLockout,
    accountLocked,
    lockoutExpiry 
  } = useEnhancedAuth();

  const schema = mode === 'login' ? loginSchema : registerSchema;
  
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm({
    resolver: zodResolver(schema)
  });

  const handleFormSubmit = async (data: any) => {
    // Check if account is locked
    if (checkAccountLockout()) {
      const timeLeft = lockoutExpiry ? Math.ceil((lockoutExpiry.getTime() - Date.now()) / 1000 / 60) : 0;
      toast({
        title: "Conta bloqueada",
        description: `Muitas tentativas falharam. Tente novamente em ${timeLeft} minutos.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    clearErrors();

    try {
      // Enhanced validation
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        setError('email', { message: emailValidation.errors[0] });
        setIsLoading(false);
        return;
      }

      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        setError('password', { message: passwordValidation.errors[0] });
        setIsLoading(false);
        return;
      }

      let success = false;
      
      if (mode === 'login') {
        await signInWithEmail(data.email, data.password);
        success = true;
      } else {
        await signUpWithEmail(data.email, data.password, data.fullName);
        success = true;
      }

      // Log the authentication attempt
      await logAuthAttempt(data.email, success, mode);

      if (success) {
        await logSecurityEvent('SUCCESSFUL_AUTH', 'INFO', {
          email: data.email,
          auth_type: mode,
          timestamp: new Date().toISOString()
        });

        toast({
          title: mode === 'login' ? "Login realizado" : "Cadastro realizado",
          description: mode === 'login' ? "Bem-vindo de volta!" : "Conta criada com sucesso!",
        });
      }

    } catch (error) {
      await logSecurityEvent('AUTH_ERROR', 'ERROR', {
        email: data.email,
        auth_type: mode,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      // Log failed attempt
      await logAuthAttempt(data.email, false, mode);

      toast({
        title: "Erro na autenticação",
        description: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {mode === 'login' ? 'Entrar' : 'Criar Conta'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Faça login na sua conta' : 'Crie uma nova conta segura'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {accountLocked && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Conta temporariamente bloqueada devido a múltiplas tentativas falharam.
              {lockoutExpiry && (
                <span className="block mt-1">
                  Tempo restante: {Math.ceil((lockoutExpiry.getTime() - Date.now()) / 1000 / 60)} minutos
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                disabled={isLoading || accountLocked}
                {...formRegister('fullName')}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {typeof errors.fullName.message === 'string' ? errors.fullName.message : 'Erro no nome'}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              disabled={isLoading || accountLocked}
              {...formRegister('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {typeof errors.email.message === 'string' ? errors.email.message : 'Email inválido'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                disabled={isLoading || accountLocked}
                {...formRegister('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || accountLocked}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {typeof errors.password.message === 'string' ? errors.password.message : 'Senha inválida'}
              </p>
            )}
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirme sua senha"
                  disabled={isLoading || accountLocked}
                  {...formRegister('confirmPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading || accountLocked}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {typeof errors.confirmPassword.message === 'string' ? errors.confirmPassword.message : 'Senhas não coincidem'}
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || accountLocked}
          >
            {isLoading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </span>
          <Button
            variant="link"
            className="ml-1 p-0 h-auto"
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            disabled={isLoading || accountLocked}
          >
            {mode === 'login' ? 'Criar conta' : 'Fazer login'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
