
import { useState } from "react";
import { useInsumosStore } from "@/hooks/useInsumosStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle, 
  X, 
  FileDown,
  Clock,
  FilePlus,
  ShoppingCart, 
  Eye,
  Trash,
  AlertCircle
} from "lucide-react";
import { Cotacao } from "@/types/insumos";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

// Schema para a cotação
const cotacaoSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  dataValidade: z.string().optional(),
});

// Schema para item da cotação
const itemCotacaoSchema = z.object({
  insumoId: z.number().min(1, "Selecione um insumo"),
  quantidade: z.number().min(1, "Quantidade deve ser maior que zero"),
});

// Schema para proposta
const propostaSchema = z.object({
  fornecedorId: z.number().min(1, "Selecione um fornecedor"),
  prazoEntrega: z.number().min(1, "Informe o prazo de entrega em dias"),
  frete: z.number().min(0, "Frete não pode ser negativo"),
  formaPagamento: z.string().min(3, "Informe a forma de pagamento"),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    itemId: z.number(),
    precoUnitario: z.number().min(0.01, "Preço deve ser maior que zero"),
  })).min(1, "Adicione ao menos um item"),
});

type CotacaoFormValues = z.infer<typeof cotacaoSchema>;
type ItemCotacaoFormValues = z.infer<typeof itemCotacaoSchema>;
type PropostaFormValues = z.infer<typeof propostaSchema>;

