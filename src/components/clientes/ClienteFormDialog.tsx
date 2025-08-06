import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import CategoriasProdutoSelector from "./CategoriasProdutoSelector";
import DiasSemanaPicker from "./DiasSemanaPicker";
import { Cliente, StatusCliente } from "@/types";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useCategoriaStore } from "@/hooks/useCategoriaStore";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useSupabaseRotasEntrega } from "@/hooks/useSupabaseRotasEntrega";
import { useSupabaseCategoriasEstabelecimento } from "@/hooks/useSupabaseCategoriasEstabelecimento";
import { useSupabaseTiposLogistica } from "@/hooks/useSupabaseTiposLogistica";
import { useSupabaseFormasPagamento } from "@/hooks/useSupabaseFormasPagamento";
import { useSupabaseTiposCobranca } from "@/hooks/useSupabaseTiposCobranca";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

const clienteFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpjCpf: z.string().optional(),
  enderecoEntrega: z.string().optional(),
  linkGoogleMaps: z.string().optional(),
  contatoNome: z.string().optional(),
  contatoTelefone: z.string().optional(),
  contatoEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  quantidadePadrao: z.number().min(1, "Quantidade deve ser maior que 0"),
  periodicidadePadrao: z.number().min(1, "Periodicidade deve ser maior que 0"),
  statusCliente: z.enum(["Ativo", "Inativo", "Prospecto", "Em análise", "A ativar", "Standby"]),
  metaGiroSemanal: z.number().min(0, "Meta deve ser maior ou igual a 0"),
  representanteId: z.number().optional(),
  rotaEntregaId: z.number().optional(),
  categoriaEstabelecimentoId: z.number().optional(),
  tipoLogistica: z.string(),
  emiteNotaFiscal: z.boolean(),
  tipoCobranca: z.string(),
  formaPagamento: z.string(),
  contabilizarGiroMedio: z.boolean(),
  observacoes: z.string().optional(),
  categoriaId: z.number().min(1, "Categoria é obrigatória"),
  subcategoriaId: z.number().min(1, "Subcategoria é obrigatória"),
  categoriasHabilitadas: z.array(z.number()),
});

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId?: string;
  onClienteUpdate?: () => void;
}

