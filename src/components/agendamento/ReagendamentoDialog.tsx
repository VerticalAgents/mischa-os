
import { useState } from "react";
import { format, addDays, isWeekend, getDay, setHours } from "date-fns";
import { registrarReagendamentoEntreSemanas } from "@/utils/reagendamentoUtils";
import { Calendar, Clock } from "lucide-react";
import { Cliente } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";

interface ReagendamentoDialogProps {
  cliente: Cliente;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cliente: Cliente, novaData: Date) => void;
}

export default function ReagendamentoDialog({
  cliente,
  isOpen,
  onClose,
  onConfirm
}: ReagendamentoDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [tipoReagendamento, setTipoReagendamento] = useState<"automatico" | "manual">("automatico");
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const { obterAgendamento, salvarAgendamento } = useAgendamentoClienteStore();
  
  // Calculate 5 business days from today
  const calcularCincoDiasUteis = (): Date => {
    let data = new Date();
    let diasUteis = 0;
    
    while (diasUteis < 5) {
      data = addDays(data, 1);
      
      // Skip weekends
      if (!isWeekend(data)) {
        diasUteis++;
      }
    }
    
    return data;
  };
  
  const dataAutomatica = calcularCincoDiasUteis();
  
  const handleProsseguir = () => {
    if (tipoReagendamento === "manual" && !dataSelecionada) {
      toast({
        title: "Selecione uma data",
        description: "É necessário selecionar uma data para prosseguir",
        variant: "destructive"
      });
      return;
    }
    
    setStep(2);
  };
  
  const handleConfirmar = async () => {
    const novaData = tipoReagendamento === "automatico" ? dataAutomatica : dataSelecionada!;
    
    // Reset the hours to make sure the date is set to the beginning of the day
    const dataFormatada = setHours(new Date(novaData), 0);
    
    try {
      console.log('🔄 Iniciando reagendamento com preservação de dados:', {
        cliente: cliente.nome,
        novaData: format(dataFormatada, 'yyyy-MM-dd')
      });

      // Obter o agendamento atual do cliente para preservar TODOS os dados
      const agendamentoAtual = await obterAgendamento(cliente.id);
      
      if (agendamentoAtual) {
        // Registrar reagendamento entre semanas se aplicável
        if (agendamentoAtual.data_proxima_reposicao) {
          const dataOriginal = new Date(agendamentoAtual.data_proxima_reposicao);
          await registrarReagendamentoEntreSemanas(cliente.id, dataOriginal, dataFormatada);
        }

        console.log('✅ Preservando dados do agendamento:', {
          tipo: agendamentoAtual.tipo_pedido,
          itens: !!agendamentoAtual.itens_personalizados,
          quantidade: agendamentoAtual.quantidade_total
        });

        // Reagendar preservando TODOS os dados originais
        await salvarAgendamento(cliente.id, {
          status_agendamento: 'Agendado',
          data_proxima_reposicao: dataFormatada,
          quantidade_total: agendamentoAtual.quantidade_total,
          tipo_pedido: agendamentoAtual.tipo_pedido,
          itens_personalizados: agendamentoAtual.itens_personalizados
        });

        console.log('✅ Reagendamento concluído preservando configurações originais');
      } else {
        // Fallback se não houver agendamento existente
        await salvarAgendamento(cliente.id, {
          status_agendamento: 'Agendado',
          data_proxima_reposicao: dataFormatada,
          quantidade_total: cliente.quantidadePadrao || 0,
          tipo_pedido: 'Padrão'
        });
      }
      
      onConfirm(cliente, dataFormatada);
    } catch (error) {
      console.error('❌ Erro ao reagendar com preservação de dados:', error);
      // Fallback para o comportamento anterior
      onConfirm(cliente, dataFormatada);
    }
    
    resetForm();
  };
  
  const handleCancel = () => {
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    setStep(1);
    setTipoReagendamento("automatico");
    setDataSelecionada(undefined);
  };
  
  // Function to disable weekends in the calendar
  const disableWeekends = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };
  
  const getDataExibicao = (): string => {
    if (tipoReagendamento === "automatico") {
      return format(dataAutomatica, "dd/MM/yyyy");
    } else if (dataSelecionada) {
      return format(dataSelecionada, "dd/MM/yyyy");
    }
    return "Data não selecionada";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Reagendamento de Reposição" : "Confirmar Reagendamento"}
          </DialogTitle>
        </DialogHeader>
        
        {/* Step 1: Choose rescheduling type */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="font-medium mb-2">PDV: {cliente.nome}</div>
            
            <RadioGroup 
              value={tipoReagendamento} 
              onValueChange={(value) => setTipoReagendamento(value as "automatico" | "manual")}
              className="space-y-3"
            >
              <div className="flex items-start space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="automatico" id="automatico" />
                <div className="grid gap-1 w-full">
                  <Label htmlFor="automatico" className="font-medium cursor-pointer">
                    Reagendar automaticamente
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Data prevista: {format(dataAutomatica, "dd/MM/yyyy")} (5 dias úteis)
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="manual" id="manual" />
                <div className="grid gap-2 w-full">
                  <Label htmlFor="manual" className="font-medium cursor-pointer">
                    Selecionar data manualmente
                  </Label>
                  
                  {tipoReagendamento === "manual" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal mt-1",
                            !dataSelecionada && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dataSelecionada ? (
                            format(dataSelecionada, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" onInteractOutside={(e) => e.stopPropagation()}>
                        <CalendarComponent
                          mode="single"
                          selected={dataSelecionada}
                          onSelect={setDataSelecionada}
                          disabled={(date) => 
                            date < new Date() || disableWeekends(date)
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </RadioGroup>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleProsseguir}>
                Prosseguir
              </Button>
            </DialogFooter>
          </div>
        )}
        
        {/* Step 2: Confirm rescheduling */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="font-medium mb-2">PDV: {cliente.nome}</div>
            
            <div className="text-center p-4 border rounded-md bg-muted/30">
              <p>Deseja reagendar a próxima reposição para</p>
              <p className="text-xl font-semibold mt-2">{getDataExibicao()}</p>
              <p className="text-sm text-muted-foreground mt-2">
                O tipo de pedido e configurações personalizadas serão preservados.
              </p>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={handleConfirmar}>
                Confirmar Reagendamento
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