export default function CotacoesTab() {
  const { 
    cotacoes, 
    insumos, 
    fornecedores, 
    criarCotacao, 
    adicionarItemCotacao, 
    adicionarPropostaFornecedor,
    atualizarStatusCotacao,
    escolherPropostaVencedora,
    gerarPedidoCompraDeCotacao
  } = useInsumosStore();
  
  // Estados para controle de dialogs e seleção
  const [isNovaCotacaoOpen, setIsNovaCotacaoOpen] = useState(false);
  const [isAdicionarItemOpen, setIsAdicionarItemOpen] = useState(false);
  const [isPropostaOpen, setIsPropostaOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState<number | null>(null);
  
  // Estado para os formulários
  const [itens, setItens] = useState<Array<{id?: number, insumoId: number, quantidade: number}>>([]);

  // Estado para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Cotacao['status'] | 'Todas'>('Todas');

  // Formulários
  const cotacaoForm = useForm<CotacaoFormValues>({
    resolver: zodResolver(cotacaoSchema),
    defaultValues: {
      titulo: "",
      dataValidade: "",
    },
  });

  const itemForm = useForm<ItemCotacaoFormValues>({
    resolver: zodResolver(itemCotacaoSchema),
    defaultValues: {
      insumoId: 0,
      quantidade: 1,
    },
  });

  const propostaForm = useForm<PropostaFormValues>({
    resolver: zodResolver(propostaSchema),
    defaultValues: {
      fornecedorId: 0,
      prazoEntrega: 5,
      frete: 0,
      formaPagamento: "À vista",
      observacoes: "",
      itens: [],
    },
  });

  // Cotações filtradas
  const cotacoesFiltradas = cotacoes
    .filter(cotacao => cotacao.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(cotacao => statusFilter === 'Todas' || cotacao.status === statusFilter)
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());

  // Handlers
  const onSubmitCotacao = (values: CotacaoFormValues) => {
    const cotacaoId = criarCotacao({
      titulo: values.titulo,
      dataValidade: values.dataValidade ? new Date(values.dataValidade) : undefined,
      status: "Aberta",
      itens: []
    });

    setCotacaoSelecionada(cotacaoId);
    setIsNovaCotacaoOpen(false);
    setIsAdicionarItemOpen(true);
    setItens([]);
  };

  const adicionarItem = (values: ItemCotacaoFormValues) => {
    setItens([...itens, { insumoId: values.insumoId, quantidade: values.quantidade }]);
    itemForm.reset({
      insumoId: 0,
      quantidade: 1,
    });
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const finalizarItens = () => {
    if (cotacaoSelecionada) {
      itens.forEach(item => {
        adicionarItemCotacao(cotacaoSelecionada, {
          insumoId: item.insumoId,
          quantidade: item.quantidade
        });
      });
      
      toast({
        title: "Itens adicionados",
        description: `${itens.length} itens adicionados à cotação com sucesso!`
      });
      
      atualizarStatusCotacao(cotacaoSelecionada, "Aguardando Propostas");
      setIsAdicionarItemOpen(false);
      setItens([]);
    }
  };

  const abrirDetalhes = (cotacao: Cotacao) => {
    setCotacaoSelecionada(cotacao.id);
    setIsDetalhesOpen(true);
  };

  const abrirPropostaForm = (cotacao: Cotacao) => {
    setCotacaoSelecionada(cotacao.id);
    
    // Preparar formulário com itens da cotação
    if (cotacao && cotacao.itens.length > 0) {
      const itensForm = cotacao.itens.map(item => ({
        itemId: item.id,
        precoUnitario: 0
      }));
      
      propostaForm.reset({
        fornecedorId: 0,
        prazoEntrega: 5,
        frete: 0,
        formaPagamento: "À vista",
        observacoes: "",
        itens: itensForm
      });
      
      setIsPropostaOpen(true);
    } else {
      toast({
        title: "Erro",
        description: "Esta cotação não possui itens",
        variant: "destructive"
      });
    }
  };

  const onSubmitProposta = (values: PropostaFormValues) => {
    if (cotacaoSelecionada) {
      adicionarPropostaFornecedor({
        cotacaoId: cotacaoSelecionada,
        fornecedorId: values.fornecedorId,
        prazoEntrega: values.prazoEntrega,
        frete: values.frete,
        formaPagamento: values.formaPagamento,
        observacoes: values.observacoes,
        itens: values.itens
      });
      
      setIsPropostaOpen(false);
    }
  };

  const escolherVencedor = (cotacaoId: number, propostaId: number) => {
    escolherPropostaVencedora(cotacaoId, propostaId);
    toast({
      title: "Proposta selecionada",
      description: "A proposta vencedora foi selecionada e a cotação foi finalizada."
    });
    setIsDetalhesOpen(false);
  };

  const exportarCotacaoCSV = () => {
    if (!cotacaoSelecionada) return;
    
    const cotacao = cotacoes.find(c => c.id === cotacaoSelecionada);
    if (!cotacao) return;
    
    // Cabeçalho
    const headers = ["ID Item", "Insumo", "Quantidade", "Unidade"];
    
    // Dados de cada fornecedor/proposta
    const propostasHeaders = cotacao.propostas.map(p => {
      const fornecedor = fornecedores.find(f => f.id === p.fornecedorId);
      return `${fornecedor?.nome || 'Fornecedor'} (R$)`;
    });
    
    // Juntar todos os cabeçalhos
    const allHeaders = [...headers, ...propostasHeaders];
    
    // Linhas para cada item
    const rows = cotacao.itens.map(item => {
      const insumo = insumos.find(i => i.id === item.insumoId);
      
      // Dados base do item
      const baseData = [
        item.id,
        insumo?.nome || 'Insumo não encontrado',
        item.quantidade,
        insumo?.unidadeMedida || '-'
      ];
      
      // Preço de cada fornecedor para este item
      const precos = cotacao.propostas.map(proposta => {
        const propostaItem = proposta.itens.find(i => i.itemId === item.id);
        return propostaItem ? propostaItem.precoUnitario.toFixed(2) : '-';
      });
      
      return [...baseData, ...precos];
    });
    
    // Criar string CSV
    const csv = [
      allHeaders.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cotacao_${cotacao.id}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const criarPedidoCompra = () => {
    if (!cotacaoSelecionada) return;
    
    const pedidoId = gerarPedidoCompraDeCotacao(cotacaoSelecionada);
    
    if (pedidoId > 0) {
      toast({
        title: "Pedido de compra gerado",
        description: `O pedido de compra #${pedidoId} foi gerado com sucesso!`
      });
      setIsDetalhesOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Cotações</h2>
          <p className="text-muted-foreground">Crie cotações, compare propostas de fornecedores e escolha a melhor opção</p>
        </div>
        <Button onClick={() => setIsNovaCotacaoOpen(true)}>
          <FilePlus className="mr-2 h-4 w-4" /> Nova Cotação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar cotação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm"
            variant={statusFilter === 'Todas' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Todas')}
          >
            Todas
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === 'Aberta' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Aberta')}
          >
            <Clock className="mr-1 h-4 w-4" /> Abertas
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === 'Aguardando Propostas' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Aguardando Propostas')}
          >
            <AlertCircle className="mr-1 h-4 w-4" /> Aguardando Propostas
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === 'Finalizada' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Finalizada')}
          >
            <CheckCircle className="mr-1 h-4 w-4" /> Finalizadas
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === 'Cancelada' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('Cancelada')}
          >
            <X className="mr-1 h-4 w-4" /> Canceladas
          </Button>
        </div>
      </div>

      {/* Lista de Cotações */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotações</CardTitle>
          <CardDescription>
            Visualize todas as cotações e suas respectivas propostas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead className="text-center">Propostas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotacoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhuma cotação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                cotacoesFiltradas.map((cotacao) => {
                  const statusBadge = () => {
                    switch (cotacao.status) {
                      case 'Aberta':
                        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Aberta</Badge>;
                      case 'Aguardando Propostas':
                        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Aguardando Propostas</Badge>;
                      case 'Finalizada':
                        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Finalizada</Badge>;
                      case 'Cancelada':
                        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelada</Badge>;
                      default:
                        return <Badge>{cotacao.status}</Badge>;
                    }
                  };
                  
                  return (
                    <TableRow key={cotacao.id}>
                      <TableCell>{cotacao.id}</TableCell>
                      <TableCell>{cotacao.titulo}</TableCell>
                      <TableCell>{format(new Date(cotacao.dataCriacao), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-center">{statusBadge()}</TableCell>
                      <TableCell className="text-center">{cotacao.itens.length}</TableCell>
                      <TableCell className="text-center">{cotacao.propostas.length}</TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline" onClick={() => abrirDetalhes(cotacao)}>
                            <Eye className="h-4 w-4 mr-1" /> Detalhes
                          </Button>
                          {cotacao.status === 'Aguardando Propostas' && (
                            <Button size="sm" variant="outline" onClick={() => abrirPropostaForm(cotacao)}>
                              <Plus className="h-4 w-4 mr-1" /> Proposta
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para Nova Cotação */}
      <Dialog open={isNovaCotacaoOpen} onOpenChange={setIsNovaCotacaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
            <DialogDescription>
              Crie uma nova cotação para coletar propostas de fornecedores.
            </DialogDescription>
          </DialogHeader>
          <Form {...cotacaoForm}>
            <form onSubmit={cotacaoForm.handleSubmit(onSubmitCotacao)} className="space-y-4">
              <FormField
                control={cotacaoForm.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da Cotação</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Cotação de Insumos - Junho/2025" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cotacaoForm.control}
                name="dataValidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNovaCotacaoOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Próximo: Adicionar Itens</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar itens à cotação */}
      <Dialog open={isAdicionarItemOpen} onOpenChange={(open) => {
        if (!open && itens.length > 0 && !confirm("Tem certeza que deseja sair? Os itens adicionados serão perdidos.")) {
          return;
        }
        setIsAdicionarItemOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Itens à Cotação</DialogTitle>
            <DialogDescription>
              Adicione os insumos que deseja cotar com os fornecedores.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <Form {...itemForm}>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-7">
                    <FormField
                      control={itemForm.control}
                      name="insumoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insumo</FormLabel>
                          <FormControl>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                              value={field.value || ""}
                              onChange={e => field.onChange(Number(e.target.value))}
                            >
                              <option value="">Selecione um insumo</option>
                              {insumos.map(insumo => (
                                <option key={insumo.id} value={insumo.id}>
                                  {insumo.nome} ({insumo.unidadeMedida})
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-3">
                    <FormField
                      control={itemForm.control}
                      name="quantidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <Button 
                      type="button" 
                      onClick={() => {
                        const result = itemForm.getValues();
                        if (result.insumoId && result.quantidade > 0) {
                          adicionarItem(result);
                        } else {
                          toast({
                            title: "Erro",
                            description: "Preencha todos os campos corretamente",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
            
            <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium mb-2">Itens adicionados</h3>
              {itens.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item adicionado à cotação</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => {
                      const insumo = insumos.find(i => i.id === item.insumoId);
                      return (
                        <TableRow key={index}>
                          <TableCell>{insumo?.nome || 'Insumo não encontrado'}</TableCell>
                          <TableCell className="text-right">
                            {item.quantidade} {insumo?.unidadeMedida}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0" 
                              onClick={() => removerItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAdicionarItemOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={finalizarItens}
                disabled={itens.length === 0}
              >
                Finalizar Cotação
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para detalhes da cotação */}
      <Dialog open={isDetalhesOpen} onOpenChange={setIsDetalhesOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          {cotacaoSelecionada && (
            <>
              {(() => {
                const cotacao = cotacoes.find(c => c.id === cotacaoSelecionada);
                if (!cotacao) return null;
                
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex justify-between items-center">
                        <span>{cotacao.titulo}</span>
                        <Badge
                          className={
                            cotacao.status === 'Aberta'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : cotacao.status === 'Aguardando Propostas'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : cotacao.status === 'Finalizada'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {cotacao.status}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription>
                        Criada em {format(new Date(cotacao.dataCriacao), 'dd/MM/yyyy')}
                        {cotacao.dataValidade && (
                          <span> · Válida até {format(new Date(cotacao.dataValidade), 'dd/MM/yyyy')}</span>
                        )}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Itens da Cotação</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Insumo</TableHead>
                              <TableHead className="text-right">Quantidade</TableHead>
                              <TableHead>Unidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cotacao.itens.map(item => {
                              const insumo = insumos.find(i => i.id === item.insumoId);
                              return (
                                <TableRow key={item.id}>
                                  <TableCell>{insumo?.nome || 'Insumo não encontrado'}</TableCell>
                                  <TableCell className="text-right">{item.quantidade}</TableCell>
                                  <TableCell>{insumo?.unidadeMedida || '-'}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {cotacao.propostas.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Propostas Recebidas</h3>
                          {cotacao.propostas.map(proposta => {
                            const fornecedor = fornecedores.find(f => f.id === proposta.fornecedorId);
                            
                            // Calcular valor total da proposta
                            const valorItens = proposta.itens.reduce((total, item) => {
                              const cotacaoItem = cotacao.itens.find(i => i.id === item.itemId);
                              return total + (item.precoUnitario * (cotacaoItem?.quantidade || 0));
                            }, 0);
                            const valorTotal = valorItens + proposta.frete;
                            
                            const isVencedora = proposta.id === cotacao.propostaVencedoraId;
                            
                            return (
                              <Card key={proposta.id} className={`mb-4 ${isVencedora ? 'border-green-500' : ''}`}>
                                <CardHeader className="pb-2">
                                  <CardTitle className="flex items-center justify-between text-base">
                                    <div className="flex items-center">
                                      {isVencedora && (
                                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                      )}
                                      <span>{fornecedor?.nome || 'Fornecedor desconhecido'}</span>
                                    </div>
                                    {isVencedora && (
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        Proposta Vencedora
                                      </Badge>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="flex flex-wrap gap-x-4">
                                    <span>Prazo: {proposta.prazoEntrega} dias</span>
                                    <span>Frete: R$ {proposta.frete.toFixed(2)}</span>
                                    <span>Pagamento: {proposta.formaPagamento}</span>
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Insumo</TableHead>
                                        <TableHead className="text-right">Quantidade</TableHead>
                                        <TableHead className="text-right">Preço Un. (R$)</TableHead>
                                        <TableHead className="text-right">Subtotal (R$)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {proposta.itens.map(item => {
                                        const cotacaoItem = cotacao.itens.find(i => i.id === item.itemId);
                                        const insumo = cotacaoItem ? insumos.find(i => i.id === cotacaoItem.insumoId) : null;
                                        const quantidade = cotacaoItem?.quantidade || 0;
                                        const subtotal = item.precoUnitario * quantidade;
                                        
                                        return (
                                          <TableRow key={item.itemId}>
                                            <TableCell>{insumo?.nome || 'Insumo não encontrado'}</TableCell>
                                            <TableCell className="text-right">{quantidade}</TableCell>
                                            <TableCell className="text-right">{item.precoUnitario.toFixed(4)}</TableCell>
                                            <TableCell className="text-right">{subtotal.toFixed(2)}</TableCell>
                                          </TableRow>
                                        );
                                      })}
                                      <TableRow>
                                        <TableCell colSpan={2}></TableCell>
                                        <TableCell className="text-right font-medium">Frete:</TableCell>
                                        <TableCell className="text-right">{proposta.frete.toFixed(2)}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell colSpan={2}></TableCell>
                                        <TableCell className="text-right font-medium">Total:</TableCell>
                                        <TableCell className="text-right font-medium">{valorTotal.toFixed(2)}</TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                  
                                  {!isVencedora && cotacao.status === 'Aguardando Propostas' && (
                                    <div className="mt-4 flex justify-end">
                                      <Button 
                                        size="sm"
                                        onClick={() => escolherVencedor(cotacao.id, proposta.id)}
                                      >
                                        <CheckCircle className="mr-1 h-4 w-4" /> Escolher Proposta
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      <DialogFooter>
                        <div className="flex justify-between w-full">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={exportarCotacaoCSV}
                          >
                            <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                          </Button>
                          
                          <div>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsDetalhesOpen(false)}
                              className="mr-2"
                            >
                              Fechar
                            </Button>
                            
                            {cotacao.status === 'Finalizada' && cotacao.propostaVencedoraId && (
                              <Button 
                                type="button"
                                onClick={criarPedidoCompra}
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" /> Gerar Pedido
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogFooter>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar proposta */}
      <Dialog open={isPropostaOpen} onOpenChange={setIsPropostaOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Proposta</DialogTitle>
            <DialogDescription>
              Registre uma proposta de fornecedor para esta cotação.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...propostaForm}>
            <form onSubmit={propostaForm.handleSubmit(onSubmitProposta)} className="space-y-6">
              <FormField
                control={propostaForm.control}
                name="fornecedorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(Number(e.target.value))}
                      >
                        <option value="">Selecione um fornecedor</option>
                        {fornecedores.map(fornecedor => (
                          <option key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={propostaForm.control}
                  name="prazoEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Entrega (dias)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={propostaForm.control}
                  name="frete"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Frete (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={propostaForm.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: À vista, 30 dias, etc" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={propostaForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Observações adicionais sobre a proposta" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Preços dos Itens</h3>
                <p className="text-sm text-muted-foreground">Informe o preço unitário para cada item da cotação</p>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Unitário (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cotacaoSelecionada && propostaForm.getValues().itens.map((item, index) => {
                      const cotacao = cotacoes.find(c => c.id === cotacaoSelecionada);
                      const cotacaoItem = cotacao?.itens.find(i => i.id === item.itemId);
                      const insumo = cotacaoItem 
                        ? insumos.find(i => i.id === cotacaoItem.insumoId)
                        : null;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{insumo?.nome || 'Insumo não encontrado'}</TableCell>
                          <TableCell className="text-center">{cotacaoItem?.quantidade || 0}</TableCell>
                          <TableCell>{insumo?.unidadeMedida || '-'}</TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              min="0.0001"
                              step="0.0001"
                              value={item.precoUnitario || ''}
                              onChange={(e) => {
                                const newItems = [...propostaForm.getValues().itens];
                                newItems[index].precoUnitario = Number(e.target.value);
                                propostaForm.setValue('itens', newItems);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPropostaOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Proposta</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