export default function ClienteFormDialog({ 
  open, 
  onOpenChange, 
  clienteId,
  onClienteUpdate 
}: ClienteFormDialogProps) {
  const { criarCliente, atualizarCliente, obterClientePorId } = useClienteStore();
  const { categorias } = useCategoriaStore();
  const { representantes } = useSupabaseRepresentantes();
  const { rotas } = useSupabaseRotasEntrega();
  const { categorias: categoriasEstabelecimento } = useSupabaseCategoriasEstabelecimento();
  const { tipos: tiposLogistica } = useSupabaseTiposLogistica();
  const { formas: formasPagamento } = useSupabaseFormasPagamento();
  const { tipos: tiposCobranca } = useSupabaseTiposCobranca();
  
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);

  const form = useForm<z.infer<typeof clienteFormSchema>>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nome: "",
      cnpjCpf: "",
      enderecoEntrega: "",
      linkGoogleMaps: "",
      contatoNome: "",
      contatoTelefone: "",
      contatoEmail: "",
      quantidadePadrao: 1,
      periodicidadePadrao: 7,
      statusCliente: "Ativo",
      metaGiroSemanal: 0,
      representanteId: undefined,
      rotaEntregaId: undefined,
      categoriaEstabelecimentoId: undefined,
      tipoLogistica: "",
      emiteNotaFiscal: false,
      tipoCobranca: "",
      formaPagamento: "",
      contabilizarGiroMedio: true,
      observacoes: "",
      categoriaId: 0,
      subcategoriaId: 0,
      categoriasHabilitadas: [],
    }
  });

  useEffect(() => {
    if (open && clienteId) {
      const carregarCliente = async () => {
        const clienteData = await obterClientePorId(clienteId);
        if (clienteData) {
          setCliente(clienteData);
          form.reset({
            nome: clienteData.nome,
            cnpjCpf: clienteData.cnpjCpf || "",
            enderecoEntrega: clienteData.enderecoEntrega || "",
            linkGoogleMaps: clienteData.linkGoogleMaps || "",
            contatoNome: clienteData.contatoNome || "",
            contatoTelefone: clienteData.contatoTelefone || "",
            contatoEmail: clienteData.contatoEmail || "",
            quantidadePadrao: clienteData.quantidadePadrao,
            periodicidadePadrao: clienteData.periodicidadePadrao,
            statusCliente: clienteData.statusCliente,
            metaGiroSemanal: clienteData.metaGiroSemanal,
            representanteId: clienteData.representanteId,
            rotaEntregaId: clienteData.rotaEntregaId,
            categoriaEstabelecimentoId: clienteData.categoriaEstabelecimentoId,
            tipoLogistica: clienteData.tipoLogistica,
            emiteNotaFiscal: clienteData.emiteNotaFiscal,
            tipoCobranca: clienteData.tipoCobranca,
            formaPagamento: clienteData.formaPagamento,
            contabilizarGiroMedio: clienteData.contabilizarGiroMedio,
            observacoes: clienteData.observacoes || "",
            categoriaId: clienteData.categoriaId,
            subcategoriaId: clienteData.subcategoriaId,
            categoriasHabilitadas: clienteData.categoriasHabilitadas,
          });
        }
      };
      carregarCliente();
    } else if (open && !clienteId) {
      setCliente(null);
      form.reset();
    }
  }, [open, clienteId, obterClientePorId, form]);

  const onSubmit = async (data: z.infer<typeof clienteFormSchema>) => {
    setLoading(true);
    try {
      const clienteData = {
        nome: data.nome,
        cnpjCpf: data.cnpjCpf || "",
        enderecoEntrega: data.enderecoEntrega || "",
        linkGoogleMaps: data.linkGoogleMaps || "",
        contatoNome: data.contatoNome || "",
        contatoTelefone: data.contatoTelefone || "",
        contatoEmail: data.contatoEmail || "",
        quantidadePadrao: data.quantidadePadrao,
        periodicidadePadrao: data.periodicidadePadrao,
        statusCliente: data.statusCliente,
        metaGiroSemanal: data.metaGiroSemanal,
        representanteId: data.representanteId,
        rotaEntregaId: data.rotaEntregaId,
        categoriaEstabelecimentoId: data.categoriaEstabelecimentoId,
        tipoLogistica: data.tipoLogistica,
        emiteNotaFiscal: data.emiteNotaFiscal,
        tipoCobranca: data.tipoCobranca,
        formaPagamento: data.formaPagamento,
        contabilizarGiroMedio: data.contabilizarGiroMedio,
        observacoes: data.observacoes || "",
        categoriaId: data.categoriaId,
        subcategoriaId: data.subcategoriaId,
        categoriasHabilitadas: data.categoriasHabilitadas,
        ativo: data.statusCliente === "Ativo",
        janelasEntrega: [],
        instrucoesEntrega: "",
        ultimaDataReposicaoEfetiva: undefined,
        statusAgendamento: "",
        proximaDataReposicao: undefined,
        dataCadastro: new Date(),
        giroMedioSemanal: 0
      };

      if (clienteId) {
        await atualizarCliente(clienteId, clienteData);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await criarCliente(clienteData);
        toast.success("Cliente criado com sucesso!");
      }
      
      onClienteUpdate?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {clienteId ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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

              <FormField
                control={form.control}
                name="enderecoEntrega"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Endereço de Entrega</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkGoogleMaps"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      Link do Google Maps
                      <ExternalLink className="h-4 w-4" />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="https://maps.app.goo.gl/..." 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informações de Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações de Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>

            {/* Configurações de Pedido */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações de Pedido</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="quantidadePadrao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade Padrão *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
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
                      <FormLabel>Periodicidade (dias) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
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
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="Prospecto">Prospecto</SelectItem>
                          <SelectItem value="Em análise">Em análise</SelectItem>
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
                  name="metaGiroSemanal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Giro Semanal</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Selectores de Configuração */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações Adicionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="representanteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Representante</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {representantes.map((representante) => (
                            <SelectItem key={representante.id} value={String(representante.id)}>
                              {representante.nome}
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
                  name="rotaEntregaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rota de Entrega</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rotas.map((rota) => (
                            <SelectItem key={rota.id} value={String(rota.id)}>
                              {rota.nome}
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
                  name="categoriaEstabelecimentoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria Estabelecimento</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriasEstabelecimento.map((categoria) => (
                            <SelectItem key={categoria.id} value={String(categoria.id)}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoLogistica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Logística</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposLogistica.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.nome}>
                              {tipo.nome}
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
                  name="tipoCobranca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cobrança</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposCobranca.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.nome}>
                              {tipo.nome}
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
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {formasPagamento.map((forma) => (
                            <SelectItem key={forma.id} value={forma.nome}>
                              {forma.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Checkboxes e Switch */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Outras Configurações</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emiteNotaFiscal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Emitir Nota Fiscal</FormLabel>
                        <FormDescription>
                          Marque se o cliente precisa de nota fiscal.
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

                <FormField
                  control={form.control}
                  name="contabilizarGiroMedio"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Contabilizar Giro Médio</FormLabel>
                        <FormDescription>
                          Incluir este cliente no cálculo do giro médio.
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
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Observações</h3>
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Categorias e Subcategorias */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Categorias e Subcategorias</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoriaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          // setSubcategoriaId(null); // Reset subcategoria when category changes
                        }}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={String(categoria.id)}>
                              {categoria.nome}
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
                  name="subcategoriaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoria *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias
                            .find((categoria) => categoria.id === form.getValues("categoriaId"))
                            ?.subcategorias?.map((subcategoria) => (
                              <SelectItem key={subcategoria.id} value={String(subcategoria.id)}>
                                {subcategoria.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Categorias Habilitadas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Categorias Habilitadas</h3>
              <FormField
                control={form.control}
                name="categoriasHabilitadas"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CategoriasProdutoSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : clienteId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
