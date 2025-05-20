import { useState } from "react";
import { useInsumosStore } from "@/hooks/useInsumosStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Cotacao, PropostaFornecedor } from "@/types/insumos";
import {
  FileDown,
  Search,
  FilePlus,
  Pencil,
  Trash,
  ShoppingCart,
  Plus,
  Check,
  X,
  AlignJustify,
} from "lucide-react";

// Form schemas
const cotacaoFormSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  dataValidade: z.date().optional(),
  itens: z.array(
    z.object({
      insumoId: z.number({ required_error: "Selecione um insumo" }),
      quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
    })
  ).min(1, "Adicione pelo menos um item"),
});

const propostaFormSchema = z.object({
  fornecedorId: z.number({ required_error: "Selecione um fornecedor" }),
  itens: z.array(
    z.object({
      itemId: z.number(),
      precoUnitario: z.number().min(0.01, "Preço deve ser maior que zero"),
    })
  ),
  prazoEntrega: z.number().min(1, "Prazo deve ser de pelo menos 1 dia"),
  frete: z.number().min(0, "Frete não pode ser negativo"),
  formaPagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  observacoes: z.string().optional(),
});

type CotacaoFormValues = z.infer<typeof cotacaoFormSchema>;
type PropostaFormValues = z.infer<typeof propostaFormSchema>;

