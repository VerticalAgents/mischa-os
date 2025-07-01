
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tag } from "lucide-react";
import { useCategoriaStore } from "@/hooks/useCategoriaStore";
import { useConfiguracoesStore } from "@/hooks/useConfiguracoesStore";

// Schema for form validation
const precificacaoSchema = z.object({
  precosPorCategoria: z.record(z.number().min(0, "O preço deve ser maior ou igual a zero"))
});

export default function PrecificacaoTab() {
  const { categorias } = useCategoriaStore();
  const { obterConfiguracao, salvarConfiguracao, loading } = useConfiguracoesStore();
  
  const precificacaoForm = useForm<z.infer<typeof precificacaoSchema>>({
    resolver: zodResolver(precificacaoSchema),
    defaultValues: {
      precosPorCategoria: {}
    },
  });

  // Carregar dados salvos quando o componente monta
  useEffect(() => {
    const configPrecificacao = obterConfiguracao('precificacao');
    if (configPrecificacao && Object.keys(configPrecificacao).length > 0) {
      precificacaoForm.reset(configPrecificacao);
    } else {
      // Inicializar com preços zerados para todas as categorias
      const precosPorCategoria: Record<string, number> = {};
      categorias.forEach(categoria => {
        precosPorCategoria[categoria.id.toString()] = 0;
      });
      precificacaoForm.reset({ precosPorCategoria });
    }
  }, [categorias, precificacaoForm, obterConfiguracao]);
  
  const onPrecificacaoSubmit = async (data: z.infer<typeof precificacaoSchema>) => {
    const sucesso = await salvarConfiguracao('precificacao', data);
    
    if (sucesso) {
      toast({
        title: "Preços salvos",
        description: "Preços padrão por categoria foram atualizados com sucesso",
      });
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4" />
          <CardTitle>Precificação por Categoria</CardTitle>
        </div>
        <CardDescription>
          Configure preços padrão para cada categoria de produto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...precificacaoForm}>
          <form 
            id="precificacao-form" 
            onSubmit={precificacaoForm.handleSubmit(onPrecificacaoSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preços por Categoria</h3>
              
              {categorias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma categoria de produto encontrada.</p>
                  <p className="text-sm mt-1">
                    Cadastre categorias em "Configurações → Categorias" primeiro.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorias.map((categoria) => (
                    <FormField
                      key={categoria.id}
                      control={precificacaoForm.control}
                      name={`precosPorCategoria.${categoria.id}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>{categoria.nome}</span>
                            {field.value > 0 && (
                              <span className="text-sm font-normal text-muted-foreground">
                                {formatarMoeda(field.value)}
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          {categoria.descricao && (
                            <FormDescription>
                              {categoria.descricao}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {categorias.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {categorias.length} categoria{categorias.length !== 1 ? 's' : ''} configurada{categorias.length !== 1 ? 's' : ''}
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Preços"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
