
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Settings, Cpu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import AgentesIAConfigTab from "./AgentesIAConfigTab";

// Schema for form validation
const sistemaSchema = z.object({
  finaisSemanaProdutos: z.boolean(),
  diasProducaoBloqueados: z.array(z.number()),
  permitirVendasFiado: z.boolean(),
  emailNotificacoes: z.boolean(),
  logErrosConsole: z.boolean()
});

export default function SistemaTab() {
  const [activeTab, setActiveTab] = useState("geral");

  // Load saved values from localStorage
  const savedSistema = localStorage.getItem("configSistema") ? JSON.parse(localStorage.getItem("configSistema")!) : {
    finaisSemanaProdutos: false,
    diasProducaoBloqueados: [1, 2],
    // Monday and Tuesday
    permitirVendasFiado: true,
    emailNotificacoes: true,
    logErrosConsole: true
  };
  const sistemaForm = useForm<z.infer<typeof sistemaSchema>>({
    resolver: zodResolver(sistemaSchema),
    defaultValues: savedSistema
  });
  const onSistemaSubmit = (data: z.infer<typeof sistemaSchema>) => {
    localStorage.setItem("configSistema", JSON.stringify(data));
    toast({
      title: "Configurações salvas",
      description: "Configurações do sistema foram atualizadas com sucesso"
    });
  };

  // Toggle for days of the week
  const diasSemana = [{
    id: 0,
    nome: "Domingo"
  }, {
    id: 1,
    nome: "Segunda"
  }, {
    id: 2,
    nome: "Terça"
  }, {
    id: 3,
    nome: "Quarta"
  }, {
    id: 4,
    nome: "Quinta"
  }, {
    id: 5,
    nome: "Sexta"
  }, {
    id: 6,
    nome: "Sábado"
  }];
  const toggleDiaProducao = (diaId: number) => {
    const diasBloqueados = sistemaForm.getValues("diasProducaoBloqueados");
    if (diasBloqueados.includes(diaId)) {
      sistemaForm.setValue("diasProducaoBloqueados", diasBloqueados.filter(dia => dia !== diaId));
    } else {
      sistemaForm.setValue("diasProducaoBloqueados", [...diasBloqueados, diaId]);
    }
  };
  return <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <CardTitle>Configurações do Sistema</CardTitle>
        </div>
        <CardDescription>
          Personalize o comportamento do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="agentes" className="flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              <span>Agentes de IA</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <Form {...sistemaForm}>
              <form id="sistema-form" onSubmit={sistemaForm.handleSubmit(onSistemaSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Agendamento</h3>
                  
                  <FormField control={sistemaForm.control} name="finaisSemanaProdutos" render={({
                  field
                }) => <FormItem className="flex flex-row items-center justify-between">
                        <div>
                          <FormLabel>Permitir agendamentos nos finais de semana</FormLabel>
                          <FormDescription>
                            Permitir que clientes agendem entregas para sábados e domingos
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>} />
                  
                  <div className="space-y-2">
                    <FormLabel>Dias bloqueados para entregas</FormLabel>
                    <div className="grid grid-cols-7 gap-2">
                      {diasSemana.map(dia => {
                      const bloqueado = sistemaForm.getValues("diasProducaoBloqueados").includes(dia.id);
                      return <Button key={dia.id} type="button" variant={bloqueado ? "default" : "outline"} onClick={() => toggleDiaProducao(dia.id)} className="h-10">
                            {dia.nome.substring(0, 3)}
                          </Button>;
                    })}
                    </div>
                    <FormDescription>
                      Dias bloqueados serão considerados como dias de produção ou prospecção
                    </FormDescription>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Funcionalidades</h3>
                  
                  <FormField control={sistemaForm.control} name="permitirVendasFiado" render={({
                  field
                }) => <FormItem className="flex flex-row items-center justify-between">
                        <div>
                          <FormLabel>Permitir vendas fiado</FormLabel>
                          <FormDescription>
                            Permitir registrar vendas com pagamento para data futura
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>} />
                  
                  <FormField control={sistemaForm.control} name="emailNotificacoes" render={({
                  field
                }) => <FormItem className="flex flex-row items-center justify-between">
                        <div>
                          <FormLabel>Notificações por email</FormLabel>
                          <FormDescription>
                            Enviar notificações automáticas por email para clientes
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>} />
                  
                  <FormField control={sistemaForm.control} name="logErrosConsole" render={({
                  field
                }) => <FormItem className="flex flex-row items-center justify-between">
                        <div>
                          <FormLabel>Log de erros no console</FormLabel>
                          <FormDescription>
                            Registrar erros detalhados no console do navegador (para depuração)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>} />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Aparência</h3>
                  
                  <div className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel>Modo de tema</FormLabel>
                      <FormDescription>
                        Alternar entre tema claro e escuro
                      </FormDescription>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="agentes">
            <AgentesIAConfigTab />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        {activeTab === "geral" && (
          <Button type="submit" form="sistema-form">Salvar Alterações</Button>
        )}
      </CardFooter>
    </Card>;
}
