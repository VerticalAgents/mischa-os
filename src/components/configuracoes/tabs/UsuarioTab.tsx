
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LogOut, Save, User } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const profileFormSchema = z.object({
  nome: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  notificacoes: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UsuarioTab() {
  const { logout, user } = useAuth();
  
  // Valores default baseados no usuário logado
  const defaultValues: Partial<ProfileFormValues> = {
    nome: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
    email: user?.email || "",
    notificacoes: true,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  function onSubmit(data: ProfileFormValues) {
    toast.success("Perfil atualizado com sucesso!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações do Usuário</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie suas preferências pessoais e configurações de conta
        </p>
      </div>
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Informações da sua conta Google conectada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu email" {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Email conectado via Google (somente leitura)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salvar alterações
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure como você gostaria de receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notificacoes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Notificações do Sistema
                      </FormLabel>
                      <FormDescription>
                        Receba alertas sobre pedidos, estoque e operações
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
          <CardDescription>
            Gerencie sua sessão e opções de saída do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <User className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">{user?.user_metadata?.full_name || "Usuário"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Conectado via Google</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ao sair, você será redirecionado para a página de login e precisará autenticar-se novamente com o Google.
            </p>
            <Button variant="destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair do Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
