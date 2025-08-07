
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

interface HistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registro?: any;
}

interface FormData {
  data_producao: Date;
  produto_nome: string;
  formas_producidas: number;
  turno?: string;
  observacoes?: string;
}

export function HistoricoProducaoModal({ isOpen, onClose, onSuccess, registro }: HistoricoModalProps) {
  const { produtos } = useSupabaseProdutos();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(registro?.data_producao ? new Date(registro.data_producao) : new Date());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      data_producao: registro?.data_producao ? new Date(registro.data_producao) : new Date(),
      produto_nome: registro?.produto_nome || "",
      formas_producidas: registro?.formas_producidas || 1,
      turno: registro?.turno || "",
      observacoes: registro?.observacoes || ""
    }
  });

  const formas = watch('formas_producidas') || 0;
  const unidadesPorForma = 30; // Configuração padrão
  const unidadesCalculadas = formas * unidadesPorForma;

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const registroData = {
        data_producao: format(selectedDate, 'yyyy-MM-dd'),
        produto_nome: data.produto_nome,
        formas_producidas: data.formas_producidas,
        unidades_calculadas: unidadesCalculadas,
        turno: data.turno || null,
        observacoes: data.observacoes || null,
        origem: 'Manual'
      };

      let error;

      if (registro?.id) {
        // Editando registro existente
        const { error: updateError } = await supabase
          .from('historico_producao')
          .update(registroData)
          .eq('id', registro.id);
        error = updateError;
      } else {
        // Criando novo registro
        const { error: insertError } = await supabase
          .from('historico_producao')
          .insert([registroData]);
        error = insertError;
      }

      if (error) {
        console.error('Erro ao salvar registro:', error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar o registro de produção",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: registro?.id ? "Registro atualizado" : "Registro criado",
        description: `Produção de ${data.formas_producidas} formas de ${data.produto_nome} registrada com sucesso`,
      });

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {registro?.id ? "Editar Registro de Produção" : "Novo Registro de Produção"}
          </DialogTitle>
          <DialogDescription>
            Registre a produção realizada com as informações detalhadas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_producao">Data da Produção</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setValue('data_producao', date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="produto_nome">Produto</Label>
              <Select 
                value={watch('produto_nome')} 
                onValueChange={(value) => setValue('produto_nome', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.nome}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.produto_nome && (
                <p className="text-sm text-red-500">Selecione um produto</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="formas_producidas">Formas Produzidas</Label>
              <Input
                type="number"
                min="1"
                {...register('formas_producidas', { 
                  required: 'Campo obrigatório',
                  min: { value: 1, message: 'Mínimo de 1 forma' },
                  valueAsNumber: true
                })}
              />
              <p className="text-sm text-muted-foreground">
                Equivale a {unidadesCalculadas} unidades ({unidadesPorForma} por forma)
              </p>
              {errors.formas_producidas && (
                <p className="text-sm text-red-500">{errors.formas_producidas.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="turno">Turno (opcional)</Label>
              <Select 
                value={watch('turno') || ''} 
                onValueChange={(value) => setValue('turno', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matutino">Matutino</SelectItem>
                  <SelectItem value="Vespertino">Vespertino</SelectItem>
                  <SelectItem value="Noturno">Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              {...register('observacoes')}
              placeholder="Informações adicionais sobre esta produção"
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : (registro?.id ? "Atualizar" : "Registrar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
