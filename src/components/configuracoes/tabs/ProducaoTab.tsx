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
import { BoxesIcon } from "lucide-react";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema for form validation
const producaoSchema = z.object({
  unidadesPorForma: z.number().min(1, "Deve ser pelo menos 1").default(24),
  formasPorLote: z.number().min(1, "Deve ser pelo menos 1").default(4),
  incluirPedidosPrevistos: z.boolean().default(true),
  percentualPedidosPrevistos: z.number().min(0).max(100).default(15),
  tempoMedioPorFornada: z.number().min(1, "Deve ser pelo menos 1 minuto").default(45),
  unidadesBrowniePorForma: z.number().min(1, "Deve ser pelo menos 1").default(16),
  formasPorFornada: z.number().min(1, "Deve ser pelo menos 1").default(2)
});

export default function ProducaoTab() {
  const { configuracoesProducao, atualizarConfiguracoesProducao } = useConfigStore();
  const { produtos, atualizarEstoqueMinimo } = useProdutoStore();
  const [activeTab, setActiveTab] = useState("parametros");
  
  const form = useForm<z.infer<typeof producaoSchema>>({
    resolver: zodResolver(producaoSchema),
    defaultValues: configuracoesProducao
  });
  
  // Update form when configuracoesProducao changes
  useEffect(() => {
    if (configuracoesProducao) {
      form.reset(configuracoesProducao);
    }
  }, [configuracoesProducao, form]);
  
  const onSubmit = (data: z.infer<typeof producaoSchema>) => {
    atualizarConfiguracoesProducao(data);
    toast({
      title: "Configurações salvas",
      description: "Parâmetros de produção foram atualizados com sucesso",
    });
  };

  const handleEstoqueMinimoChange = (id: number, value: string) => {
    const estoqueMinimo = parseInt(value);
    if (!isNaN(estoqueMinimo) && estoqueMinimo >= 0) {
      atualizarEstoqueMinimo(id, estoqueMinimo);
    }
  };
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <BoxesIcon className="h-4 w-4" />
          <CardTitle>Configurações de Produção</CardTitle>
        </div>
        <CardDescription>
          Defina os parâmetros utilizados no planejamento de produção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
            <TabsTrigger value="estoque">Estoque Mínimo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="parametros">
            <Form {...form}>
              <form 
                id="producao-form" 
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="unidadesPorForma"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidades por forma</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Quantidade de unidades produzidas em cada forma
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="formasPorLote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formas por lote</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Quantidade de formas em cada lote de produção
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unidadesBrowniePorForma"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidades de brownie por forma</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Quantidade de brownies produzidos em cada forma
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="formasPorFornada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formas por fornada</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Quantidade de formas por cada fornada no forno
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tempoMedioPorFornada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo médio por fornada (minutos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Tempo médio de preparo de cada fornada (em minutos)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="incluirPedidosPrevistos"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div>
                          <FormLabel>Incluir pedidos previstos</FormLabel>
                          <FormDescription>
                            Considerar pedidos previstos no cálculo de produção
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
                  
                  {form.watch("incluirPedidosPrevistos") && (
                    <FormField
                      control={form.control}
                      name="percentualPedidosPrevistos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percentual de pedidos previstos (%)</FormLabel>
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
                            Percentual adicional sobre a demanda atual para pedidos previstos
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <CardFooter className="px-0 pt-6">
                  <Button type="submit">Salvar Alterações</Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="estoque">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-semibold mb-4">Estoque Mínimo de Produtos</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Configure o estoque mínimo para cada produto. Quando o estoque ficar abaixo desse valor,
                  o sistema emitirá alertas para reposição.
                </p>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          Nenhum produto cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      produtos.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell>{produto.nome}</TableCell>
                          <TableCell>{produto.categoria || "Não categorizado"}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={produto.estoqueMinimo || 0}
                              onChange={(e) => handleEstoqueMinimoChange(produto.id, e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
