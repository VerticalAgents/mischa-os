import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useClienteStore } from "@/hooks/useClienteStore";
import { Cliente, StatusCliente, DiaSemana, TipoLogisticaNome, TipoCobranca, FormaPagamentoNome } from "@/types";
import ClienteCategoriasProdutos from "./ClienteCategoriasProdutos";

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
}

type ClienteFormData = {
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  quantidadePadrao: number;
  periodicidadePadrao: number;
  statusCliente: StatusCliente;
  instrucoesEntrega?: string;
  contabilizarGiroMedio: boolean;
  tipoLogistica: TipoLogisticaNome;
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;
  observacoes?: string;
  categoriasProdutos: number[];
};

const diasSemana: DiaSemana[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

export default function ClienteFormDialog({ open, onOpenChange, cliente }: ClienteFormDialogProps) {
  const { adicionarCliente, atualizarCliente } = useClienteStore();
  const [janelasEntregaSelecionadas, setJanelasEntregaSelecionadas] = useState<DiaSemana[]>([]);
  const [categoriasProdutosSelecionadas, setCategoriasProdutosSelecionadas] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ClienteFormData>({
    defaultValues: {
      quantidadePadrao: 0,
      periodicidadePadrao: 7,
      statusCliente: "Ativo",
      contabilizarGiroMedio: true,
      tipoLogistica: "Própria",
      emiteNotaFiscal: false,
      tipoCobranca: "À vista",
      formaPagamento: "Dinheiro",
      categoriasProdutos: [1] // Default to "Revenda Padrão"
    }
  });

  // Load client data when editing
  useEffect(() => {
    if (cliente) {
      reset({
        nome: cliente.nome,
        cnpjCpf: cliente.cnpjCpf || '',
        enderecoEntrega: cliente.enderecoEntrega || '',
        contatoNome: cliente.contatoNome || '',
        contatoTelefone: cliente.contatoTelefone || '',
        contatoEmail: cliente.contatoEmail || '',
        quantidadePadrao: cliente.quantidadePadrao,
        periodicidadePadrao: cliente.periodicidadePadrao,
        statusCliente: cliente.statusCliente,
        instrucoesEntrega: cliente.instrucoesEntrega || '',
        contabilizarGiroMedio: cliente.contabilizarGiroMedio,
        tipoLogistica: cliente.tipoLogistica,
        emiteNotaFiscal: cliente.emiteNotaFiscal,
        tipoCobranca: cliente.tipoCobranca,
        formaPagamento: cliente.formaPagamento,
        observacoes: cliente.observacoes || '',
        categoriasProdutos: cliente.categoriasProdutos || [1]
      });
      setJanelasEntregaSelecionadas(cliente.janelasEntrega || []);
      setCategoriasProdutosSelecionadas(cliente.categoriasProdutos || [1]);
    } else {
      reset({
        quantidadePadrao: 0,
        periodicidadePadrao: 7,
        statusCliente: "Ativo",
        contabilizarGiroMedio: true,
        tipoLogistica: "Própria",
        emiteNotaFiscal: false,
        tipoCobranca: "À vista",
        formaPagamento: "Dinheiro",
        categoriasProdutos: [1]
      });
      setJanelasEntregaSelecionadas([]);
      setCategoriasProdutosSelecionadas([1]);
    }
  }, [cliente, reset]);

  const onSubmit = (data: ClienteFormData) => {
    const clienteData = {
      ...data,
      janelasEntrega: janelasEntregaSelecionadas,
      categoriasProdutos: categoriasProdutosSelecionadas,
      ativo: data.statusCliente === 'Ativo',
      giroMedioSemanal: Math.round((data.quantidadePadrao / data.periodicidadePadrao) * 7)
    };

    if (cliente) {
      atualizarCliente(cliente.id, clienteData);
    } else {
      adicionarCliente(clienteData);
    }
    
    onOpenChange(false);
  };

  const toggleJanelaEntrega = (dia: DiaSemana) => {
    setJanelasEntregaSelecionadas(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {cliente ? 'Edite as informações do cliente' : 'Preencha as informações do novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...register("nome", { required: "Nome é obrigatório" })}
                className={errors.nome ? "border-red-500" : ""}
              />
              {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>}
            </div>

            <div>
              <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
              <Input id="cnpjCpf" {...register("cnpjCpf")} />
            </div>
          </div>

          <div>
            <Label htmlFor="enderecoEntrega">Endereço de Entrega</Label>
            <Textarea id="enderecoEntrega" {...register("enderecoEntrega")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contatoNome">Nome do Contato</Label>
              <Input id="contatoNome" {...register("contatoNome")} />
            </div>

            <div>
              <Label htmlFor="contatoTelefone">Telefone</Label>
              <Input id="contatoTelefone" {...register("contatoTelefone")} />
            </div>
          </div>

          <div>
            <Label htmlFor="contatoEmail">E-mail</Label>
            <Input id="contatoEmail" type="email" {...register("contatoEmail")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantidadePadrao">Quantidade Padrão *</Label>
              <Input
                id="quantidadePadrao"
                type="number"
                {...register("quantidadePadrao", { 
                  required: "Quantidade padrão é obrigatória",
                  valueAsNumber: true,
                  min: { value: 0, message: "Quantidade deve ser positiva" }
                })}
                className={errors.quantidadePadrao ? "border-red-500" : ""}
              />
              {errors.quantidadePadrao && <p className="text-sm text-red-500 mt-1">{errors.quantidadePadrao.message}</p>}
            </div>

            <div>
              <Label htmlFor="periodicidadePadrao">Periodicidade (dias) *</Label>
              <Input
                id="periodicidadePadrao"
                type="number"
                {...register("periodicidadePadrao", { 
                  required: "Periodicidade é obrigatória",
                  valueAsNumber: true,
                  min: { value: 1, message: "Periodicidade deve ser maior que 0" }
                })}
                className={errors.periodicidadePadrao ? "border-red-500" : ""}
              />
              {errors.periodicidadePadrao && <p className="text-sm text-red-500 mt-1">{errors.periodicidadePadrao.message}</p>}
            </div>

            <div>
              <Label htmlFor="statusCliente">Status *</Label>
              <Select 
                value={watch("statusCliente")} 
                onValueChange={(value) => setValue("statusCliente", value as StatusCliente)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="A ativar">A ativar</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                  <SelectItem value="Standby">Standby</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Categories Selection */}
          <ClienteCategoriasProdutos 
            categoriasSelecionadas={categoriasProdutosSelecionadas}
            onChange={setCategoriasProdutosSelecionadas}
          />

          {/* Delivery Windows */}
          <div>
            <Label className="text-base font-medium">Janelas de Entrega</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Selecione os dias da semana disponíveis para entrega
            </p>
            <div className="flex flex-wrap gap-2">
              {diasSemana.map(dia => (
                <div key={dia} className="flex items-center space-x-2">
                  <Checkbox
                    id={`janela-${dia}`}
                    checked={janelasEntregaSelecionadas.includes(dia)}
                    onCheckedChange={() => toggleJanelaEntrega(dia)}
                  />
                  <Label htmlFor={`janela-${dia}`} className="text-sm">{dia}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Business Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipoLogistica">Tipo de Logística</Label>
              <Select 
                value={watch("tipoLogistica")} 
                onValueChange={(value) => setValue("tipoLogistica", value as TipoLogisticaNome)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Própria">Própria</SelectItem>
                  <SelectItem value="Distribuição">Distribuição</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
              <Select 
                value={watch("tipoCobranca")} 
                onValueChange={(value) => setValue("tipoCobranca", value as TipoCobranca)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="À vista">À vista</SelectItem>
                  <SelectItem value="Consignado">Consignado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
            <Select 
              value={watch("formaPagamento")} 
              onValueChange={(value) => setValue("formaPagamento", value as FormaPagamentoNome)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Boleto">Boleto</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contabilizarGiroMedio"
                checked={watch("contabilizarGiroMedio")}
                onCheckedChange={(checked) => setValue("contabilizarGiroMedio", checked as boolean)}
              />
              <Label htmlFor="contabilizarGiroMedio">Contabilizar no giro médio</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emiteNotaFiscal"
                checked={watch("emiteNotaFiscal")}
                onCheckedChange={(checked) => setValue("emiteNotaFiscal", checked as boolean)}
              />
              <Label htmlFor="emiteNotaFiscal">Emite nota fiscal</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="instrucoesEntrega">Instruções de Entrega</Label>
            <Textarea id="instrucoesEntrega" {...register("instrucoesEntrega")} />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register("observacoes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (cliente ? 'Atualizar' : 'Salvar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
