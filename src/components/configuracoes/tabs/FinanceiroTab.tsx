
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
import { DollarSign } from "lucide-react";

// Schema for form validation
const financeiroSchema = z.object({
  moeda: z.string().default("BRL"),
  formatoDecimais: z.number().min(0).max(6).default(2),
  margemLucroPadrao: z.number().min(0).max(100),
  custoLogisticaPerc: z.number().min(0),
  impostosPadrao: z.number().min(0).max(100),
});

export default function FinanceiroTab() {
  // Load saved values from localStorage
  const savedFinanceiro = localStorage.getItem("configFinanceiro")
    ? JSON.parse(localStorage.getItem("configFinanceiro")!)
    : {
        moeda: "BRL",
        formatoDecimais: 2,
        margemLucroPadrao: 40,
        custoLogisticaPerc: 7.5,
        impostosPadrao: 6.0,
      };
  
  const financeiroForm = useForm<z.infer<typeof financeiroSchema>>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: savedFinanceiro,
  });
  
  const onFinanceiroSubmit = (data: z.infer<typeof financeiroSchema>) => {
    localStorage.setItem("configFinanceiro", JSON.stringify(data));
    toast({
      title: "Configurações salvas",
      description: "Configurações financeiras foram atualizadas com sucesso",
    });
  };
  
  return (
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
  );
}
