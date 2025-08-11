
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";

interface RegistroProducaoForm {
  produtoId: string;
  formasProducidas: number;
  dataProducao: Date;
  observacoes?: string;
}

interface HistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  registro?: any | null;
}

export function HistoricoProducaoModal({ isOpen, onClose, onSuccess, registro }: HistoricoModalProps) {
  const { produtos } = useSupabaseProdutos();
  const { obterRendimentoPorProduto } = useRendimentosReceitaProduto();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(registro?.dataProducao || new Date());
  const [rendimentoAtual, setRendimentoAtual] = useState<number | null>(null);
  const [semRendimento, setSemRendimento] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<RegistroProducaoForm>({
    defaultValues: {
      dataProducao: registro?.dataProducao || new Date(),
      produtoId: registro?.produtoId || "",
      formasProducidas: registro?.formasProducidas || 1,
      observacoes: registro?.observacoes || ""
    }
  });

  const formas = watch('formasProducidas') || 0;
  const produtoId = watch('produtoId');
  const unidadesPrevistas = rendimentoAtual ? formas * rendimentoAtual : 0;

  // Buscar rendimento quando produto for selecionado
  useEffect(() => {
    console.log('useEffect executado - produtoId:', produtoId);
    
    if (!produtoId) {
      console.log('Nenhum produto selecionado - limpando rendimento');
      setRendimentoAtual(null);
      setSemRendimento(false);
      return;
    }

    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) {
      console.log('Produto não encontrado na lista');
      setRendimentoAtual(null);
      setSemRendimento(false);
      return;
    }

    console.log('Produto encontrado:', produto.nome);

    // Buscar rendimento na tabela rendimentos_receita_produto
    const rendimentoInfo = obterRendimentoPorProduto(produtoId);
    console.log('Rendimento obtido:', rendimentoInfo);
    
    if (rendimentoInfo && rendimentoInfo.rendimento > 0) {
      setRendimentoAtual(rendimentoInfo.rendimento);
      setSemRendimento(false);
      console.log(`Rendimento definido para ${produto.nome}: ${rendimentoInfo.rendimento} unidades por forma`);
    } else {
      setRendimentoAtual(null);
      setSemRendimento(true);
      console.log(`Nenhum rendimento encontrado para ${produto.nome}`);
    }
  }, [produtoId, produtos, obterRendimentoPorProduto]);

  const onSubmit = async (data: RegistroProducaoForm) => {
    try {
      if (!data.produtoId || data.produtoId.trim() === "") {
        toast({
          title: "Erro de validação",
          description: "Selecione um produto para registrar a produção",
          variant: "destructive",
        });
        return;
      }

      if (!rendimentoAtual) {
        toast({
          title: "Rendimento não definido",
          description: "Defina o rendimento deste produto em Precificação > Rendimentos antes de registrar a produção",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      const produtoSelecionado = produtos.find(p => p.id === data.produtoId);
      
      if (!produtoSelecionado) {
        toast({
          title: "Erro",
          description: "Produto não encontrado. Selecione um produto válido da lista.",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados com snapshot do rendimento
      const registroData = {
        dataProducao: selectedDate,
        produtoId: produtoSelecionado.id,
        produtoNome: produtoSelecionado.nome,
        formasProducidas: data.formasProducidas,
        unidadesCalculadas: unidadesPrevistas, // Manter compatibilidade
        turno: 'Matutino', // Valor padrão para compatibilidade com backend
        observacoes: data.observacoes || '',
        origem: 'Manual' as const,
        
        // Novos campos para snapshot
        rendimentoUsado: rendimentoAtual,
        unidadesPrevistas: unidadesPrevistas,
        status: 'Registrado'
      };

      console.log('Dados a serem salvos com snapshot:', registroData);

      onSuccess(registroData);

      toast({
        title: registro ? "Registro atualizado" : "Registro criado",
        description: `Produção de ${data.formasProducidas} formas de ${produtoSelecionado.nome} registrada (${unidadesPrevistas} unidades previstas, ${rendimentoAtual}/forma)`,
      });

      reset();
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

  const handleProdutoChange = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
      setValue('produtoId', produto.id);
    }
  };

  const isFormValid = produtoId && produtoId.trim() !== "" && formas > 0 && !semRendimento;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {registro ? "Editar Registro de Produção" : "Novo Registro de Produção"}
          </DialogTitle>
          <DialogDescription>
            Registre a produção planejada. A confirmação será feita posteriormente com validação de insumos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataProducao">Data da Produção</Label>
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
                        setValue('dataProducao', date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="produtoId">Produto *</Label>
              <Select 
                value={watch('produtoId')} 
                onValueChange={handleProdutoChange}
              >
                <SelectTrigger className={cn(
                  "",
                  errors.produtoId && "border-destructive"
                )}>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!produtoId || produtoId.trim() === "") && (
                <p className="text-sm text-destructive">Selecione um produto</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="formasProducidas">Formas Produzidas</Label>
              <Input
                type="number"
                min="1"
                {...register('formasProducidas', { 
                  required: 'Campo obrigatório',
                  min: { value: 1, message: 'Mínimo de 1 forma' },
                  valueAsNumber: true
                })}
              />
              {semRendimento ? (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-700">
                    <strong>Rendimento não definido.</strong> Defina em Precificação {'>'}  Rendimentos.
                  </p>
                </div>
              ) : rendimentoAtual ? (
                <p className="text-sm text-muted-foreground">
                  Equivale a <strong>{unidadesPrevistas} unidades</strong> ({rendimentoAtual} por forma)
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecione um produto para ver o rendimento
                </p>
              )}
              {errors.formasProducidas && (
                <p className="text-sm text-destructive">{errors.formasProducidas.message}</p>
              )}
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
            <Button 
              type="submit" 
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? "Salvando..." : (registro ? "Atualizar" : "Registrar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
