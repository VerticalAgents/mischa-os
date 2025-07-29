
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useCategoriasEstabelecimentoUnified } from '@/hooks/useCategoriasEstabelecimentoUnified';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Cliente, DiaSemana, StatusCliente, TipoLogisticaNome, TipoCobranca, FormaPagamentoNome } from '@/types';
import CategoriasProdutoSelector from './CategoriasProdutoSelector';
import DiasSemanaPicker from './DiasSemanaPicker';

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente; // Optional cliente for editing
  onClienteUpdate?: () => void;
}

export default function ClienteFormDialog({ 
  open, 
  onOpenChange, 
  cliente,
  onClienteUpdate 
}: ClienteFormDialogProps) {
  const { adicionarCliente, editarCliente, loading: clienteLoading } = useClienteStore();
  
  // Hook unificado para categorias - carregamento condicional
  const { 
    categorias, 
    loading: categoriasLoading, 
    carregarSeNecessario 
  } = useCategoriasEstabelecimentoUnified();

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    cnpjCpf: '',
    enderecoEntrega: '',
    contatoNome: '',
    contatoTelefone: '',
    contatoEmail: '',
    quantidadePadrao: 0,
    periodicidadePadrao: 7,
    statusCliente: 'Ativo' as StatusCliente,
    metaGiroSemanal: 0,
    categoriaEstabelecimentoId: undefined as number | undefined,
    janelasEntrega: [] as DiaSemana[],
    instrucoesEntrega: '',
    tipoLogistica: 'Própria' as TipoLogisticaNome,
    contabilizarGiroMedio: true,
    emiteNotaFiscal: true,
    tipoCobranca: 'À vista' as TipoCobranca,
    formaPagamento: 'Boleto' as FormaPagamentoNome,
    observacoes: '',
    categoriasHabilitadas: [] as number[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(cliente);

  // Carregar categorias apenas quando o dialog abrir (lazy loading)
  useEffect(() => {
    if (open) {
      console.log('📋 Dialog aberto - carregando categorias sob demanda...');
      carregarSeNecessario();
    }
  }, [open, carregarSeNecessario]);

  // Populate form with cliente data when editing
  useEffect(() => {
    if (cliente && open) {
      setFormData({
        nome: cliente.nome || '',
        cnpjCpf: cliente.cnpjCpf || '',
        enderecoEntrega: cliente.enderecoEntrega || '',
        contatoNome: cliente.contatoNome || '',
        contatoTelefone: cliente.contatoTelefone || '',
        contatoEmail: cliente.contatoEmail || '',
        quantidadePadrao: cliente.quantidadePadrao || 0,
        periodicidadePadrao: cliente.periodicidadePadrao || 7,
        statusCliente: cliente.statusCliente || 'Ativo',
        metaGiroSemanal: cliente.metaGiroSemanal || 0,
        categoriaEstabelecimentoId: cliente.categoriaEstabelecimentoId,
        janelasEntrega: (cliente.janelasEntrega || []) as DiaSemana[],
        instrucoesEntrega: cliente.instrucoesEntrega || '',
        tipoLogistica: cliente.tipoLogistica || 'Própria',
        contabilizarGiroMedio: cliente.contabilizarGiroMedio ?? true,
        emiteNotaFiscal: cliente.emiteNotaFiscal ?? true,
        tipoCobranca: cliente.tipoCobranca || 'À vista',
        formaPagamento: cliente.formaPagamento || 'Boleto',
        observacoes: cliente.observacoes || '',
        categoriasHabilitadas: cliente.categoriasHabilitadas || []
      });
    }
  }, [cliente, open]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
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
      metaGiroSemanal: 0,
      categoriaEstabelecimentoId: undefined,
      janelasEntrega: [] as DiaSemana[],
      instrucoesEntrega: '',
      tipoLogistica: 'Própria',
      contabilizarGiroMedio: true,
      emiteNotaFiscal: true,
      tipoCobranca: 'À vista',
      formaPagamento: 'Boleto',
      observacoes: '',
      categoriasHabilitadas: []
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const clienteData = {
        nome: formData.nome.trim(),
        cnpjCpf: formData.cnpjCpf || undefined,
        enderecoEntrega: formData.enderecoEntrega || undefined,
        contatoNome: formData.contatoNome || undefined,
        contatoTelefone: formData.contatoTelefone || undefined,
        contatoEmail: formData.contatoEmail || undefined,
        quantidadePadrao: formData.quantidadePadrao,
        periodicidadePadrao: formData.periodicidadePadrao,
        statusCliente: formData.statusCliente,
        metaGiroSemanal: formData.metaGiroSemanal,
        categoriaEstabelecimentoId: formData.categoriaEstabelecimentoId,
        janelasEntrega: formData.janelasEntrega,
        instrucoesEntrega: formData.instrucoesEntrega || undefined,
        tipoLogistica: formData.tipoLogistica,
        contabilizarGiroMedio: formData.contabilizarGiroMedio,
        emiteNotaFiscal: formData.emiteNotaFiscal,
        tipoCobranca: formData.tipoCobranca,
        formaPagamento: formData.formaPagamento,
        observacoes: formData.observacoes || undefined,
        categoriasHabilitadas: formData.categoriasHabilitadas,
        ativo: true,
        giroMedioSemanal: cliente?.giroMedioSemanal || 0,
        ultimaDataReposicaoEfetiva: cliente?.ultimaDataReposicaoEfetiva,
        statusAgendamento: cliente?.statusAgendamento || 'Não Agendado',
        proximaDataReposicao: cliente?.proximaDataReposicao,
        dataCadastro: cliente?.dataCadastro || new Date(),
        categoriaId: cliente?.categoriaId || 1,
        subcategoriaId: cliente?.subcategoriaId || 1
      };

      if (isEditing && cliente) {
        await editarCliente(cliente.id, clienteData);
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso"
        });
      } else {
        await adicionarCliente(clienteData);
        toast({
          title: "Sucesso",
          description: "Cliente cadastrado com sucesso"
        });
      }

      resetForm();
      onOpenChange(false);
      onClienteUpdate?.();
    } catch (error: any) {
      console.error('❌ Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: error.message || `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} cliente`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isEditing) {
      resetForm();
    }
    onOpenChange(false);
  }, [resetForm, onOpenChange, isEditing]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente no sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
              <Input
                id="cnpjCpf"
                value={formData.cnpjCpf}
                onChange={(e) => handleInputChange('cnpjCpf', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enderecoEntrega">Endereço de Entrega</Label>
            <Textarea
              id="enderecoEntrega"
              value={formData.enderecoEntrega}
              onChange={(e) => handleInputChange('enderecoEntrega', e.target.value)}
              rows={2}
            />
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contatoNome">Nome do Contato</Label>
              <Input
                id="contatoNome"
                value={formData.contatoNome}
                onChange={(e) => handleInputChange('contatoNome', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contatoTelefone">Telefone</Label>
              <Input
                id="contatoTelefone"
                value={formData.contatoTelefone}
                onChange={(e) => handleInputChange('contatoTelefone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contatoEmail">E-mail</Label>
              <Input
                id="contatoEmail"
                type="email"
                value={formData.contatoEmail}
                onChange={(e) => handleInputChange('contatoEmail', e.target.value)}
              />
            </div>
          </div>

          {/* Configurações de Entrega */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidadePadrao">Quantidade Padrão</Label>
              <Input
                id="quantidadePadrao"
                type="number"
                min="0"
                value={formData.quantidadePadrao}
                onChange={(e) => handleInputChange('quantidadePadrao', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodicidadePadrao">Periodicidade (dias)</Label>
              <Input
                id="periodicidadePadrao"
                type="number"
                min="1"
                value={formData.periodicidadePadrao}
                onChange={(e) => handleInputChange('periodicidadePadrao', parseInt(e.target.value) || 7)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaGiroSemanal">Meta Giro Semanal</Label>
              <Input
                id="metaGiroSemanal"
                type="number"
                min="0"
                value={formData.metaGiroSemanal}
                onChange={(e) => handleInputChange('metaGiroSemanal', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Categoria de Estabelecimento - com carregamento condicional */}
          <div className="space-y-2">
            <Label htmlFor="categoriaEstabelecimento">Categoria de Estabelecimento</Label>
            {categoriasLoading ? (
              <div className="flex items-center gap-2 p-2 border rounded">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando categorias...</span>
              </div>
            ) : (
              <Select
                value={formData.categoriaEstabelecimentoId?.toString() || ""}
                onValueChange={(value) => handleInputChange('categoriaEstabelecimentoId', value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Janelas de Entrega */}
          <div className="space-y-2">
            <Label>Janelas de Entrega</Label>
            <DiasSemanaPicker
              value={formData.janelasEntrega}
              onChange={(dias) => handleInputChange('janelasEntrega', dias)}
            />
          </div>

          {/* Categorias de Produto */}
          <div className="space-y-2">
            <Label>Categorias de Produto Habilitadas</Label>
            <CategoriasProdutoSelector
              value={formData.categoriasHabilitadas}
              onChange={(categorias) => handleInputChange('categoriasHabilitadas', categorias)}
            />
          </div>

          {/* Configurações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoLogistica">Tipo de Logística</Label>
              <Select
                value={formData.tipoLogistica}
                onValueChange={(value) => handleInputChange('tipoLogistica', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Própria">Própria</SelectItem>
                  <SelectItem value="Terceirizada">Terceirizada</SelectItem>
                  <SelectItem value="Distribuição">Distribuição</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusCliente">Status</Label>
              <Select
                value={formData.statusCliente}
                onValueChange={(value) => handleInputChange('statusCliente', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Configurações Financeiras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
              <Select
                value={formData.tipoCobranca}
                onValueChange={(value) => handleInputChange('tipoCobranca', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="À vista">À vista</SelectItem>
                  <SelectItem value="Consignado">Consignado</SelectItem>
                  <SelectItem value="Faturado">Faturado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
              <Select
                value={formData.formaPagamento}
                onValueChange={(value) => handleInputChange('formaPagamento', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Switches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="contabilizarGiroMedio"
                checked={formData.contabilizarGiroMedio}
                onCheckedChange={(checked) => handleInputChange('contabilizarGiroMedio', checked)}
              />
              <Label htmlFor="contabilizarGiroMedio">Contabilizar Giro Médio</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="emiteNotaFiscal"
                checked={formData.emiteNotaFiscal}
                onCheckedChange={(checked) => handleInputChange('emiteNotaFiscal', checked)}
              />
              <Label htmlFor="emiteNotaFiscal">Emite Nota Fiscal</Label>
            </div>
          </div>

          {/* Instruções e Observações */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instrucoesEntrega">Instruções de Entrega</Label>
              <Textarea
                id="instrucoesEntrega"
                value={formData.instrucoesEntrega}
                onChange={(e) => handleInputChange('instrucoesEntrega', e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || clienteLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Atualizando...' : 'Cadastrando...'}
                </>
              ) : (
                isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
