import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, Lock, Unlock } from "lucide-react";
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
import { useErrorDetail } from '@/hooks/useErrorDetail';
import { ErrorDetailDialog } from '@/components/common/ErrorDetailDialog';
import { ClienteResetDialog } from './ClienteResetDialog';
import { 
  STATUS_CLIENTE_LABELS, 
  TIPO_LOGISTICA_LABELS, 
  type StatusClienteType,
  type TipoLogisticaType
} from '@/types/cliente-dto';

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  dadosIniciais?: Partial<Cliente>;
  onClienteUpdate?: () => void;
}

const getDefaultFormData = (): Partial<Cliente> => ({
  nome: '',
  cnpjCpf: '',
  enderecoEntrega: '',
  linkGoogleMaps: '',
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
  instrucoesEntrega: '',
  gestaoClickClienteId: ''
});

export default function ClienteFormDialog({ 
  open, 
  onOpenChange, 
  cliente = null,
  dadosIniciais = null,
  onClienteUpdate 
}: ClienteFormDialogProps) {
  const { adicionarCliente, atualizarCliente, loading } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { representantes } = useSupabaseRepresentantes();
  const { rotasEntrega } = useSupabaseRotasEntrega();
  const { categorias: categoriasEstabelecimento } = useSupabaseCategoriasEstabelecimento();
  const { formasPagamento } = useSupabaseFormasPagamento();
  const { tiposCobranca } = useSupabaseTiposCobranca();
  const { tiposLogistica } = useSupabaseTiposLogistica();
  const { salvarPrecos } = useSupabasePrecosCategoriaCliente();
  const { salvarCategoriasCliente } = useClientesCategorias();
  const { isOpen: isErrorDetailOpen, errorDetail, hideErrorDetail } = useErrorDetail();

  const [formData, setFormData] = useState<Partial<Cliente>>(getDefaultFormData());
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isIdUnlocked, setIsIdUnlocked] = useState(false);
  
  const initializedRef = useRef(false);
  const lastClienteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      setIsIdUnlocked(false); // Reset lock state when dialog closes
      return;
    }

    const currentId = cliente?.id || null;
    const isFirstOpen = !initializedRef.current;
    const idChanged = currentId !== lastClienteIdRef.current;

    if (isFirstOpen || idChanged) {
      console.log('🧭 Inicializando form', { 
        isFirstOpen, 
        idChanged, 
        clienteId: currentId,
        temDadosIniciais: !!dadosIniciais 
      });
      
      if (cliente) {
        // MODO DE EDIÇÃO: Cliente existente
        setFormData({
          ...cliente,
          categoriasHabilitadas: cliente.categoriasHabilitadas || []
        });
        lastClienteIdRef.current = currentId;
      } else if (dadosIniciais) {
        // MODO DE CRIAÇÃO COM DADOS: Novo cliente a partir de lead
        setFormData({
          ...getDefaultFormData(),
          ...dadosIniciais,
          categoriasHabilitadas: dadosIniciais.categoriasHabilitadas || []
        });
        lastClienteIdRef.current = null;
      } else {
        // MODO DE CRIAÇÃO VAZIA: Novo cliente em branco
        setFormData(getDefaultFormData());
        lastClienteIdRef.current = null;
      }
      initializedRef.current = true;
    } else {
      console.log('⏭️ Mantendo formData (sem reinit)');
    }
  }, [open, cliente?.id, dadosIniciais]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Iniciando submissão do formulário:', formData);
    setIsSaving(true);

    try {
      let clienteId: string;

      if (cliente) {
        console.log('🔄 Atualizando cliente existente:', cliente.id);
        await atualizarCliente(cliente.id, formData);
        clienteId = cliente.id;
        
        toast({
          title: "Cliente atualizado",
          description: "Dados do cliente foram salvos com sucesso"
        });
      } else {
        console.log('➕ Criando novo cliente');
        const novoCliente = await adicionarCliente(formData as Omit<Cliente, 'id' | 'dataCadastro'>);
        clienteId = novoCliente.id;
        
        toast({
          title: "Cliente cadastrado",
          description: "Novo cliente foi criado com sucesso"
        });
      }

      // Salvar categorias de forma não-bloqueante
      if (formData.categoriasHabilitadas && formData.categoriasHabilitadas.length > 0) {
        try {
          console.log('📂 Salvando categorias do cliente:', formData.categoriasHabilitadas);
          await salvarCategoriasCliente(clienteId, formData.categoriasHabilitadas);
        } catch (categoriaError) {
          console.error('⚠️ Erro ao salvar categorias (não-bloqueante):', categoriaError);
          toast({
            title: "Aviso",
            description: "Cliente salvo, mas houve um problema ao salvar as categorias. Tente editá-las novamente.",
            variant: "default"
          });
        }
      }

      onClienteUpdate?.();
      onOpenChange(false);

    } catch (error: any) {
      console.error('❌ Erro ao salvar cliente:', error);
      
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar os dados do cliente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = (safeData: Partial<Cliente>) => {
    console.log('🔄 APLICANDO RESET DE SEGURANÇA:', safeData);
    setFormData(safeData);
    toast({
      title: "Reset aplicado",
      description: "Agora você pode salvar sem erros."
    });
  };

  const clienteTemp: Cliente = {
    id: cliente?.id || '',
    nome: formData.nome || '',
    cnpjCpf: formData.cnpjCpf || '',
    enderecoEntrega: formData.enderecoEntrega || '',
    linkGoogleMaps: formData.linkGoogleMaps || '',
    contatoNome: formData.contatoNome || '',
    contatoTelefone: formData.contatoTelefone || '',
    contatoEmail: formData.contatoEmail || '',
    quantidadePadrao: formData.quantidadePadrao || 0,
    periodicidadePadrao: formData.periodicidadePadrao || 7,
    statusCliente: formData.statusCliente || 'Ativo',
    tipoLogistica: formData.tipoLogistica || 'Própria',
    tipoCobranca: formData.tipoCobranca || 'À vista',
    formaPagamento: formData.formaPagamento || 'Boleto',
    emiteNotaFiscal: formData.emiteNotaFiscal || true,
    contabilizarGiroMedio: formData.contabilizarGiroMedio || true,
    observacoes: formData.observacoes || '',
    categoriasHabilitadas: formData.categoriasHabilitadas || [],
    janelasEntrega: formData.janelasEntrega || [],
    representanteId: formData.representanteId,
    rotaEntregaId: formData.rotaEntregaId,
    categoriaEstabelecimentoId: formData.categoriaEstabelecimentoId,
    instrucoesEntrega: formData.instrucoesEntrega || '',
    dataCadastro: cliente?.dataCadastro ? 
      (typeof cliente.dataCadastro === 'string' ? new Date(cliente.dataCadastro) : cliente.dataCadastro) : 
      new Date(),
    ativo: cliente?.ativo ?? true,
    categoriaId: cliente?.categoriaId || 0,
    subcategoriaId: cliente?.subcategoriaId || 0,
    gestaoClickClienteId: formData.gestaoClickClienteId || ''
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto notranslate" 
        translate="no" 
        data-translate="no"
        lang="pt"
      >
        <DialogHeader>
          <DialogTitle>
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {cliente ? 'Atualize os dados do cliente' : 'Preencha os dados do novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 notranslate" translate="no">`
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="gestaoClickClienteId">ID do Cliente</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        if (!isIdUnlocked) {
                          const confirmed = window.confirm('Tem certeza que deseja editar o ID do cliente? Este campo vincula o cliente ao GestãoClick.');
                          if (confirmed) setIsIdUnlocked(true);
                        } else {
                          setIsIdUnlocked(false);
                        }
                      }}
                      title={isIdUnlocked ? "Bloquear edição" : "Desbloquear edição"}
                    >
                      {isIdUnlocked ? (
                        <Unlock className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="gestaoClickClienteId"
                    value={formData.gestaoClickClienteId || ''}
                    onChange={(e) => handleInputChange('gestaoClickClienteId', e.target.value)}
                    disabled={!isIdUnlocked}
                    placeholder="Ex: 12345"
                    className={!isIdUnlocked ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome <span className="text-red-500">*</span>
                  </Label>
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

              <div className="space-y-2">
                <Label htmlFor="linkGoogleMaps">Link do Google Maps</Label>
                <Input
                  id="linkGoogleMaps"
                  type="url"
                  placeholder="https://maps.app.goo.gl/wTpwoh5LT8hDRPke6"
                  value={formData.linkGoogleMaps || ''}
                  onChange={(e) => handleInputChange('linkGoogleMaps', e.target.value)}
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
                    <SelectTrigger translate="no" data-translate="no">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent translate="no" data-translate="no">
                      <SelectItem value="Ativo" translate="no">Ativo</SelectItem>
                      <SelectItem value="Inativo" translate="no">Inativo</SelectItem>
                      <SelectItem value="Em análise" translate="no">Em análise</SelectItem>
                      <SelectItem value="A ativar" translate="no">A ativar</SelectItem>
                      <SelectItem value="Standby" translate="no">Standby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

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
                     onValueChange={(value) => {
                       console.log('🔄 Mudança de Tipo de Logística:', value);
                       console.log('📊 Estado ANTES da mudança:', { ...formData });
                       handleInputChange('tipoLogistica', value);
                     }}
                   >
                    <SelectTrigger className="notranslate" translate="no" data-translate="no">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="notranslate" translate="no" data-translate="no">
                      {tiposLogistica.filter(tipo => tipo.ativo).map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nome} className="notranslate" translate="no">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações Financeiras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
                    <Select 
                      value={formData.tipoCobranca || ''} 
                      onValueChange={(value) => handleInputChange('tipoCobranca', value)}
                    >
                      <SelectTrigger className="notranslate" translate="no" data-translate="no">
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent className="notranslate" translate="no" data-translate="no">
                        {tiposCobranca.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.nome} className="notranslate" translate="no">
                            {tipo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                    <Select 
                      value={formData.formaPagamento || ''} 
                      onValueChange={(value) => handleInputChange('formaPagamento', value)}
                    >
                      <SelectTrigger className="notranslate" translate="no" data-translate="no">
                        <SelectValue placeholder="Selecione uma forma" />
                      </SelectTrigger>
                      <SelectContent className="notranslate" translate="no" data-translate="no">
                        {formasPagamento.map((forma) => (
                          <SelectItem key={forma.id} value={forma.nome} className="notranslate" translate="no">
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

          <CategoriasProdutoSelector 
            value={formData.categoriasHabilitadas || []}
            onChange={handleCategoriasChange}
            clienteId={cliente?.id}
          />

          <PrecificacaoPorCategoria
            cliente={clienteTemp}
          />

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
      
      <ErrorDetailDialog
        open={isErrorDetailOpen}
        onOpenChange={hideErrorDetail}
        error={errorDetail?.error}
        context={errorDetail?.context}
      />
      
      <ClienteResetDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onReset={handleReset}
        clienteAtual={cliente}
      />
    </Dialog>
  );
}
