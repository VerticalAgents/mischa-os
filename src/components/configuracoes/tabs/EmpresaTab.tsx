
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { UserCog } from "lucide-react";

// Schema for form validation
const empresaSchema = z.object({
  nomeEmpresa: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: z.string().optional(),
  logoUrl: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  endereco: z.string().optional(),
});

export default function EmpresaTab() {
  // Load saved values from localStorage
  const savedEmpresa = localStorage.getItem("configEmpresa")
    ? JSON.parse(localStorage.getItem("configEmpresa")!)
    : {
        nomeEmpresa: "Minha Empresa",
        cnpj: "",
        logoUrl: "",
        telefone: "",
        email: "",
        endereco: "",
      };
  
  const empresaForm = useForm<z.infer<typeof empresaSchema>>({
    resolver: zodResolver(empresaSchema),
    defaultValues: savedEmpresa,
  });
  
  const onEmpresaSubmit = (data: z.infer<typeof empresaSchema>) => {
    localStorage.setItem("configEmpresa", JSON.stringify(data));
    toast({
      title: "Configurações salvas",
      description: "Dados da empresa foram atualizados com sucesso",
    });
  };
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <UserCog className="h-4 w-4" />
          <CardTitle>Dados da Empresa</CardTitle>
        </div>
        <CardDescription>
          Configure as informações básicas da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...empresaForm}>
          <form 
            id="empresa-form" 
            onSubmit={empresaForm.handleSubmit(onEmpresaSubmit)}
            className="space-y-6"
          >
            <FormField
              control={empresaForm.control}
              name="nomeEmpresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={empresaForm.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="XX.XXX.XXX/XXXX-XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={empresaForm.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={empresaForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="contato@empresa.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={empresaForm.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={empresaForm.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    URL da imagem do logo da sua empresa
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button type="submit" form="empresa-form">Salvar Alterações</Button>
      </CardFooter>
    </Card>
  );
}
