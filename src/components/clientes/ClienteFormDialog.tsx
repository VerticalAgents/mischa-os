
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientesSupabase } from "@/hooks/useClientesSupabase";
import { StatusCliente, TipoLogisticaNome, TipoCobranca, FormaPagamentoNome } from "@/types";
import { toast } from "sonner";
import DiasSemanaPicker from "./DiasSemanaPicker";
import CategoriasProdutoSelector from "./CategoriasProdutoSelector";

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId?: string;
}

export default function ClienteFormDialog({ open, onOpenChange, clienteId }: ClienteFormDialogProps) {
  const { addCliente, updateCliente, clientes } = useClientesSupabase();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    cnpj_cpf: '',
    endereco_entrega: '',
    contato_nome: '',
    contato_telefone: '',
    contato_email: '',
    quantidade_padrao: 0,
    periodicidade_padrao: 7,
    status_cliente: 'Ativo',
    meta_giro_semanal: 0,
    status_agendamento: '',
    proxima_data_reposicao: '',
    janelas_entrega: null,
    representante_id: null,
    rota_entrega_id: null,
    categoria_estabelecimento_id: null,
    instrucoes_entrega: '',
    contabilizar_giro_medio: true,
    tipo_logistica: 'Própria',
    emite_nota_fiscal: true,
    tipo_cobranca: 'À vista',
    forma_pagamento: 'Boleto',
    observacoes: ''
  });

  // Load client data if editing
  useEffect(() => {
    if (clienteId && open) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setFormData({
          nome: cliente.nome || '',
          cnpj_cpf: cliente.cnpj_cpf || '',
          endereco_entrega: cliente.endereco_entrega || '',
          contato_nome: cliente.contato_nome || '',
          contato_telefone: cliente.contato_telefone || '',
          contato_email: cliente.contato_email || '',
          quantidade_padrao: cliente.quantidade_padrao || 0,
          periodicidade_padrao: cliente.periodicidade_padrao || 7,
          status_cliente: cliente.status_cliente || 'Ativo',
          meta_giro_semanal: cliente.meta_giro_semanal || 0,
          status_agendamento: cliente.status_agendamento || '',
          proxima_data_reposicao: cliente.proxima_data_reposicao || '',
          janelas_entrega: cliente.janelas_entrega,
          representante_id: cliente.representante_id,
          rota_entrega_id: cliente.rota_entrega_id,
          categoria_estabelecimento_id: cliente.categoria_estabelecimento_id,
          instrucoes_entrega: cliente.instrucoes_entrega || '',
          contabilizar_giro_medio: cliente.contabilizar_giro_medio ?? true,
          tipo_logistica: cliente.tipo_logistica || 'Própria',
          emite_nota_fiscal: cliente.emite_nota_fiscal ?? true,
          tipo_cobranca: cliente.tipo_cobranca || 'À vista',
          forma_pagamento: cliente.forma_pagamento || 'Boleto',
          observacoes: cliente.observacoes || ''
        });
      }
    }
  }, [clienteId, open, clientes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (clienteId) {
        await updateCliente(clienteId, formData);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await addCliente(formData);
        toast.success("Cliente adicionado com sucesso!");
      }
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar cliente");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj_cpf: '',
      endereco_entrega: '',
      contato_nome: '',
      contato_telefone: '',
      contato_email: '',
      quantidade_padrao: 0,
      periodicidade_padrao: 7,
      status_cliente: 'Ativo',
      meta_giro_semanal: 0,
      status_agendamento: '',
      proxima_data_reposicao: '',
      janelas_entrega: null,
      representante_id: null,
      rota_entrega_id: null,
      categoria_estabelecimento_id: null,
      instrucoes_entrega: '',
      contabilizar_giro_medio: true,
      tipo_logistica: 'Própria',
      emite_nota_fiscal: true,
      tipo_cobranca: 'À vista',
      forma_pagamento: 'Boleto',
      observacoes: ''
    });
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{clienteId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {clienteId ? 'Edite as informações do cliente' : 'Preencha as informações do novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="comercial">Comercial</TabsTrigger>
              <TabsTrigger value="logistica">Logística</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basico" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => updateFormData('nome', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpj_cpf">CNPJ/CPF</Label>
                  <Input
                    id="cnpj_cpf"
                    value={formData.cnpj_cpf}
                    onChange={(e) => updateFormData('cnpj_cpf', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco_entrega">Endereço de Entrega</Label>
                  <Input
                    id="endereco_entrega"
                    value={formData.endereco_entrega}
                    onChange={(e) => updateFormData('endereco_entrega', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contato_nome">Nome do Contato</Label>
                  <Input
                    id="contato_nome"
                    value={formData.contato_nome}
                    onChange={(e) => updateFormData('contato_nome', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contato_telefone">Telefone</Label>
                  <Input
                    id="contato_telefone"
                    value={formData.contato_telefone}
                    onChange={(e) => updateFormData('contato_telefone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contato_email">E-mail</Label>
                  <Input
                    id="contato_email"
                    type="email"
                    value={formData.contato_email}
                    onChange={(e) => updateFormData('contato_email', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="comercial" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status_cliente">Status</Label>
                  <Select
                    value={formData.status_cliente}
                    onValueChange={(value) => updateFormData('status_cliente', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Em análise">Em análise</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="A ativar">A ativar</SelectItem>
                      <SelectItem value="Standby">Standby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantidade_padrao">Quantidade Padrão</Label>
                  <Input
                    id="quantidade_padrao"
                    type="number"
                    min="0"
                    value={formData.quantidade_padrao}
                    onChange={(e) => updateFormData('quantidade_padrao', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="periodicidade_padrao">Periodicidade (dias)</Label>
                  <Input
                    id="periodicidade_padrao"
                    type="number"
                    min="1"
                    value={formData.periodicidade_padrao}
                    onChange={(e) => updateFormData('periodicidade_padrao', parseInt(e.target.value) || 7)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meta_giro_semanal">Meta Giro Semanal</Label>
                  <Input
                    id="meta_giro_semanal"
                    type="number"
                    min="0"
                    value={formData.meta_giro_semanal}
                    onChange={(e) => updateFormData('meta_giro_semanal', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo_cobranca">Tipo de Cobrança</Label>
                  <Select
                    value={formData.tipo_cobranca}
                    onValueChange={(value) => updateFormData('tipo_cobranca', value)}
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
                
                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(value) => updateFormData('forma_pagamento', value)}
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
              </div>
            </TabsContent>
            
            <TabsContent value="logistica" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_logistica">Tipo de Logística</Label>
                  <Select
                    value={formData.tipo_logistica}
                    onValueChange={(value) => updateFormData('tipo_logistica', value)}
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
                
                <div className="space-y-2">
                  <Label htmlFor="proxima_data_reposicao">Próxima Data de Reposição</Label>
                  <Input
                    id="proxima_data_reposicao"
                    type="date"
                    value={formData.proxima_data_reposicao}
                    onChange={(e) => updateFormData('proxima_data_reposicao', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="instrucoes_entrega">Instruções de Entrega</Label>
                  <Textarea
                    id="instrucoes_entrega"
                    value={formData.instrucoes_entrega}
                    onChange={(e) => updateFormData('instrucoes_entrega', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Janelas de Entrega</Label>
                  <DiasSemanaPicker
                    value={formData.janelas_entrega}
                    onChange={(dias) => updateFormData('janelas_entrega', dias)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="configuracoes" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contabilizar_giro_medio">Contabilizar no Giro Médio</Label>
                  <Switch
                    id="contabilizar_giro_medio"
                    checked={formData.contabilizar_giro_medio}
                    onCheckedChange={(checked) => updateFormData('contabilizar_giro_medio', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="emite_nota_fiscal">Emite Nota Fiscal</Label>
                  <Switch
                    id="emite_nota_fiscal"
                    checked={formData.emite_nota_fiscal}
                    onCheckedChange={(checked) => updateFormData('emite_nota_fiscal', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => updateFormData('observacoes', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : clienteId ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
