
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProdutoStore } from '@/hooks/useProdutoStore';
import { useConfigStore } from '@/hooks/useConfigStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type RegistroProducaoForm = {
  produtoId: number;
  formasProduzidas: number;
  dataProducao: Date;
  turno?: string;
  observacoes?: string;
};

export default function RegistroManualProducao() {
  const { produtos } = useProdutoStore();
  const { unidadesPorForma } = useConfigStore(state => state.parametrosProducao);
  const [registrando, setRegistrando] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistroProducaoForm>({
    defaultValues: {
      produtoId: 0,
      formasProduzidas: 1,
      dataProducao: new Date(),
      turno: '',
      observacoes: '',
    },
  });

  const handleSubmit = (data: RegistroProducaoForm) => {
    setRegistrando(true);
    
    // Simulando o envio e resposta do servidor
    setTimeout(() => {
      // Aqui seria a integração com o back-end
      const produtoNome = produtos.find(p => p.id === data.produtoId)?.nome;
      const unidadesProduzidas = data.formasProduzidas * unidadesPorForma;
      
      toast({
        title: 'Produção registrada com sucesso!',
        description: `${data.formasProduzidas} formas (${unidadesProduzidas} unidades) de ${produtoNome} em ${format(data.dataProducao, 'dd/MM/yyyy')}`,
      });
      
      form.reset();
      setRegistrando(false);
    }, 1000);
  };

  // Calcular unidades produzidas com base nas formas e unidades por forma
  const calcularUnidades = () => {
    const formas = form.watch('formasProduzidas') || 0;
    return formas * unidadesPorForma;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro Manual de Produção</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="produtoId"
                rules={{ required: "Selecione um produto" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value ? field.value.toString() : ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {produtos.map(produto => (
                          <SelectItem key={produto.id} value={produto.id.toString()}>
                            {produto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formasProduzidas"
                rules={{ 
                  required: "Informe a quantidade de formas",
                  min: { value: 1, message: "Mínimo de 1 forma" }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formas produzidas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground mt-1">
                      Equivale a {calcularUnidades()} unidades ({unidadesPorForma} por forma)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataProducao"
                rules={{ required: "Informe a data da produção" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da produção</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="turno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Matutino">Matutino</SelectItem>
                        <SelectItem value="Vespertino">Vespertino</SelectItem>
                        <SelectItem value="Noturno">Noturno</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre esta produção" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={registrando}>
                {registrando ? "Registrando..." : "Registrar produção"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
