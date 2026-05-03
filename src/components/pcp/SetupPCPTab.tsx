import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings2, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useMediaVendasSemanais } from "@/hooks/useMediaVendasSemanais";
import { ConfiguracoesProducao } from "@/types";

const setupSchema = z.object({
  coberturaAlvoDias: z.number().min(0).max(14).default(3),
  unidadesPorForma: z.number().min(1).default(24),
  formasPorLote: z.number().min(1).default(4),
  formasPorFornada: z.number().min(1).default(2),
  tempoMedioPorFornada: z.number().min(1).default(45),
  incluirPedidosPrevistos: z.boolean().default(true),
  percentualPedidosPrevistos: z.number().min(0).max(100).default(15),
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function SetupPCPTab() {
  const { configuracoesProducao, atualizarConfiguracoesProducao } = useConfigStore();
  const { mediaVendasPorProduto } = useMediaVendasSemanais();

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      coberturaAlvoDias: configuracoesProducao?.coberturaAlvoDias ?? 3,
      unidadesPorForma: configuracoesProducao?.unidadesPorForma ?? 24,
      formasPorLote: configuracoesProducao?.formasPorLote ?? 4,
      formasPorFornada: configuracoesProducao?.formasPorFornada ?? 2,
      tempoMedioPorFornada: configuracoesProducao?.tempoMedioPorFornada ?? 45,
      incluirPedidosPrevistos: configuracoesProducao?.incluirPedidosPrevistos ?? true,
      percentualPedidosPrevistos: configuracoesProducao?.percentualPedidosPrevistos ?? 15,
    },
  });

  useEffect(() => {
    if (configuracoesProducao) {
      form.reset({
        coberturaAlvoDias: configuracoesProducao.coberturaAlvoDias ?? 3,
        unidadesPorForma: configuracoesProducao.unidadesPorForma,
        formasPorLote: configuracoesProducao.formasPorLote,
        formasPorFornada: configuracoesProducao.formasPorFornada,
        tempoMedioPorFornada: configuracoesProducao.tempoMedioPorFornada,
        incluirPedidosPrevistos: configuracoesProducao.incluirPedidosPrevistos,
        percentualPedidosPrevistos: configuracoesProducao.percentualPedidosPrevistos,
      });
    }
  }, [configuracoesProducao, form]);

  // Preview: média total + alvo total
  const coberturaWatch = form.watch("coberturaAlvoDias");
  const totalMediaSemanal = Object.values(mediaVendasPorProduto).reduce((s, v) => s + (v || 0), 0);
  const previewAlvoTotal = Math.round((totalMediaSemanal * coberturaWatch) / 7);

  const onSubmit = (data: SetupFormData) => {
    const next: ConfiguracoesProducao = {
      ...configuracoesProducao,
      coberturaAlvoDias: data.coberturaAlvoDias,
      unidadesPorForma: data.unidadesPorForma,
      formasPorLote: data.formasPorLote,
      formasPorFornada: data.formasPorFornada,
      tempoMedioPorFornada: data.tempoMedioPorFornada,
      incluirPedidosPrevistos: data.incluirPedidosPrevistos,
      percentualPedidosPrevistos: data.percentualPedidosPrevistos,
      unidadesBrowniePorForma: configuracoesProducao?.unidadesBrowniePorForma ?? 16,
    };
    atualizarConfiguracoesProducao(next);
    toast({ title: "Setup atualizado", description: "Parâmetros do PCP foram salvos." });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Estoque Alvo */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Estoque Alvo</CardTitle>
            </div>
            <CardDescription>
              Estoque com que a fábrica fecha na sexta — é o estoque com que a próxima semana abre,
              cobrindo segunda a quarta sem produção. Defina quantos dias de demanda média manter como colchão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <FormField
                control={form.control}
                name="coberturaAlvoDias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cobertura alvo (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={14}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Recomendado: 3 dias (cobre seg/ter/qua até a próxima leva).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                <p className="text-muted-foreground">Pré-visualização</p>
                <p>
                  Média total semanal:{" "}
                  <strong>{Math.round(totalMediaSemanal)} un</strong>
                </p>
                <p>
                  Alvo total para {coberturaWatch} {coberturaWatch === 1 ? "dia" : "dias"}:{" "}
                  <strong className="text-primary">{previewAlvoTotal} un</strong>
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  Cálculo por produto: <code>média_semanal × dias ÷ 7</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros gerais */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle>Parâmetros de Produção</CardTitle>
            </div>
            <CardDescription>
              Configurações compartilhadas com a tela de Configurações → Produção.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="unidadesPorForma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades por forma</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
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
                      <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
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
                      <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tempoMedioPorFornada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo médio por fornada (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="incluirPedidosPrevistos"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>Incluir pedidos previstos</FormLabel>
                    <FormDescription>Considerar pedidos previstos no cálculo de produção.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                      <Input type="number" min={0} max={100} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Salvar Setup</Button>
        </div>
      </form>
    </Form>
  );
}