export default function CotacoesTab() {
  const { cotacoes, insumos, fornecedores, criarCotacao, escolherPropostaVencedora, adicionarPropostaFornecedor, gerarPedidoCompraDeCotacao } = useInsumosStore();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Cotacao['status'] | "Todas">("Todas");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPropostaFormOpen, setIsPropostaFormOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [editingCotacao, setEditingCotacao] = useState<number | null>(null);
  const [selectedCotacao, setSelectedCotacao] = useState<number | null>(null);
  
  // Form para cotação
  const cotacaoForm = useForm<CotacaoFormValues>({
    resolver: zodResolver(cotacaoFormSchema),
    defaultValues: {
      titulo: "",
      itens: [{ insumoId: 0, quantidade: 1 }]
    }
  });
  
  // Form para proposta de fornecedor
  const propostaForm = useForm<PropostaFormValues>({
    resolver: zodResolver(propostaFormSchema),
    defaultValues: {
      fornecedorId: 0,
      itens: [],
      prazoEntrega: 5,
      frete: 0,
      formaPagamento: "À vista",
      observacoes: ""
    }
  });
  
  // Filtragem de cotações
  const cotacoesFiltradas = cotacoes
    .filter(cotacao => 
      cotacao.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(cotacao => statusFilter === "Todas" || cotacao.status === statusFilter)
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
  
  // Contadores para os cards
  const totalCotacoes = cotacoes.length;
  const cotacoesAbertas = cotacoes.filter(c => c.status === "Aberta" || c.status === "Aguardando Propostas").length;
  const cotacoesConcluidas = cotacoes.filter(c => c.status === "Finalizada").length;
  const cotacoesCanceladas = cotacoes.filter(c => c.status === "Cancelada").length;
  
  // Handlers
  const openNewCotacaoForm = () => {
    cotacaoForm.reset({
      titulo: "",
      itens: [{ insumoId: 0, quantidade: 1 }]
    });
    setEditingCotacao(null);
    setIsFormOpen(true);
  };
  
  const openEditCotacaoForm = (cotacao: Cotacao) => {
    cotacaoForm.reset({
      titulo: cotacao.titulo,
      dataValidade: cotacao.dataValidade,
      itens: cotacao.itens.map(item => ({
        insumoId: item.insumoId,
        quantidade: item.quantidade
      }))
    });
    setEditingCotacao(cotacao.id);
    setIsFormOpen(true);
  };
  
  const openPropostaForm = (cotacao: Cotacao) => {
    const itensProposta = cotacao.itens.map(item => ({
      itemId: item.id,
      precoUnitario: 0
    }));
    
    propostaForm.reset({
      fornecedorId: 0,
      itens: itensProposta,
      prazoEntrega: 5,
      frete: 0,
      formaPagamento: "À vista",
      observacoes: ""
    });
    
    setSelectedCotacao(cotacao.id);
    setIsPropostaFormOpen(true);
  };
  
  const openDetalhes = (cotacao: Cotacao) => {
    setSelectedCotacao(cotacao.id);
    setIsDetalhesOpen(true);
  };
  
  const handleDeleteCotacao = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta cotação?")) {
      toast({
        title: "Funcionalidade não implementada",
        description: "A remoção de cotações será implementada em breve.",
        variant: "destructive"
      });
    }
  };
  
  const adicionarItemCotacao = () => {
    const itens = cotacaoForm.getValues("itens");
    cotacaoForm.setValue("itens", [
      ...itens,
      { insumoId: 0, quantidade: 1 }
    ]);
  };
  
  const removerItemCotacao = (index: number) => {
    const itens = cotacaoForm.getValues("itens");
    if (itens.length > 1) {
      cotacaoForm.setValue(
        "itens",
        itens.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: "Erro",
        description: "A cotação deve ter pelo menos um item",
        variant: "destructive",
      });
    }
  };
  
  const onSubmitCotacao = (values: CotacaoFormValues) => {
    if (editingCotacao) {
      toast({
        title: "Funcionalidade não implementada",
        description: "A atualização de cotações será implementada em breve.",
      });
    } else {
      criarCotacao({
        titulo: values.titulo,
        dataValidade: values.dataValidade,
        status: "Aberta",
        itens: values.itens.map((item, index) => ({
          id: index + 1, // Temporary IDs that will be replaced in the store
          insumoId: item.insumoId, 
          quantidade: item.quantidade
        }))
      });
      
      toast({
        title: "Cotação criada",
        description: `A nova cotação "${values.titulo}" foi criada com sucesso!`,
      });
    }
    setIsFormOpen(false);
  };
  
  const onSubmitProposta = (values: PropostaFormValues) => {
    if (selectedCotacao) {
      const itensCompletos = values.itens.map(item => ({
        itemId: item.itemId,
        precoUnitario: item.precoUnitario
      }));
      
      adicionarPropostaFornecedor({
        cotacaoId: selectedCotacao,
        fornecedorId: values.fornecedorId,
        itens: itensCompletos,
        prazoEntrega: values.prazoEntrega,
        frete: values.frete,
        formaPagamento: values.formaPagamento,
        observacoes: values.observacoes
      });
      
      toast({
        title: "Proposta adicionada",
        description: "A proposta foi adicionada com sucesso!",
      });
      
      setIsPropostaFormOpen(false);
    }
  };
  
  const handleSetPropostaVencedora = (cotacaoId: number, propostaId: number) => {
    if (confirm("Deseja definir esta proposta como vencedora? Isso finalizará a cotação.")) {
      escolherPropostaVencedora(cotacaoId, propostaId);
      toast({
        title: "Proposta vencedora definida",
        description: "A cotação foi finalizada com sucesso!",
      });
    }
  };
  
  const handleGerarPedido = (cotacaoId: number) => {
    if (confirm("Deseja gerar um pedido de compra com base nesta cotação?")) {
      gerarPedidoCompraDeCotacao(cotacaoId);
      toast({
        title: "Pedido gerado",
        description: "O pedido de compra foi gerado com sucesso!",
      });
      setIsDetalhesOpen(false);
    }
  };
  
  const exportarCSV = () => {
    const headers = ["ID", "Título", "Data Criação", "Data Validade", "Status", "Qtd Itens", "Qtd Propostas"];
    
    const linhas = cotacoesFiltradas.map(cotacao => [
      cotacao.id,
      cotacao.titulo,
      format(new Date(cotacao.dataCriacao), "dd/MM/yyyy"),
      cotacao.dataValidade ? format(new Date(cotacao.dataValidade), "dd/MM/yyyy") : "N/A",
      cotacao.status,
      cotacao.itens.length,
      cotacao.propostas.length
    ]);
    
    const csvContent = [
      headers.join(","),
      ...linhas.map(l => l.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cotacoes_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getPropostaStatusBadge = (status: string) => {
    switch (status) {
      case "Aberta":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Aberta</Badge>;
      case "Aguardando Propostas":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Aguardando Propostas</Badge>;
      case "Finalizada":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Finalizada</Badge>;
      case "Cancelada":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Cotações de Insumos</h2>
          <p className="text-muted-foreground">Compare preços e condições de fornecedores antes de comprar</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportarCSV} variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={openNewCotacaoForm}>
            <FilePlus className="mr-2 h-4 w-4" /> Nova Cotação
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Cotações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCotacoes}</div>
            <p className="text-xs text-muted-foreground">cotações registradas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cotações em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{cotacoesAbertas}</div>
            <p className="text-xs text-muted-foreground">aguardando propostas ou análise</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cotações Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{cotacoesConcluidas}</div>
            <p className="text-xs text-muted-foreground">finalizadas com compra</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cotações Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{cotacoesCanceladas}</div>
            <p className="text-xs text-muted-foreground">canceladas sem compra</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cotação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm"
            variant={statusFilter === "Todas" ? "default" : "outline"} 
            onClick={() => setStatusFilter("Todas")}
          >
            Todas
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === "Aberta" ? "default" : "outline"} 
            onClick={() => setStatusFilter("Aberta")}
          >
            Abertas
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === "Aguardando Propostas" ? "default" : "outline"} 
            onClick={() => setStatusFilter("Aguardando Propostas")}
          >
            Aguardando Propostas
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === "Finalizada" ? "default" : "outline"} 
            onClick={() => setStatusFilter("Finalizada")}
          >
            Finalizadas
          </Button>
          <Button 
            size="sm"
            variant={statusFilter === "Cancelada" ? "default" : "outline"} 
            onClick={() => setStatusFilter("Cancelada")}
          >
            Canceladas
          </Button>
        </div>
      </div>
      
      {/* Lista de Cotações */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotações</CardTitle>
          <CardDescription>Gerencie e acompanhe as cotações de insumos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Data Validade</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Propostas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotacoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Nenhuma cotação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                cotacoesFiltradas.map((cotacao) => (
                  <TableRow key={cotacao.id}>
                    <TableCell>{cotacao.id}</TableCell>
                    <TableCell className="font-medium">{cotacao.titulo}</TableCell>
                    <TableCell>{format(new Date(cotacao.dataCriacao), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      {cotacao.dataValidade 
                        ? format(new Date(cotacao.dataValidade), "dd/MM/yyyy")
                        : "—"
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {getPropostaStatusBadge(cotacao.status)}
                    </TableCell>
                    <TableCell>{cotacao.itens.length}</TableCell>
                    <TableCell>{cotacao.propostas.length}</TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openDetalhes(cotacao)}
                        >
                          <AlignJustify className="h-4 w-4" />
                        </Button>
                        
                        {(cotacao.status === "Aberta" || cotacao.status === "Aguardando Propostas") && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openEditCotacaoForm(cotacao)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openPropostaForm(cotacao)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteCotacao(cotacao.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {cotacao.status === "Finalizada" && cotacao.propostaVencedoraId && (
                          <Button
                            size="sm"
                            onClick={() => handleGerarPedido(cotacao.id)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" /> Gerar Pedido
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Form de Cotação */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              {editingCotacao ? "Editar Cotação" : "Nova Cotação"}
            </DialogTitle>
            <DialogDescription>
              {editingCotacao 
                ? "Atualize os detalhes da cotação existente."
                : "Crie uma nova cotação para obter preços de insumos."
              }
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
                      <Input placeholder="Ex: Cotação mensal de matérias-primas" {...field} />
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
                    <FormLabel>Data de Validade (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <h3 className="text-md font-medium mb-2">Itens da Cotação</h3>
                
                {cotacaoForm.getValues().itens.map((_, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <FormField
                      control={cotacaoForm.control}
                      name={`itens.${index}.insumoId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            >
                              <option value={0}>Selecione um insumo</option>
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
                    
                    <FormField
                      control={cotacaoForm.control}
                      name={`itens.${index}.quantidade`}
                      render={({ field }) => (
                        <FormItem className="w-28">
                          <FormControl>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Qtd"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {cotacaoForm.getValues().itens.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removerItemCotacao(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarItemCotacao}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                </Button>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCotacao ? "Salvar Alterações" : "Criar Cotação"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Form de Proposta */}
      <Dialog open={isPropostaFormOpen} onOpenChange={setIsPropostaFormOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Nova Proposta de Fornecedor</DialogTitle>
            <DialogDescription>
              Adicione uma proposta de fornecedor para esta cotação
            </DialogDescription>
          </DialogHeader>
          
          <Form {...propostaForm}>
            <form onSubmit={propostaForm.handleSubmit(onSubmitProposta)} className="space-y-4">
              <FormField
                control={propostaForm.control}
                name="fornecedorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      >
                        <option value={0}>Selecione um fornecedor</option>
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
              
              <div>
                <h3 className="text-md font-medium mb-2">Preços dos Itens</h3>
                
                {selectedCotacao && cotacoes.find(c => c.id === selectedCotacao)?.itens.map((item, index) => {
                  const insumo = insumos.find(i => i.id === item.insumoId);
                  
                  return (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{insumo?.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Quantidade: {item.quantidade} {insumo?.unidadeMedida}
                        </p>
                      </div>
                      
                      <FormField
                        control={propostaForm.control}
                        name={`itens.${index}.precoUnitario`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Preço Un."
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <input 
                        type="hidden" 
                        {...propostaForm.register(`itens.${index}.itemId`)}
                        value={item.id}
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          step="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      <Input placeholder="Ex: À vista, 30 dias, etc" {...field} />
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
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Observações adicionais" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPropostaFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Adicionar Proposta
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Detalhes */}
      <Dialog open={isDetalhesOpen} onOpenChange={setIsDetalhesOpen}>
        <DialogContent className="sm:max-w-[800px]">
          {selectedCotacao && (
            <>
              {(() => {
                const cotacao = cotacoes.find(c => c.id === selectedCotacao);
                if (!cotacao) return null;
                
                return (
                  <>
                    <DialogHeader>
                      <div className="flex justify-between">
                        <DialogTitle className="text-xl">
                          {cotacao.titulo}
                        </DialogTitle>
                        {getPropostaStatusBadge(cotacao.status)}
                      </div>
                      <DialogDescription>
                        <div className="flex justify-between text-sm mt-2">
                          <div>
                            <p>Cotação #{cotacao.id}</p>
                            <p>Criado em: {format(new Date(cotacao.dataCriacao), "dd/MM/yyyy")}</p>
                          </div>
                          <div>
                            <p>
                              Validade: {cotacao.dataValidade 
                                ? format(new Date(cotacao.dataValidade), "dd/MM/yyyy")
                                : "Não informada"}
                            </p>
                            <p>Status: {cotacao.status}</p>
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">Itens da Cotação</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Quantidade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cotacao.itens.map(item => {
                            const insumo = insumos.find(i => i.id === item.insumoId);
                            return (
                              <TableRow key={item.id}>
                                <TableCell>{insumo?.nome || "Insumo não encontrado"}</TableCell>
                                <TableCell className="text-center">
                                  {item.quantidade} {insumo?.unidadeMedida || ''}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <DialogFooter className="mt-6">
                      <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={() => {
                          alert("Funcionalidade de imprimir em desenvolvimento");
                        }}>
                          <FileDown className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                        
                        <div>
                          <Button variant="outline" onClick={() => setIsDetalhesOpen(false)} className="mr-2">
                            Fechar
                          </Button>
                          
                          {(cotacao.status === 'Aberta' || cotacao.status === 'Finalizada') && (
                            <Button onClick={() => handleGerarPedido(cotacao.id)}>
                              <ShoppingCart className="mr-2 h-4 w-4" /> Gerar Pedido
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogFooter>
                  </>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
