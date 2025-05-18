
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useConfigStore } from "@/hooks/useConfigStore";
import { 
  StatusCliente, 
  DiaSemana, 
  TipoLogisticaNome, 
  TipoCobranca, 
  FormaPagamentoNome 
} from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import DiasSemanaPicker from "./DiasSemanaPicker";
import { Textarea } from "@/components/ui/textarea";

type ClienteFormValues = {
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  quantidadePadrao: number;
  periodicidadePadrao: number;
  statusCliente: StatusCliente;
  observacoes?: string;
  // Novos campos
  janelasEntrega: DiaSemana[];
  representanteId?: number;
  rotaEntregaId?: number;
  categoriaEstabelecimentoId?: number;
  instrucoesEntrega?: string;
  contabilizarGiroMedio: boolean;
  tipoLogistica: TipoLogisticaNome;  // Changed to TipoLogisticaNome
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;  // Changed to FormaPagamentoNome
};

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId?: number; // Para edição
}

export default function ClienteFormDialog({
  open,
  onOpenChange,
  clienteId,
}: ClienteFormDialogProps) {
  const { adicionarCliente, atualizarCliente, getClientePorId } = useClienteStore();
  const { 
    getRepresentanteAtivo,
    getRotaAtiva,
    getCategoriaAtiva
  } = useConfigStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get active configuration options
  const representantes = getRepresentanteAtivo();
  const rotas = getRotaAtiva();
  const categorias = getCategoriaAtiva();

  const form = useForm<ClienteFormValues>({
    defaultValues: {
      nome: "",
      cnpjCpf: "",
      enderecoEntrega: "",
      contatoNome: "",
      contatoTelefone: "",
      contatoEmail: "",
      quantidadePadrao: 20,
      periodicidadePadrao: 7,
      statusCliente: "A ativar",
      observacoes: "",
      // Valores padrão para os novos campos
      janelasEntrega: ['Seg', 'Qua', 'Sex'],
      representanteId: representantes.length > 0 ? representantes[0].id : undefined,
      rotaEntregaId: rotas.length > 0 ? rotas[0].id : undefined,
      categoriaEstabelecimentoId: categorias.length > 0 ? categorias[0].id : undefined,
      instrucoesEntrega: "",
      contabilizarGiroMedio: true,
      tipoLogistica: "Própria",
      emiteNotaFiscal: true,
      tipoCobranca: "À vista",
      formaPagamento: "Boleto",
    },
  });

  // Carregar dados do cliente se for edição
  useEffect(() => {
    if (clienteId && open) {
      const cliente = getClientePorId(clienteId);
      if (cliente) {
        form.reset({
          nome: cliente.nome,
          cnpjCpf: cliente.cnpjCpf || "",
          enderecoEntrega: cliente.enderecoEntrega || "",
          contatoNome: cliente.contatoNome || "",
          contatoTelefone: cliente.contatoTelefone || "",
          contatoEmail: cliente.contatoEmail || "",
          quantidadePadrao: cliente.quantidadePadrao,
          periodicidadePadrao: cliente.periodicidadePadrao,
          statusCliente: cliente.statusCliente,
          observacoes: cliente.observacoes || "",
          // Novos campos
          janelasEntrega: cliente.janelasEntrega || ['Seg', 'Qua', 'Sex'],
          representanteId: cliente.representanteId,
          rotaEntregaId: cliente.rotaEntregaId,
          categoriaEstabelecimentoId: cliente.categoriaEstabelecimentoId,
          instrucoesEntrega: cliente.instrucoesEntrega || "",
          contabilizarGiroMedio: cliente.contabilizarGiroMedio ?? true,
          tipoLogistica: cliente.tipoLogistica,
          emiteNotaFiscal: cliente.emiteNotaFiscal ?? true,
          tipoCobranca: cliente.tipoCobranca || "À vista",
          formaPagamento: cliente.formaPagamento,
        });
      }
    }
  }, [clienteId, open, getClientePorId, form]);

  const onSubmit = (data: ClienteFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (clienteId) {
        atualizarCliente(clienteId, {
          ...data,
          quantidadePadrao: Number(data.quantidadePadrao),
          periodicidadePadrao: Number(data.periodicidadePadrao),
        });
        
        toast({
          title: "Cliente atualizado com sucesso",
          description: `O cliente ${data.nome} foi atualizado.`,
        });
      } else {
        adicionarCliente({
          ...data,
          quantidadePadrao: Number(data.quantidadePadrao),
          periodicidadePadrao: Number(data.periodicidadePadrao),
        });
        
        toast({
          title: "Cliente cadastrado com sucesso",
          description: `O cliente ${data.nome} foi adicionado.`,
        });
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: clienteId ? "Erro ao atualizar cliente" : "Erro ao cadastrar cliente",
        description: "Ocorreu um erro ao tentar salvar os dados do cliente.",
        variant: "destructive",
      });
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{clienteId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {clienteId ? "Atualize os dados do ponto de venda." : "Adicione um novo ponto de venda para seus produtos."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados Básicos</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome*</FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpjCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ/CPF</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="enderecoEntrega"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço de Entrega</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rua, número, bairro, cidade, UF" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <h3 className="text-lg font-medium pt-2">Dados de Contato</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="contatoNome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contatoTelefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contatoEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <h3 className="text-lg font-medium pt-2">Configuração de Reposição</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quantidadePadrao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade Padrão*</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="periodicidadePadrao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periodicidade (dias)*</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statusCliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          {...field}
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Em análise">Em análise</option>
                          <option value="Inativo">Inativo</option>
                          <option value="A ativar">A ativar</option>
                          <option value="Standby">Standby</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Novo: Janela de Entrega */}
              <h3 className="text-lg font-medium pt-2">Janela de Entrega</h3>
              <FormField
                control={form.control}
                name="janelasEntrega"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias disponíveis para entrega</FormLabel>
                    <FormControl>
                      <DiasSemanaPicker 
                        value={field.value} 
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Novo: Configuração de Entrega */}
              <h3 className="text-lg font-medium pt-2">Configuração de Entrega</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Representante */}
                <FormField
                  control={form.control}
                  name="representanteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Representante Responsável</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">Selecione um representante</option>
                          {representantes.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.nome}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rota */}
                <FormField
                  control={form.control}
                  name="rotaEntregaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rota de Entrega</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">Selecione uma rota</option>
                          {rotas.map(rota => (
                            <option key={rota.id} value={rota.id}>{rota.nome}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Categoria e Instruções */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Categoria */}
                <FormField
                  control={form.control}
                  name="categoriaEstabelecimentoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria de Estabelecimento</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">Selecione uma categoria</option>
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nome}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Toggle Contabilizar Giro */}
                <FormField
                  control={form.control}
                  name="contabilizarGiroMedio"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Contabilizar no giro médio geral</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Se desabilitado, este cliente não entrará no cálculo geral
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
              </div>

              {/* Instruções de Entrega */}
              <FormField
                control={form.control}
                name="instrucoesEntrega"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções de Entrega</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações importantes para entregas (horários, acesso, portarias, etc)" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Novo: Configurações Adicionais */}
              <h3 className="text-lg font-medium pt-2">Configurações Adicionais</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Tipo de Logística */}
                <FormField
                  control={form.control}
                  name="tipoLogistica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logística</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          {...field}
                        >
                          <option value="Própria">Própria</option>
                          <option value="Distribuição">Distribuição</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Nota Fiscal */}
                <FormField
                  control={form.control}
                  name="emiteNotaFiscal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota Fiscal</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={field.value ? "sim" : "nao"}
                          onChange={e => field.onChange(e.target.value === "sim")}
                        >
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Cobrança */}
                <FormField
                  control={form.control}
                  name="tipoCobranca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cobrança</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          {...field}
                        >
                          <option value="À vista">À vista</option>
                          <option value="Consignado">Consignado</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Forma de Pagamento */}
              <FormField
                control={form.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        {...field}
                      >
                        <option value="Boleto">Boleto</option>
                        <option value="PIX">PIX</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : clienteId ? "Atualizar Cliente" : "Salvar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
