import { useState, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { DollarSign, CreditCard, Tag } from "lucide-react";
import FormasPagamentoList from "../listas/FormasPagamentoList";
import PrecificacaoTab from "./PrecificacaoTab";
import { useConfiguracoesStore } from "@/hooks/useConfiguracoesStore";

// Schema for form validation
const financeiroSchema = z.object({
  moeda: z.string().default("BRL"),
  formatoDecimais: z.number().min(0).max(6).default(2),
  margemLucroPadrao: z.number().min(0).max(100),
  custoLogisticaPerc: z.number().min(0),
  impostosPadrao: z.number().min(0).max(100),
  taxaDescontos: z.number().min(0).max(100).default(0),
  prazoPagamento: z.number().min(1).default(30),
  valorMinimoPedido: z.number().min(0).default(0),
  taxaEntrega: z.number().min(0).default(0),
});

export default function FinanceiroTab() {
  const [activeTab, setActiveTab] = useState("parametros");
  const { obterConfiguracao, salvarConfiguracao, loading } = useConfiguracoesStore();
  
  const financeiroForm = useForm<z.infer<typeof financeiroSchema>>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: {
      moeda: "BRL",
      formatoDecimais: 2,
      margemLucroPadrao: 40,
      custoLogisticaPerc: 7.5,
      impostosPadrao: 6.0,
      taxaDescontos: 0,
      prazoPagamento: 30,
      valorMinimoPedido: 0,
      taxaEntrega: 0,
    },
  });

  // Carregar dados salvos quando o componente monta
  useEffect(() => {
    const configFinanceiro = obterConfiguracao('financeiro');
    if (configFinanceiro && Object.keys(configFinanceiro).length > 0) {
      financeiroForm.reset(configFinanceiro);
    }
  }, [financeiroForm, obterConfiguracao]);
  
  const onFinanceiroSubmit = async (data: z.infer<typeof financeiroSchema>) => {
    const sucesso = await salvarConfiguracao('financeiro', data);
    
    if (sucesso) {
      toast({
        title: "Configurações salvas",
        description: "Configurações financeiras foram atualizadas com sucesso",
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <CardTitle>Configurações Financeiras</CardTitle>
        </div>
        <CardDescription>
          Configure parâmetros financeiros, margens de lucro, precificação e formas de pagamento do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="parametros">Parâmetros Financeiros</TabsTrigger>
            <TabsTrigger value="precificacao" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>Precificação</span>
            </TabsTrigger>
            <TabsTrigger value="pagamento" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              <span>Formas de Pagamento</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="parametros">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* Parâmetros de Cliente - movidos da aba anterior */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-medium">Parâmetros de Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={financeiroForm.control}
                      name="taxaDescontos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxa de descontos padrão (%)</FormLabel>
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
                            Taxa padrão de desconto para clientes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={financeiroForm.control}
                      name="prazoPagamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prazo de pagamento (dias)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Prazo padrão para pagamento em dias
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={financeiroForm.control}
                      name="valorMinimoPedido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor mínimo de pedido (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Valor mínimo para aceitar pedidos
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={financeiroForm.control}
                      name="taxaEntrega"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxa de entrega padrão (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Taxa de entrega padrão em reais
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="precificacao">
            <PrecificacaoTab />
          </TabsContent>
          
          <TabsContent value="pagamento">
            <FormasPagamentoList />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        {activeTab === "parametros" && (
          <Button type="submit" form="financeiro-form" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
