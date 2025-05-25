import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useClientesSupabase } from "@/hooks/useClientesSupabase";
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
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import DiasSemanaPicker from "./DiasSemanaPicker";
import { Textarea } from "@/components/ui/textarea";
import CategoriasProdutoSelector from "./CategoriasProdutoSelector";

type ClienteFormValues = {
  nome: string;
  cnpj_cpf?: string;
  endereco_entrega?: string;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  quantidade_padrao: number;
  periodicidade_padrao: number;
  status_cliente: StatusCliente;
  observacoes?: string;
  // Novos campos
  janelas_entrega: DiaSemana[];
  representante_id?: number;
  rota_entrega_id?: number;
  categoria_estabelecimento_id?: number;
  instrucoes_entrega?: string;
  contabilizar_giro_medio: boolean;
  tipo_logistica: TipoLogisticaNome;
  emite_nota_fiscal: boolean;
  tipo_cobranca: TipoCobranca;
  forma_pagamento: FormaPagamentoNome;
  categoriasHabilitadas: number[]; // New field for enabled categories
};

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId?: string; // Para edição
}

export default function ClienteFormDialog({
  open,
  onOpenChange,
  clienteId,
}: ClienteFormDialogProps) {
  const { addCliente, updateCliente, clientes } = useClientesSupabase();
  const { 
    getRepresentanteAtivo,
    getRotaAtiva,
    getCategoriaAtiva
  } = useConfigStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get active configuration options
  const representantes = getRepresentanteAtivo();
  const rotas = getRotaAtiva();
  const categorias = getCategoriaAtiva();

  const form = useForm<ClienteFormValues>({
    defaultValues: {
      nome: "",
      cnpj_cpf: "",
      endereco_entrega: "",
      contato_nome: "",
      contato_telefone: "",
      contato_email: "",
      quantidade_padrao: 20,
      periodicidade_padrao: 7,
      status_cliente: "A ativar",
      observacoes: "",
      // Valores padrão para os novos campos
      janelas_entrega: ['Seg', 'Qua', 'Sex'],
      representante_id: representantes.length > 0 ? representantes[0].id : undefined,
      rota_entrega_id: rotas.length > 0 ? rotas[0].id : undefined,
      categoria_estabelecimento_id: categorias.length > 0 ? categorias[0].id : undefined,
      instrucoes_entrega: "",
      contabilizar_giro_medio: true,
      tipo_logistica: "Própria",
      emite_nota_fiscal: true,
      tipo_cobranca: "À vista",
      forma_pagamento: "Boleto",
      categoriasHabilitadas: [1], // Default to "Revenda Padrão"
    },
  });

  // Carregar dados do cliente se for edição
  useEffect(() => {
    if (clienteId && open) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        form.reset({
          nome: cliente.nome,
          cnpj_cpf: cliente.cnpj_cpf || "",
          endereco_entrega: cliente.endereco_entrega || "",
          contato_nome: cliente.contato_nome || "",
          contato_telefone: cliente.contato_telefone || "",
          contato_email: cliente.contato_email || "",
          quantidade_padrao: cliente.quantidade_padrao || 20,
          periodicidade_padrao: cliente.periodicidade_padrao || 7,
          status_cliente: cliente.status_cliente || "A ativar",
          observacoes: cliente.observacoes || "",
          // Novos campos
          janelas_entrega: (cliente.janelas_entrega as DiaSemana[]) || ['Seg', 'Qua', 'Sex'],
          representante_id: cliente.representante_id,
          rota_entrega_id: cliente.rota_entrega_id,
          categoria_estabelecimento_id: cliente.categoria_estabelecimento_id,
          instrucoes_entrega: cliente.instrucoes_entrega || "",
          contabilizar_giro_medio: cliente.contabilizar_giro_medio ?? true,
          tipo_logistica: cliente.tipo_logistica || "Própria",
          emite_nota_fiscal: cliente.emite_nota_fiscal ?? true,
          tipo_cobranca: cliente.tipo_cobranca || "À vista",
          forma_pagamento: cliente.forma_pagamento || "Boleto",
          categoriasHabilitadas: [1], // TODO: implement this field in Supabase
        });
      }
    }
  }, [clienteId, open, clientes, form]);

  const onSubmit = async (data: ClienteFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (clienteId) {
        await updateCliente(clienteId, {
          ...data,
          quantidade_padrao: Number(data.quantidade_padrao),
          periodicidade_padrao: Number(data.periodicidade_padrao),
        });
        
        toast.success(`Cliente ${data.nome} atualizado com sucesso.`);
      } else {
        await addCliente({
          ...data,
          quantidade_padrao: Number(data.quantidade_padrao),
          periodicidade_padrao: Number(data.periodicidade_padrao),
          ativo: data.status_cliente === 'Ativo',
          giro_medio_semanal: 0 // Add required field
        });
        
        toast.success(`Cliente ${data.nome} cadastrado com sucesso.`);
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(clienteId ? "Erro ao atualizar cliente" : "Erro ao cadastrar cliente");
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
                  name="cnpj_cpf"
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
                name="endereco_entrega"
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

              {/* ... keep existing code (contact data section) */}
              <h3 className="text-lg font-medium pt-2">Dados de Contato</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="contato_nome"
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
                  name="contato_telefone"
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
                  name="contato_email"
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

              {/* ... keep existing code (reposition configuration section) */}
              <h3 className="text-lg font-medium pt-2">Configuração de Reposição</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quantidade_padrao"
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
                  name="periodicidade_padrao"
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
                  name="status_cliente"
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

              {/* ... keep existing code (delivery window section and other fields) */}
              <h3 className="text-lg font-medium pt-2">Janela de Entrega</h3>
              <FormField
                control={form.control}
                name="janelas_entrega"
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
                  name="representante_id"
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
                  name="rota_entrega_id"
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
                  name="categoria_estabelecimento_id"
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
                  name="contabilizar_giro_medio"
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
                name="instrucoes_entrega"
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
                  name="tipo_logistica"
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
                  name="emite_nota_fiscal"
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
                  name="tipo_cobranca"
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
                name="forma_pagamento"
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
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : clienteId ? "Atualizar" : "Criar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
