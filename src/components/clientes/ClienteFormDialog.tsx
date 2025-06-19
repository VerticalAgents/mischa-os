
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cliente, StatusCliente } from "@/types";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
import { toast } from "@/hooks/use-toast";

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
  const { precos, carregarPrecosPorCliente, salvarPrecos } = useSupabasePrecosCategoriaCliente();

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
    categoriasHabilitadas: []
  });

  // Estado para categorias e preços
  const [categoriasHabilitadas, setCategoriasHabilitadas] = useState<number[]>([]);
  const [precosPorCategoria, setPrecosPorCategoria] = useState<{ [key: number]: number }>({});

  // Carregar dados do cliente quando abrir para edição
  useEffect(() => {
    if (cliente && open) {
      console.log('Carregando dados do cliente para edição:', cliente);
      
      setFormData(cliente);
      setCategoriasHabilitadas(cliente.categoriasHabilitadas || []);
      
      // Carregar preços por categoria
      carregarPrecosPorCliente(cliente.id).then(precosCarregados => {
        const precosMap: { [key: number]: number } = {};
        precosCarregados.forEach(preco => {
          precosMap[preco.categoria_id] = preco.preco_unitario;
        });
        setPrecosPorCategoria(precosMap);
        console.log('Preços carregados:', precosMap);
      });
    } else if (!cliente && open) {
      // Limpar formulário para novo cliente
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
        categoriasHabilitadas: []
      });
      setCategoriasHabilitadas([]);
      setPrecosPorCategoria({});
    }
  }, [cliente, open, carregarPrecosPorCliente]);

  const handleCategoriaToggle = (categoriaId: number) => {
    console.log('Toggling categoria:', categoriaId);
    
    const novasCategorias = categoriasHabilitadas.includes(categoriaId)
      ? categoriasHabilitadas.filter(id => id !== categoriaId)
      : [...categoriasHabilitadas, categoriaId];
    
    console.log('Novas categorias:', novasCategorias);
    setCategoriasHabilitadas(novasCategorias);
    
    // Atualizar formData também
    setFormData(prev => ({
      ...prev,
      categoriasHabilitadas: novasCategorias
    }));

    // Se desmarcou a categoria, remover o preço
    if (!novasCategorias.includes(categoriaId)) {
      setPrecosPorCategoria(prev => {
        const novosPrecos = { ...prev };
        delete novosPrecos[categoriaId];
        return novosPrecos;
      });
    }
  };

  const handlePrecoChange = (categoriaId: number, valor: string) => {
    const preco = parseFloat(valor) || 0;
    console.log('Alterando preço categoria', categoriaId, 'para', preco);
    
    setPrecosPorCategoria(prev => ({
      ...prev,
      [categoriaId]: preco
    }));
  };

  const handleInputChange = (field: keyof Cliente, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

    try {
      console.log('Salvando cliente com dados:', {
        ...formData,
        categoriasHabilitadas
      });

      if (cliente) {
        // Atualização
        await atualizarCliente(cliente.id, {
          ...formData,
          categoriasHabilitadas
        });
        
        // Salvar preços por categoria
        const precosParaSalvar = Object.entries(precosPorCategoria)
          .filter(([_, preco]) => preco > 0)
          .map(([categoriaId, preco]) => ({
            categoria_id: parseInt(categoriaId),
            preco_unitario: preco
          }));
        
        if (precosParaSalvar.length > 0 || Object.keys(precosPorCategoria).length > 0) {
          await salvarPrecos(cliente.id, precosParaSalvar);
        }
        
        toast({
          title: "Cliente atualizado",
          description: "Dados do cliente foram salvos com sucesso"
        });
      } else {
        // Criação
        const novoCliente = await adicionarCliente({
          ...formData,
          categoriasHabilitadas
        } as Omit<Cliente, 'id' | 'dataCadastro'>);
        
        // Salvar preços por categoria para novo cliente
        if (novoCliente && Object.keys(precosPorCategoria).length > 0) {
          const precosParaSalvar = Object.entries(precosPorCategoria)
            .filter(([_, preco]) => preco > 0)
            .map(([categoriaId, preco]) => ({
              categoria_id: parseInt(categoriaId),
              preco_unitario: preco
            }));
          
          if (precosParaSalvar.length > 0) {
            await salvarPrecos(novoCliente.id, precosParaSalvar);
          }
        }
        
        toast({
          title: "Cliente cadastrado",
          description: "Novo cliente foi criado com sucesso"
        });
      }

      onClienteUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorias de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorias de Produtos Habilitadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoriasHabilitadas.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ Nenhuma categoria de produto habilitada para este cliente.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                {categorias.map((categoria) => (
                  <div key={categoria.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`categoria-${categoria.id}`}
                        checked={categoriasHabilitadas.includes(categoria.id)}
                        onCheckedChange={() => handleCategoriaToggle(categoria.id)}
                      />
                      <label
                        htmlFor={`categoria-${categoria.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {categoria.nome}
                      </label>
                      {categoria.descricao && (
                        <span className="text-xs text-muted-foreground">
                          - {categoria.descricao}
                        </span>
                      )}
                    </div>
                    
                    {/* Campo de preço para categoria habilitada */}
                    {categoriasHabilitadas.includes(categoria.id) && (
                      <div className="ml-6 flex items-center space-x-2">
                        <Label htmlFor={`preco-${categoria.id}`} className="text-sm w-20">
                          Preço:
                        </Label>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <Input
                            id={`preco-${categoria.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={precosPorCategoria[categoria.id] || ''}
                            onChange={(e) => handlePrecoChange(categoria.id, e.target.value)}
                            className="w-24 text-right"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {categorias.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma categoria disponível no sistema.
                </p>
              )}
            </CardContent>
          </Card>

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
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {cliente ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
