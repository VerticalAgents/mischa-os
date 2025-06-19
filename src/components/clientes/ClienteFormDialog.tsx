
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useSupabaseRotasEntrega } from "@/hooks/useSupabaseRotasEntrega";
import { useSupabaseCategoriasEstabelecimento } from "@/hooks/useSupabaseCategoriasEstabelecimento";
import { useSupabaseTiposLogistica } from "@/hooks/useSupabaseTiposLogistica";
import { useSupabaseFormasPagamento } from "@/hooks/useSupabaseFormasPagamento";
import { useSupabaseTiposCobranca } from "@/hooks/useSupabaseTiposCobranca";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
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
import CategoriasProdutoSelector from "./CategoriasProdutoSelector";
import PrecosPorCategoriaSelector from "./PrecosPorCategoriaSelector";

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
  janelasEntrega: DiaSemana[];
  representanteId?: number;
  rotaEntregaId?: number;
  categoriaEstabelecimentoId?: number;
  instrucoesEntrega?: string;
  contabilizarGiroMedio: boolean;
  tipoLogistica: TipoLogisticaNome;
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;
  categoriasHabilitadas: number[];
};

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
  onClienteUpdate,
}: ClienteFormDialogProps) {
  const { adicionarCliente, atualizarCliente, getClientePorId, carregarClientes } = useClienteStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [precosCategoria, setPrecosCategoria] = useState<{ categoria_id: number; preco_unitario: number }[]>([]);
  
  // Get active configuration options from Supabase
  const { representantes } = useSupabaseRepresentantes();
  const { rotasEntrega } = useSupabaseRotasEntrega();
  const { categorias } = useSupabaseCategoriasEstabelecimento();
  const { tiposLogistica } = useSupabaseTiposLogistica();
  const { formasPagamento } = useSupabaseFormasPagamento();
  const { tiposCobranca } = useSupabaseTiposCobranca();
  const { carregarPrecosPorCliente, salvarPrecos } = useSupabasePrecosCategoriaCliente();

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
      janelasEntrega: ['Seg', 'Qua', 'Sex'],
      representanteId: representantes.length > 0 ? representantes[0].id : undefined,
      rotaEntregaId: rotasEntrega.length > 0 ? rotasEntrega[0].id : undefined,
      categoriaEstabelecimentoId: categorias.length > 0 ? categorias[0].id : undefined,
      instrucoesEntrega: "",
      contabilizarGiroMedio: true,
      tipoLogistica: "Própria",
      emiteNotaFiscal: true,
      tipoCobranca: "À vista",
      formaPagamento: "Boleto",
      categoriasHabilitadas: [1],
    },
  });

  // Carregar dados do cliente se for edição
  useEffect(() => {
    if (clienteId && open) {
      const cliente = getClientePorId(clienteId);
      if (cliente) {
        console.log('Carregando dados do cliente para edição:', cliente);
        
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
          categoriasHabilitadas: cliente.categoriasHabilitadas || [1],
        });

        // Carregar preços por categoria existentes
        carregarPrecosPorCliente(clienteId).then(precos => {
          const precosMap = precos.map(p => ({
            categoria_id: p.categoria_id,
            preco_unitario: p.preco_unitario
          }));
          setPrecosCategoria(precosMap);
        });
      }
    } else if (open && !clienteId) {
      // Reset para novo cliente
      setPrecosCategoria([]);
      form.reset({
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
        janelasEntrega: ['Seg', 'Qua', 'Sex'],
        representanteId: representantes.length > 0 ? representantes[0].id : undefined,
        rotaEntregaId: rotasEntrega.length > 0 ? rotasEntrega[0].id : undefined,
        categoriaEstabelecimentoId: categorias.length > 0 ? categorias[0].id : undefined,
        instrucoesEntrega: "",
        contabilizarGiroMedio: true,
        tipoLogistica: "Própria",
        emiteNotaFiscal: true,
        tipoCobranca: "À vista",
        formaPagamento: "Boleto",
        categoriasHabilitadas: [1],
      });
    }
  }, [clienteId, open, getClientePorId, form, carregarPrecosPorCliente, representantes, rotasEntrega, categorias]);

  const onSubmit = async (data: ClienteFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log('Dados do formulário para salvar:', data);
      console.log('Preços por categoria:', precosCategoria);
      
      const dadosCliente = {
        ...data,
        quantidadePadrao: Number(data.quantidadePadrao),
        periodicidadePadrao: Number(data.periodicidadePadrao),
      };

      let clienteIdFinal = clienteId;

      if (clienteId) {
        // Atualização
        await atualizarCliente(clienteId, dadosCliente);
        clienteIdFinal = clienteId;
        
        toast({
          title: "Cliente atualizado com sucesso",
          description: `O cliente ${data.nome} foi atualizado.`,
        });
      } else {
        // Criação
        const novoCliente = await adicionarCliente({
          ...dadosCliente,
          ativo: data.statusCliente === 'Ativo',
          giroMedioSemanal: 0,
          categoriaId: 1,
          subcategoriaId: 1,
          contabilizarGiroMedio: data.contabilizarGiroMedio
        });
        
        // Para novos clientes, precisamos obter o ID do cliente criado
        // Como o hook não retorna o ID, vamos recarregar a lista e pegar o último cliente
        await carregarClientes();
        
        toast({
          title: "Cliente cadastrado com sucesso",
          description: `O cliente ${data.nome} foi adicionado.`,
        });
      }

      // Salvar preços por categoria se houver um cliente ID válido
      if (clienteIdFinal && precosCategoria.length > 0) {
        await salvarPrecos(clienteIdFinal, precosCategoria);
      }

      // Reload clients to ensure data consistency
      await carregarClientes();
      
      // Call the update callback if provided
      if (onClienteUpdate) {
        onClienteUpdate();
      }
      
      form.reset();
      setPrecosCategoria([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: clienteId ? "Erro ao atualizar cliente" : "Erro ao cadastrar cliente",
        description: "Ocorreu um erro ao tentar salvar os dados do cliente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrecosChange = (novosPpreos: { categoria_id: number; preco_unitario: number }[]) => {
    setPrecosCategoria(novosPpreos);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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

              {/* Categories Section */}
              <h3 className="text-lg font-medium pt-2">Categorias de Produtos</h3>
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

              {/* Preços por Categoria */}
              <PrecosPorCategoriaSelector
                categoriasHabilitadas={form.watch("categoriasHabilitadas")}
                precosIniciais={precosCategoria}
                onChange={handlePrecosChange}
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

              <h3 className="text-lg font-medium pt-2">Configuração de Entrega</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          {rotasEntrega.map(rota => (
                            <option key={rota.id} value={rota.id}>{rota.nome}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <h3 className="text-lg font-medium pt-2">Configurações Adicionais</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="tipoLogistica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logística</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          {tiposLogistica.map(tipo => (
                            <option key={tipo.id} value={tipo.nome}>{tipo.nome}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="tipoCobranca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cobrança</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          {tiposCobranca.map(tipo => (
                            <option key={tipo.id} value={tipo.nome}>{tipo.nome}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        {formasPagamento.map(forma => (
                          <option key={forma.id} value={forma.nome}>{forma.nome}</option>
                        ))}
                      </select>
                    </FormControl>
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
