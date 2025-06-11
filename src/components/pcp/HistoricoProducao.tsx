
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useHistoricoProducaoStore } from '@/hooks/useHistoricoProducaoStore';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit, Search, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { validateAdminPin } from '@/utils/adminValidation';

type FiltroHistoricoForm = {
  periodo: 'ultimos7dias' | 'mesAtual' | 'personalizado';
  dataInicio?: Date;
  dataFim?: Date;
  busca?: string;
};

type RegistroProducaoForm = {
  produtoId: number;
  produtoNome: string;
  formasProducidas: number;
  dataProducao: Date;
  turno: string;
  observacoes?: string;
};

export default function HistoricoProducao() {
  const { historico, editarRegistroHistorico, adicionarRegistroHistorico, removerRegistroHistorico } = useHistoricoProducaoStore();
  const [filtrados, setFiltrados] = useState(historico);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogAberta, setDialogAberta] = useState(false);
  const [dialogCriarAberta, setDialogCriarAberta] = useState(false);
  const [dialogExcluirAberta, setDialogExcluirAberta] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [pinIncorreto, setPinIncorreto] = useState(false);
  const [operacaoPendente, setOperacaoPendente] = useState<'editar' | 'criar' | 'excluir' | null>(null);
  const { toast } = useToast();

  const filtroForm = useForm<FiltroHistoricoForm>({
    defaultValues: {
      periodo: 'ultimos7dias',
      busca: '',
    },
  });

  const registroForm = useForm<RegistroProducaoForm>({
    defaultValues: {
      produtoId: 0,
      produtoNome: '',
      formasProducidas: 0,
      dataProducao: new Date(),
      turno: 'Matutino',
      observacoes: '',
    },
  });

  // Função para aplicar filtros
  const aplicarFiltros = (data: FiltroHistoricoForm) => {
    let resultados = [...historico];
    
    // Aplicar filtro de período
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim = hoje;
    
    if (data.periodo === 'ultimos7dias') {
      dataInicio = new Date();
      dataInicio.setDate(hoje.getDate() - 7);
    } else if (data.periodo === 'mesAtual') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (data.periodo === 'personalizado' && data.dataInicio && data.dataFim) {
      dataInicio = data.dataInicio;
      dataFim = data.dataFim;
    } else {
      dataInicio = new Date(0); // Data mínima como fallback
    }
    
    resultados = resultados.filter(registro => 
      registro.dataProducao >= dataInicio && 
      registro.dataProducao <= dataFim
    );
    
    // Aplicar busca por nome do produto
    if (data.busca && data.busca.trim() !== '') {
      const termoBusca = data.busca.toLowerCase().trim();
      resultados = resultados.filter(registro => 
        registro.produtoNome.toLowerCase().includes(termoBusca)
      );
    }
    
    setFiltrados(resultados);
    
    toast({
      title: "Filtros aplicados",
      description: `Exibindo ${resultados.length} registros`
    });
  };

  // Atualizar filtrados quando historico mudar
  useEffect(() => {
    setFiltrados(historico);
  }, [historico]);

  // Função para validar PIN
  const validarPin = () => {
    if (validateAdminPin(pin)) {
      setPinIncorreto(false);
      executarOperacao();
    } else {
      setPinIncorreto(true);
    }
  };

  // Executar operação após validação do PIN
  const executarOperacao = () => {
    switch (operacaoPendente) {
      case 'editar':
        setDialogAberta(true);
        break;
      case 'criar':
        setDialogCriarAberta(true);
        break;
      case 'excluir':
        setDialogExcluirAberta(true);
        break;
    }
    setOperacaoPendente(null);
    setPin('');
  };

  // Função para preparar edição
  const prepararEdicao = (id: number) => {
    const registro = historico.find(r => r.id === id);
    if (registro) {
      registroForm.reset({
        produtoId: registro.produtoId,
        produtoNome: registro.produtoNome,
        formasProducidas: registro.formasProducidas,
        dataProducao: registro.dataProducao,
        turno: registro.turno,
        observacoes: registro.observacoes,
      });
      setEditandoId(id);
      setOperacaoPendente('editar');
      solicitarPin();
    }
  };

  // Função para preparar criação
  const prepararCriacao = () => {
    registroForm.reset({
      produtoId: 0,
      produtoNome: '',
      formasProducidas: 0,
      dataProducao: new Date(),
      turno: 'Matutino',
      observacoes: '',
    });
    setOperacaoPendente('criar');
    solicitarPin();
  };

  // Função para preparar exclusão
  const prepararExclusao = (id: number) => {
    setIdParaExcluir(id);
    setOperacaoPendente('excluir');
    solicitarPin();
  };

  // Função para solicitar PIN
  const solicitarPin = () => {
    const pinInput = prompt('Digite o PIN de administrador:');
    if (pinInput) {
      setPin(pinInput);
      if (validateAdminPin(pinInput)) {
        setPinIncorreto(false);
        executarOperacao();
      } else {
        setPinIncorreto(true);
        toast({
          title: "PIN incorreto",
          description: "PIN de administrador inválido",
          variant: "destructive",
        });
      }
    }
  };
  
  // Função para salvar edição
  const salvarEdicao = (data: RegistroProducaoForm) => {
    if (editandoId !== null) {
      editarRegistroHistorico(editandoId, {
        produtoId: data.produtoId,
        produtoNome: data.produtoNome,
        formasProducidas: data.formasProducidas,
        unidadesCalculadas: data.formasProducidas * 30, // Usar valor real de unidadesPorForma
        dataProducao: data.dataProducao,
        turno: data.turno,
        observacoes: data.observacoes || ''
      });
      
      // Refaz a filtragem com os novos dados
      aplicarFiltros(filtroForm.getValues());
      
      toast({
        title: "Registro atualizado",
        description: "O registro de produção foi atualizado com sucesso."
      });
      
      setDialogAberta(false);
      setEditandoId(null);
    }
  };

  // Função para criar registro
  const criarRegistro = (data: RegistroProducaoForm) => {
    adicionarRegistroHistorico({
      produtoId: data.produtoId,
      produtoNome: data.produtoNome,
      formasProducidas: data.formasProducidas,
      unidadesCalculadas: data.formasProducidas * 30,
      dataProducao: data.dataProducao,
      turno: data.turno,
      observacoes: data.observacoes || '',
      origem: 'Manual'
    });

    aplicarFiltros(filtroForm.getValues());
    
    toast({
      title: "Registro criado",
      description: "Novo registro de produção foi criado com sucesso."
    });
    
    setDialogCriarAberta(false);
  };

  // Função para excluir registro
  const excluirRegistro = () => {
    if (idParaExcluir !== null) {
      removerRegistroHistorico(idParaExcluir);
      aplicarFiltros(filtroForm.getValues());
      
      toast({
        title: "Registro excluído",
        description: "O registro de produção foi excluído com sucesso."
      });
      
      setDialogExcluirAberta(false);
      setIdParaExcluir(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Produção</CardTitle>
            <Button onClick={prepararCriacao}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Registro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...filtroForm}>
            <form onSubmit={filtroForm.handleSubmit(aplicarFiltros)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={filtroForm.control}
                  name="periodo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um período" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ultimos7dias">Últimos 7 dias</SelectItem>
                          <SelectItem value="mesAtual">Mês atual</SelectItem>
                          <SelectItem value="personalizado">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {filtroForm.watch('periodo') === 'personalizado' && (
                  <>
                    <FormField
                      control={filtroForm.control}
                      name="dataInicio"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data inicial</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={filtroForm.control}
                      name="dataFim"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data final</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <FormField
                  control={filtroForm.control}
                  name="busca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Busca por produto</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="Digite para buscar..." />
                          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit">Aplicar filtros</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Registros de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          {filtrados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Formas</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>{format(registro.dataProducao, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{registro.produtoNome}</TableCell>
                      <TableCell>{registro.formasProducidas}</TableCell>
                      <TableCell>{registro.unidadesCalculadas}</TableCell>
                      <TableCell>{registro.turno}</TableCell>
                      <TableCell>
                        <Badge variant={registro.origem === 'Agendada' ? 'default' : 'secondary'}>
                          {registro.origem}
                        </Badge>
                      </TableCell>
                      <TableCell>{registro.observacoes || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => prepararEdicao(registro.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => prepararExclusao(registro.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado para os filtros aplicados.
            </div>
          )}

          {/* Dialog para editar */}
          <Dialog open={dialogAberta} onOpenChange={setDialogAberta}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Registro de Produção</DialogTitle>
                <DialogDescription>
                  Edite os dados do registro de produção.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...registroForm}>
                <form onSubmit={registroForm.handleSubmit(salvarEdicao)} className="space-y-4">
                  <FormField
                    control={registroForm.control}
                    name="produtoNome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registroForm.control}
                    name="formasProducidas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formas produzidas</FormLabel>
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
                    control={registroForm.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações sobre esta produção" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogAberta(false)}>Cancelar</Button>
                    <Button type="submit">Salvar alterações</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Dialog para criar */}
          <Dialog open={dialogCriarAberta} onOpenChange={setDialogCriarAberta}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo Registro de Produção</DialogTitle>
                <DialogDescription>
                  Crie um novo registro de produção.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...registroForm}>
                <form onSubmit={registroForm.handleSubmit(criarRegistro)} className="space-y-4">
                  <FormField
                    control={registroForm.control}
                    name="produtoNome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registroForm.control}
                    name="formasProducidas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formas produzidas</FormLabel>
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
                    control={registroForm.control}
                    name="turno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turno</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um turno" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Matutino">Matutino</SelectItem>
                            <SelectItem value="Vespertino">Vespertino</SelectItem>
                            <SelectItem value="Noturno">Noturno</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registroForm.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações sobre esta produção" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogCriarAberta(false)}>Cancelar</Button>
                    <Button type="submit">Criar registro</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Dialog para confirmar exclusão */}
          <Dialog open={dialogExcluirAberta} onOpenChange={setDialogExcluirAberta}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir este registro de produção? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogExcluirAberta(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={excluirRegistro}>Excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
