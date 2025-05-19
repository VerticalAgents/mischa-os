import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClienteStore } from "@/hooks/cliente";
import { toast } from "sonner";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Cliente, StatusCliente } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteParaEditar?: Cliente;
}

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cnpjCpf: z.string().optional(),
  enderecoEntrega: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  contatoNome: z.string().min(2, "Nome do contato deve ter pelo menos 2 caracteres"),
  contatoTelefone: z.string().min(8, "Telefone deve ter pelo menos 8 caracteres"),
  contatoEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  quantidadePadrao: z.coerce.number().min(1, "Quantidade deve ser maior que zero"),
  periodicidadePadrao: z.coerce.number().min(1, "Periodicidade deve ser maior que zero"),
  statusCliente: z.enum(["Ativo", "Em análise", "Inativo", "A ativar", "Standby"]),
  janelasEntrega: z.array(z.string()).optional(),
  representanteId: z.coerce.number().optional(),
  rotaEntregaId: z.coerce.number().optional(),
  categoriaEstabelecimentoId: z.coerce.number().optional(),
  instrucoesEntrega: z.string().optional(),
  contabilizarGiroMedio: z.boolean().default(true),
  tipoLogistica: z.enum(["Própria", "Distribuição"]),
  emiteNotaFiscal: z.boolean().default(false),
  tipoCobranca: z.enum(["À vista", "Consignado"]),
  formaPagamento: z.enum(["Boleto", "PIX", "Dinheiro"]),
  observacoes: z.string().optional(),
});

export default function ClienteFormDialog({
  open,
  onOpenChange,
  clienteParaEditar,
}: ClienteFormDialogProps) {
  const { adicionarCliente, atualizarCliente } = useClienteStore();
  const [activeTab, setActiveTab] = useState("dados-basicos");
  const isEditMode = !!clienteParaEditar;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cnpjCpf: "",
      enderecoEntrega: "",
      contatoNome: "",
      contatoTelefone: "",
      contatoEmail: "",
      quantidadePadrao: 0,
      periodicidadePadrao: 7,
      statusCliente: "Em análise" as StatusCliente,
      janelasEntrega: [],
      representanteId: undefined,
      rotaEntregaId: undefined,
      categoriaEstabelecimentoId: undefined,
      instrucoesEntrega: "",
      contabilizarGiroMedio: true,
      tipoLogistica: "Própria",
      emiteNotaFiscal: false,
      tipoCobranca: "À vista",
      formaPagamento: "PIX",
      observacoes: "",
    },
  });

  // Preencher o formulário com os dados do cliente quando estiver em modo de edição
  useEffect(() => {
    if (clienteParaEditar) {
      form.reset({
        nome: clienteParaEditar.nome,
        cnpjCpf: clienteParaEditar.cnpjCpf || "",
        enderecoEntrega: clienteParaEditar.enderecoEntrega,
        contatoNome: clienteParaEditar.contatoNome,
        contatoTelefone: clienteParaEditar.contatoTelefone,
        contatoEmail: clienteParaEditar.contatoEmail || "",
        quantidadePadrao: clienteParaEditar.quantidadePadrao,
        periodicidadePadrao: clienteParaEditar.periodicidadePadrao,
        statusCliente: clienteParaEditar.statusCliente,
        janelasEntrega: clienteParaEditar.janelasEntrega || [],
        representanteId: clienteParaEditar.representanteId,
        rotaEntregaId: clienteParaEditar.rotaEntregaId,
        categoriaEstabelecimentoId: clienteParaEditar.categoriaEstabelecimentoId,
        instrucoesEntrega: clienteParaEditar.instrucoesEntrega || "",
        contabilizarGiroMedio: clienteParaEditar.contabilizarGiroMedio,
        tipoLogistica: clienteParaEditar.tipoLogistica,
        emiteNotaFiscal: clienteParaEditar.emiteNotaFiscal,
        tipoCobranca: clienteParaEditar.tipoCobranca,
        formaPagamento: clienteParaEditar.formaPagamento,
        observacoes: clienteParaEditar.observacoes || "",
      });
    } else {
      form.reset({
        nome: "",
        cnpjCpf: "",
        enderecoEntrega: "",
        contatoNome: "",
        contatoTelefone: "",
        contatoEmail: "",
        quantidadePadrao: 0,
        periodicidadePadrao: 7,
        statusCliente: "Em análise" as StatusCliente,
        janelasEntrega: [],
        representanteId: undefined,
        rotaEntregaId: undefined,
        categoriaEstabelecimentoId: undefined,
        instrucoesEntrega: "",
        contabilizarGiroMedio: true,
        tipoLogistica: "Própria",
        emiteNotaFiscal: false,
        tipoCobranca: "À vista",
        formaPagamento: "PIX",
        observacoes: "",
      });
    }
  }, [clienteParaEditar, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && clienteParaEditar) {
      atualizarCliente(clienteParaEditar.id, values);
      toast.success(`Cliente ${values.nome} atualizado com sucesso!`);
    } else {
      adicionarCliente(values);
      toast.success(`Cliente ${values.nome} adicionado com sucesso!`);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Edite os dados do cliente existente."
              : "Preencha os dados para adicionar um novo cliente."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
                <TabsTrigger value="comercial">Comercial</TabsTrigger>
                <TabsTrigger value="logistica">Logística</TabsTrigger>
              </TabsList>

              <TabsContent value="dados-basicos" className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Estabelecimento</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do PDV" {...field} />
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
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enderecoEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço de Entrega</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, bairro, cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="contatoNome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome" {...field} />
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
                          <Input placeholder="(00) 00000-0000" {...field} />
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
                          <Input placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="statusCliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Em análise">Em análise</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="A ativar">A ativar</SelectItem>
                          <SelectItem value="Standby">Standby</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais sobre o cliente"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="comercial" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidadePadrao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Padrão</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Quantidade padrão para reposição
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="periodicidadePadrao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Periodicidade (dias)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Intervalo em dias entre reposições
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contabilizarGiroMedio"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Contabilizar no Giro Médio</FormLabel>
                        <FormDescription>
                          Incluir este PDV no cálculo de giro médio semanal
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipoCobranca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cobrança</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="À vista">À vista</SelectItem>
                            <SelectItem value="Consignado">Consignado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="formaPagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Boleto">Boleto</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="emiteNotaFiscal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Emite Nota Fiscal</FormLabel>
                        <FormDescription>
                          Este PDV requer emissão de nota fiscal
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="logistica" className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipoLogistica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Logística</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Própria">Própria</SelectItem>
                          <SelectItem value="Distribuição">Distribuição</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rotaEntregaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rota de Entrega</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a rota" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Zona Norte</SelectItem>
                          <SelectItem value="2">Zona Sul</SelectItem>
                          <SelectItem value="3">Centro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="representanteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Representante</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o representante" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">João Silva</SelectItem>
                          <SelectItem value="2">Maria Oliveira</SelectItem>
                          <SelectItem value="3">Carlos Santos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoriaEstabelecimentoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Estabelecimento</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Café</SelectItem>
                          <SelectItem value="2">Padaria</SelectItem>
                          <SelectItem value="3">Mercado</SelectItem>
                          <SelectItem value="4">Restaurante</SelectItem>
                          <SelectItem value="5">Loja de Conveniência</SelectItem>
                          <SelectItem value="6">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instrucoesEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instruções de Entrega</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Instruções especiais para entrega"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditMode ? "Atualizar" : "Adicionar"} Cliente
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
