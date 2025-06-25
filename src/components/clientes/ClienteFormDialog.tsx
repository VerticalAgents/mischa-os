
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cliente, StatusCliente, DiaSemana } from "@/types";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useSupabaseRotasEntrega } from "@/hooks/useSupabaseRotasEntrega";
import { useSupabaseCategoriasEstabelecimento } from "@/hooks/useSupabaseCategoriasEstabelecimento";
import { useSupabaseTiposLogistica } from "@/hooks/useSupabaseTiposLogistica";
import { useSupabaseTiposCobranca } from "@/hooks/useSupabaseTiposCobranca";
import { useSupabaseFormasPagamento } from "@/hooks/useSupabaseFormasPagamento";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
import { useClientesCategorias } from "@/hooks/useClientesCategorias";
import { toast } from "@/hooks/use-toast";
import DiasSemanaPicker from "./DiasSemanaPicker";
import CategoriasProdutoSelector from "./CategoriasProdutoSelector";
import PrecificacaoPorCategoria from "./PrecificacaoPorCategoria";

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onClienteUpdate?: () => void;
}

export default function ClienteFormDialog({ 
  open, 
  onOpenChange, 
  cliente = null,
  onClienteUpdate 
}: ClienteFormDialogProps) {
  const { adicionarCliente, atualizarCliente, loading } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { representantes } = useSupabaseRepresentantes();
  const { rotasEntrega } = useSupabaseRotasEntrega();
  const { categorias: categoriasEstabelecimento } = useSupabaseCategoriasEstabelecimento();
  const { tiposLogistica } = useSupabaseTiposLogistica();
  const { tiposCobranca } = useSupabaseTiposCobranca();
  const { formasPagamento } = useSupabaseFormasPagamento();
  const { salvarPrecos } = useSupabasePrecosCategoriaCliente();
  const { salvarCategoriasCliente } = useClientesCategorias();

  // Estado do formulário
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome: '',
    cnpjCpf: '',
    enderecoEntrega: '',
    contatoNome: '',
    contatoTelefone: '',
    contatoEmail: '',
    quantidadePadrao: 0,
    periodicidadePadrao: 7,
    statusCliente: 'Ativo',
    tipoLogistica: 'Própria',
    tipoCobranca: 'À vista',
    formaPagamento: 'Boleto',
    emiteNotaFiscal: true,
    contabilizarGiroMedio: true,
    observacoes: '',
    categoriasHabilitadas: [],
    janelasEntrega: [],
    representanteId: undefined,
    rotaEntregaId: undefined,
    categoriaEstabelecimentoId: undefined,
    instrucoesEntrega: ''
  });

  // Estado para preços por categoria
  const [precosCategoria, setPrecosCategoria] = useState<{ categoria_id: number; preco_unitario: number }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados do cliente quando abrir para edição
  useEffect(() => {
    if (cliente && open) {
      console.log('ClienteFormDialog: Carregando dados do cliente para edição:', cliente);
      setFormData({
        ...cliente,
        categoriasHabilitadas: cliente.categoriasHabilitadas || []
      });
    } else if (!cliente && open) {
      console.log('ClienteFormDialog: Inicializando formulário para novo cliente');
      setFormData({
        nome: '',
        cnpjCpf: '',
        enderecoEntrega: '',
        contatoNome: '',
        contatoTelefone: '',
        contatoEmail: '',
        quantidadePadrao: 0,
        periodicidadePadrao: 7,
        statusCliente: 'Ativo',
        tipoLogistica: 'Própria',
        tipoCobranca: 'À vista',
        formaPagamento: 'Boleto',
        emiteNotaFiscal: true,
        contabilizarGiroMedio: true,
        observacoes: '',
        categoriasHabilitadas: [],
        janelasEntrega: [],
        representanteId: undefined,
        rotaEntregaId: undefined,
        categoriaEstabelecimentoId: undefined,
        instrucoesEntrega: ''
      });
      setPrecosCategoria([]);
    }
  }, [cliente, open]);

  const handleInputChange = (field: keyof Cliente, value: any) => {
    console.log(`ClienteFormDialog: Atualizando campo ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoriasChange = (categorias: number[]) => {
    console.log('ClienteFormDialog: Atualizando categorias habilitadas:', categorias);
    setFormData(prev => ({
      ...prev,
      categoriasHabilitadas: categorias
    }));
  };

  const handleDiasEntregaChange = (dias: DiaSemana[]) => {
    console.log('ClienteFormDialog: Atualizando janelas de entrega:', dias);
    setFormData(prev => ({
      ...prev,
      janelasEntrega: dias
    }));
  };

  const handlePrecosChange = (precos: { categoria_id: number; preco_unitario: number }[]) => {
    console.log('ClienteFormDialog: Atualizando preços por categoria:', precos);
    setPrecosCategoria(precos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome?.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      console.log('ClienteFormDialog: Iniciando salvamento do cliente:', formData);
      console.log('ClienteFormDialog: Preços por categoria a salvar:', precosCategoria);

      let clienteId: string;

      if (cliente) {
        // Atualização de cliente existente
        await atualizarCliente(cliente.id, formData);
        clienteId = cliente.id;
        
        toast({
          title: "Cliente atualizado",
          description: "Dados do cliente foram salvos com sucesso"
        });
      } else {
        // Criação de novo cliente
        const novoCliente = await adicionarCliente(formData as Omit<Cliente, 'id' | 'dataCadastro'>);
        clienteId = novoCliente.id;
        
        toast({
          title: "Cliente cadastrado",
          description: "Novo cliente foi criado com sucesso"
        });
      }

      // Salvar categorias habilitadas
      if (formData.categoriasHabilitadas && formData.categoriasHabilitadas.length > 0) {
        console.log('ClienteFormDialog: Salvando categorias do cliente:', formData.categoriasHabilitadas);
        await salvarCategoriasCliente(clienteId, formData.categoriasHabilitadas);
      }

      // Salvar preços por categoria
      if (precosCategoria.length > 0) {
        console.log('ClienteFormDialog: Salvando preços por categoria:', precosCategoria);
        await salvarPrecos(clienteId, precosCategoria);
      }

      // Chamar callback de atualização
      onClienteUpdate?.();
      onOpenChange(false);

    } catch (error) {
      console.error('ClienteFormDialog: Erro ao salvar cliente:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados do cliente",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {cliente ? 'Atualize os dados do cliente' : 'Preencha os dados do novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome || ''}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
                  <Input
                    id="cnpjCpf"
                    value={formData.cnpjCpf || ''}
                    onChange={(e) => handleInputChange('cnpjCpf', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enderecoEntrega">Endereço de Entrega</Label>
                <Input
                  id="enderecoEntrega"
                  value={formData.enderecoEntrega || ''}
                  onChange={(e) => handleInputChange('enderecoEntrega', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contatoNome">Nome do Contato</Label>
                  <Input
                    id="contatoNome"
                    value={formData.contatoNome || ''}
                    onChange={(e) => handleInputChange('contatoNome', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contatoTelefone">Telefone</Label>
                  <Input
                    id="contatoTelefone"
                    value={formData.contatoTelefone || ''}
                    onChange={(e) => handleInputChange('contatoTelefone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contatoEmail">Email</Label>
                  <Input
                    id="contatoEmail"
                    type="email"
                    value={formData.contatoEmail || ''}
                    onChange={(e) => handleInputChange('contatoEmail', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Comerciais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações Comerciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidadePadrao">Quantidade Padrão</Label>
                  <Input
                    id="quantidadePadrao"
                    type="number"
                    min="0"
                    value={formData.quantidadePadrao || 0}
                    onChange={(e) => handleInputChange('quantidadePadrao', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodicidadePadrao">Periodicidade (dias)</Label>
                  <Input
                    id="periodicidadePadrao"
                    type="number"
                    min="1"
                    value={formData.periodicidadePadrao || 7}
                    onChange={(e) => handleInputChange('periodicidadePadrao', parseInt(e.target.value) || 7)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusCliente">Status</Label>
                  <Select value={formData.statusCliente || 'Ativo'} onValueChange={(value: StatusCliente) => handleInputChange('statusCliente', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Em análise">Em análise</SelectItem>
                      <SelectItem value="A ativar">A ativar</SelectItem>
                      <SelectItem value="Standby">Standby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Entrega e Logística */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações de Entrega e Logística</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representante">Representante</Label>
                  <Select 
                    value={formData.representanteId?.toString() || undefined} 
                    onValueChange={(value) => handleInputChange('representanteId', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um representante" />
                    </SelectTrigger>
                    <SelectContent>
                      {representantes.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id.toString()}>
                          {rep.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rotaEntrega">Rota de Entrega</Label>
                  <Select 
                    value={formData.rotaEntregaId?.toString() || undefined} 
                    onValueChange={(value) => handleInputChange('rotaEntregaId', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma rota" />
                    </SelectTrigger>
                    <SelectContent>
                      {rotasEntrega.map((rota) => (
                        <SelectItem key={rota.id} value={rota.id.toString()}>
                          {rota.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoriaEstabelecimento">Categoria do Estabelecimento</Label>
                  <Select 
                    value={formData.categoriaEstabelecimentoId?.toString() || undefined} 
                    onValueChange={(value) => handleInputChange('categoriaEstabelecimentoId', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasEstabelecimento.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoLogistica">Tipo de Logística</Label>
                  <Select 
                    value={formData.tipoLogistica || 'Própria'} 
                    onValueChange={(value) => handleInputChange('tipoLogistica', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposLogistica.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nome}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Janelas de Entrega</Label>
                <DiasSemanaPicker 
                  value={formData.janelasEntrega || []}
                  onChange={handleDiasEntregaChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrucoesEntrega">Instruções de Entrega</Label>
                <Textarea
                  id="instrucoesEntrega"
                  value={formData.instrucoesEntrega || ''}
                  onChange={(e) => handleInputChange('instrucoesEntrega', e.target.value)}
                  placeholder="Instruções especiais para entrega..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações Financeiras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
                  <Select 
                    value={formData.tipoCobranca || 'À vista'} 
                    onValueChange={(value) => handleInputChange('tipoCobranca', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposCobranca.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nome}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                  <Select 
                    value={formData.formaPagamento || 'Boleto'} 
                    onValueChange={(value) => handleInputChange('formaPagamento', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map((forma) => (
                        <SelectItem key={forma.id} value={forma.nome}>
                          {forma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emiteNotaFiscal">Emite Nota Fiscal</Label>
                  <Select 
                    value={formData.emiteNotaFiscal ? 'true' : 'false'} 
                    onValueChange={(value) => handleInputChange('emiteNotaFiscal', value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contabilizarGiroMedio"
                  checked={formData.contabilizarGiroMedio || false}
                  onCheckedChange={(checked) => handleInputChange('contabilizarGiroMedio', checked)}
                />
                <Label htmlFor="contabilizarGiroMedio">
                  Contabilizar no giro médio
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Categorias de Produtos */}
          <CategoriasProdutoSelector 
            value={formData.categoriasHabilitadas || []}
            onChange={handleCategoriasChange}
            clienteId={cliente?.id}
          />

          {/* Precificação por Categoria */}
          <PrecificacaoPorCategoria
            categoriasHabilitadas={formData.categoriasHabilitadas || []}
            clienteId={cliente?.id}
            onPrecosChange={handlePrecosChange}
          />

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações adicionais sobre o cliente..."
                rows={3}
              />
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {cliente ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
