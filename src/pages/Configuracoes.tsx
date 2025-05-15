
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import { 
  Settings, 
  DollarSign, 
  CalendarClock, 
  Truck, 
  UserCog, 
  Database,
  FileSpreadsheet,
  BoxesIcon
} from "lucide-react";

// Schemas for forms validation
const empresaSchema = z.object({
  nomeEmpresa: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: z.string().optional(),
  logoUrl: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  endereco: z.string().optional(),
});

const sistemaSchema = z.object({
  finaisSemanaProdutos: z.boolean(),
  diasProducaoBloqueados: z.array(z.number()),
  horasAntecedenciaMinima: z.number().min(0, "Não pode ser negativo"),
  permitirVendasFiado: z.boolean(),
  emailNotificacoes: z.boolean(),
  logErrosConsole: z.boolean(),
});

const financeiroSchema = z.object({
  moeda: z.string().default("BRL"),
  formatoDecimais: z.number().min(0).max(6).default(2),
  margemLucroPadrao: z.number().min(0).max(100),
  custoLogisticaPerc: z.number().min(0),
  impostosPadrao: z.number().min(0).max(100),
});

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState("empresa");
  
  // Load saved values from localStorage for each form
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
      
  const savedSistema = localStorage.getItem("configSistema")
    ? JSON.parse(localStorage.getItem("configSistema")!)
    : {
        finaisSemanaProdutos: false,
        diasProducaoBloqueados: [1, 2], // Monday and Tuesday
        horasAntecedenciaMinima: 24,
        permitirVendasFiado: true,
        emailNotificacoes: true,
        logErrosConsole: true,
      };
      
  const savedFinanceiro = localStorage.getItem("configFinanceiro")
    ? JSON.parse(localStorage.getItem("configFinanceiro")!)
    : {
        moeda: "BRL",
        formatoDecimais: 2,
        margemLucroPadrao: 40,
        custoLogisticaPerc: 7.5,
        impostosPadrao: 6.0,
      };
  
  // Forms
  const empresaForm = useForm<z.infer<typeof empresaSchema>>({
    resolver: zodResolver(empresaSchema),
    defaultValues: savedEmpresa,
  });
  
  const sistemaForm = useForm<z.infer<typeof sistemaSchema>>({
    resolver: zodResolver(sistemaSchema),
    defaultValues: savedSistema,
  });
  
  const financeiroForm = useForm<z.infer<typeof financeiroSchema>>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: savedFinanceiro,
  });
  
  // Form submit handlers
  const onEmpresaSubmit = (data: z.infer<typeof empresaSchema>) => {
    localStorage.setItem("configEmpresa", JSON.stringify(data));
    toast({
      title: "Configurações salvas",
      description: "Dados da empresa foram atualizados com sucesso",
    });
  };
  
  const onSistemaSubmit = (data: z.infer<typeof sistemaSchema>) => {
    localStorage.setItem("configSistema", JSON.stringify(data));
    toast({
      title: "Configurações salvas",
      description: "Configurações do sistema foram atualizadas com sucesso",
    });
  };
  
  const onFinanceiroSubmit = (data: z.infer<typeof financeiroSchema>) => {
    localStorage.setItem("configFinanceiro", JSON.stringify(data));
    toast({
      title: "Configurações salvas",
      description: "Configurações financeiras foram atualizadas com sucesso",
    });
  };
  
  // Toggle for days of the week
  const diasSemana = [
    { id: 0, nome: "Domingo" },
    { id: 1, nome: "Segunda" },
    { id: 2, nome: "Terça" },
    { id: 3, nome: "Quarta" },
    { id: 4, nome: "Quinta" },
    { id: 5, nome: "Sexta" },
    { id: 6, nome: "Sábado" },
  ];
  
  const toggleDiaProducao = (diaId: number) => {
    const diasBloqueados = sistemaForm.getValues("diasProducaoBloqueados");
    if (diasBloqueados.includes(diaId)) {
      sistemaForm.setValue(
        "diasProducaoBloqueados",
        diasBloqueados.filter((dia) => dia !== diaId)
      );
    } else {
      sistemaForm.setValue(
        "diasProducaoBloqueados",
        [...diasBloqueados, diaId]
      );
    }
  };
  
  return (
    <>
      <PageHeader 
        title="Configurações"
        description="Gerencie as configurações do sistema"
      />
      
      <div className="mt-8">
        <Tabs defaultValue="empresa" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex mb-8">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="empresa">
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
          </TabsContent>
          
          <TabsContent value="sistema">
            <Card>
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
                <Form {...sistemaForm}>
                  <form 
                    id="sistema-form" 
                    onSubmit={sistemaForm.handleSubmit(onSistemaSubmit)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Agendamento</h3>
                      
                      <FormField
                        control={sistemaForm.control}
                        name="finaisSemanaProdutos"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div>
                              <FormLabel>Permitir agendamentos nos finais de semana</FormLabel>
                              <FormDescription>
                                Permitir que clientes agendem entregas para sábados e domingos
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
                      
                      <div className="space-y-2">
                        <Label>Dias de produção bloqueados</Label>
                        <div className="grid grid-cols-7 gap-2">
                          {diasSemana.map((dia) => {
                            const bloqueado = sistemaForm
                              .getValues("diasProducaoBloqueados")
                              .includes(dia.id);
                            
                            return (
                              <Button
                                key={dia.id}
                                type="button"
                                variant={bloqueado ? "default" : "outline"}
                                onClick={() => toggleDiaProducao(dia.id)}
                                className="h-10"
                              >
                                {dia.nome.substring(0, 3)}
                              </Button>
                            );
                          })}
                        </div>
                        <FormDescription>
                          Dias bloqueados serão considerados como dias de produção ou prospecção
                        </FormDescription>
                      </div>
                      
                      <FormField
                        control={sistemaForm.control}
                        name="horasAntecedenciaMinima"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horas de antecedência mínima</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Quantas horas de antecedência são necessárias para agendar uma entrega
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Funcionalidades</h3>
                      
                      <FormField
                        control={sistemaForm.control}
                        name="permitirVendasFiado"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div>
                              <FormLabel>Permitir vendas fiado</FormLabel>
                              <FormDescription>
                                Permitir registrar vendas com pagamento para data futura
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
                      
                      <FormField
                        control={sistemaForm.control}
                        name="emailNotificacoes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div>
                              <FormLabel>Notificações por email</FormLabel>
                              <FormDescription>
                                Enviar notificações automáticas por email para clientes
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
                      
                      <FormField
                        control={sistemaForm.control}
                        name="logErrosConsole"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div>
                              <FormLabel>Log de erros no console</FormLabel>
                              <FormDescription>
                                Registrar erros detalhados no console do navegador (para depuração)
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
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" form="sistema-form">Salvar Alterações</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="financeiro">
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <CardTitle>Configurações Financeiras</CardTitle>
                </div>
                <CardDescription>
                  Configure parâmetros financeiros do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...financeiroForm}>
                  <form 
                    id="financeiro-form" 
                    onSubmit={financeiroForm.handleSubmit(onFinanceiroSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={financeiroForm.control}
                        name="moeda"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moeda</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Código da moeda (Ex: BRL, USD)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={financeiroForm.control}
                        name="formatoDecimais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Casas decimais</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                max={6} 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Número de casas decimais para valores monetários
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={financeiroForm.control}
                      name="margemLucroPadrao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Margem de lucro padrão (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              max={100} 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Margem de lucro padrão para cálculos de preço de venda
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={financeiroForm.control}
                      name="custoLogisticaPerc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo de logística (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentual do custo de logística sobre vendas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={financeiroForm.control}
                      name="impostosPadrao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impostos padrão (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              max={100} 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentual padrão de impostos para cálculos financeiros
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" form="financeiro-form">Salvar Alterações</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
