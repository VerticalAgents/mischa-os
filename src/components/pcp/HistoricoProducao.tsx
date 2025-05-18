
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  DialogTrigger,
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
import { CalendarIcon, Edit, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

// Dummy data for the component
const historicoProducao = [
  {
    id: 1,
    dataProducao: new Date(2023, 4, 15),
    produtoId: 1,
    produtoNome: 'Tradicional',
    formasProducidas: 10,
    unidadesCalculadas: 300,
    turno: 'Matutino',
    observacoes: 'Produção regular',
  },
  {
    id: 2,
    dataProducao: new Date(2023, 4, 16),
    produtoId: 2,
    produtoNome: 'Choco Duo',
    formasProducidas: 8,
    unidadesCalculadas: 240,
    turno: 'Vespertino',
    observacoes: 'Produção especial para evento',
  },
  {
    id: 3,
    dataProducao: new Date(2023, 4, 17),
    produtoId: 3,
    produtoNome: 'Mesclado',
    formasProducidas: 5,
    unidadesCalculadas: 150,
    turno: 'Noturno',
    observacoes: '',
  },
];

type FiltroHistoricoForm = {
  periodo: 'ultimos7dias' | 'mesAtual' | 'personalizado';
  dataInicio?: Date;
  dataFim?: Date;
  busca?: string;
};

type EditarRegistroForm = {
  produtoId: number;
  formasProducidas: number;
  dataProducao: Date;
  turno: string;
  observacoes?: string;
};

export default function HistoricoProducao() {
  const [registros, setRegistros] = useState(historicoProducao);
  const [filtrados, setFiltrados] = useState(historicoProducao);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogAberta, setDialogAberta] = useState(false);
  const { toast } = useToast();

  const filtroForm = useForm<FiltroHistoricoForm>({
    defaultValues: {
      periodo: 'ultimos7dias',
      busca: '',
    },
  });

  const editarForm = useForm<EditarRegistroForm>({
    defaultValues: {
      produtoId: 0,
      formasProducidas: 0,
      dataProducao: new Date(),
      turno: 'Matutino',
      observacoes: '',
    },
  });

  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [senhaIncorreta, setSenhaIncorreta] = useState(false);
  const [senhaValidada, setSenhaValidada] = useState(false);

  // Função para aplicar filtros
  const aplicarFiltros = (data: FiltroHistoricoForm) => {
    let resultados = [...registros];
    
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

  // Função para preparar edição
  const prepararEdicao = (id: number) => {
    const registro = registros.find(r => r.id === id);
    if (registro) {
      editarForm.reset({
        produtoId: registro.produtoId,
        formasProducidas: registro.formasProducidas,
        dataProducao: registro.dataProducao,
        turno: registro.turno,
        observacoes: registro.observacoes,
      });
      setEditandoId(id);
      setDialogAberta(true);
    }
  };
  
  // Função para salvar edição
  const salvarEdicao = (data: EditarRegistroForm) => {
    if (editandoId !== null) {
      // Atualiza o registro editado
      setRegistros(prevRegistros => 
        prevRegistros.map(registro => 
          registro.id === editandoId 
            ? {
                ...registro,
                produtoId: data.produtoId,
                produtoNome: 'Produto ' + data.produtoId, // Mockup - deveria buscar nome real
                formasProducidas: data.formasProducidas,
                unidadesCalculadas: data.formasProducidas * 30, // Mockup - usar valor real de unidadesPorForma
                dataProducao: data.dataProducao,
                turno: data.turno,
                observacoes: data.observacoes || ''
              }
            : registro
        )
      );
      
      // Refaz a filtragem com os novos dados
      aplicarFiltros(filtroForm.getValues());
      
      toast({
        title: "Registro atualizado",
        description: "O registro de produção foi atualizado com sucesso."
      });
      
      setDialogAberta(false);
      setSenhaValidada(false);
    }
  };
  
  // Função para validar senha de administrador
  const validarSenha = () => {
    if (senhaAdmin === 'mischa') {
      setSenhaValidada(true);
      setSenhaIncorreta(false);
    } else {
      setSenhaIncorreta(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
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
                      <FormMessage>{field.value}</FormMessage>
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
          <CardTitle>Histórico de Produção</CardTitle>
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
                      <TableCell>{registro.observacoes || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => prepararEdicao(registro.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
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
          
          <Dialog open={dialogAberta} onOpenChange={setDialogAberta}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Registro de Produção</DialogTitle>
                <DialogDescription>
                  {!senhaValidada 
                    ? "Por favor, insira a senha de administrador para editar este registro."
                    : "Edite os dados do registro de produção."
                  }
                </DialogDescription>
              </DialogHeader>
              
              {!senhaValidada ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="senha">Senha de administrador</label>
                    <Input 
                      id="senha" 
                      type="password" 
                      value={senhaAdmin} 
                      onChange={(e) => setSenhaAdmin(e.target.value)}
                      className={senhaIncorreta ? "border-red-500" : ""}
                    />
                    {senhaIncorreta && (
                      <p className="text-sm text-red-500">Senha incorreta</p>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogAberta(false)}>Cancelar</Button>
                    <Button onClick={validarSenha}>Validar</Button>
                  </DialogFooter>
                </div>
              ) : (
                <Form {...editarForm}>
                  <form onSubmit={editarForm.handleSubmit(salvarEdicao)} className="space-y-4">
                    {/* Form fields for editing go here */}
                    <FormField
                      control={editarForm.control}
                      name="produtoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produto</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value ? field.value.toString() : ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Tradicional</SelectItem>
                              <SelectItem value="2">Choco Duo</SelectItem>
                              <SelectItem value="3">Mesclado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editarForm.control}
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
                      control={editarForm.control}
                      name="dataProducao"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de produção</FormLabel>
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
                      control={editarForm.control}
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
                      control={editarForm.control}
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
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
