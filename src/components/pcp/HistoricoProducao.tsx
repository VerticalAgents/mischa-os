
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, subDays } from 'date-fns';
import { useProdutoStore } from '@/hooks/useProdutoStore';
import { Search, Edit2, Calendar } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Mock data for history records
const mockHistoricoProducao = [
  {
    id: 1,
    dataProducao: new Date(),
    produtoId: 1,
    formasProduzidas: 10,
    unidadesProduzidas: 300,
    turno: 'Matutino',
    observacoes: 'Produção normal',
  },
  {
    id: 2,
    dataProducao: subDays(new Date(), 1),
    produtoId: 2,
    formasProduzidas: 8,
    unidadesProduzidas: 240,
    turno: 'Vespertino',
    observacoes: 'Temperatura elevada, necessário ajustes',
  },
  {
    id: 3,
    dataProducao: subDays(new Date(), 2),
    produtoId: 3,
    formasProduzidas: 12,
    unidadesProduzidas: 360,
    turno: 'Matutino',
    observacoes: '',
  },
  {
    id: 4,
    dataProducao: subDays(new Date(), 3),
    produtoId: 1,
    formasProduzidas: 15,
    unidadesProduzidas: 450,
    turno: 'Noturno',
    observacoes: 'Produção extra para evento',
  },
  {
    id: 5,
    dataProducao: subDays(new Date(), 5),
    produtoId: 4,
    formasProduzidas: 6,
    unidadesProduzidas: 180,
    turno: 'Vespertino',
    observacoes: '',
  },
];

type FiltroPeriodo = '7dias' | 'mesAtual' | 'personalizado';

export default function HistoricoProducao() {
  const { produtos } = useProdutoStore();
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('7dias');
  const [busca, setBusca] = useState('');
  const [registroEditando, setRegistroEditando] = useState<any | null>(null);
  const [dialogSenhaAberta, setDialogSenhaAberta] = useState(false);
  const [dialogEdicaoAberta, setDialogEdicaoAberta] = useState(false);
  const [senha, setSenha] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const { toast } = useToast();

  const handleEditarClick = (registro: any) => {
    setRegistroEditando(registro);
    setDialogSenhaAberta(true);
  };

  const verificarSenha = () => {
    if (senha === 'mischa') {
      setSenhaErro('');
      setDialogSenhaAberta(false);
      setDialogEdicaoAberta(true);
    } else {
      setSenhaErro('Senha incorreta');
    }
  };

  const handleSalvarEdicao = (dadosAtualizados: any) => {
    // Aqui seria a integração com o back-end para atualizar os dados
    toast({
      title: 'Registro atualizado',
      description: 'Os dados de produção foram atualizados com sucesso.',
    });
    setDialogEdicaoAberta(false);
    setRegistroEditando(null);
  };

  const historico = mockHistoricoProducao.filter((registro) => {
    // Filtrar por busca
    const nomeProduto = produtos.find(p => p.id === registro.produtoId)?.nome || '';
    const buscaMatch = nomeProduto.toLowerCase().includes(busca.toLowerCase());
    
    // Filtrar por período
    let periodoDentro = true;
    const hoje = new Date();
    
    if (filtroPeriodo === '7dias') {
      const limiteData = subDays(hoje, 7);
      periodoDentro = registro.dataProducao >= limiteData;
    } else if (filtroPeriodo === 'mesAtual') {
      periodoDentro = 
        registro.dataProducao.getMonth() === hoje.getMonth() && 
        registro.dataProducao.getFullYear() === hoje.getFullYear();
    }
    
    return buscaMatch && periodoDentro;
  });
  
  // Ordenar por data (mais recente primeiro)
  const historicoOrdenado = [...historico].sort((a, b) => 
    b.dataProducao.getTime() - a.dataProducao.getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex w-full md:w-auto gap-2">
          <Select 
            value={filtroPeriodo} 
            onValueChange={(value: FiltroPeriodo) => setFiltroPeriodo(value)}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="mesAtual">Mês atual</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {filtroPeriodo === 'personalizado' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Selecionar datas</span>
              </Button>
            </div>
          )}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Buscar produto" 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Formas</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicoOrdenado.length > 0 ? (
                historicoOrdenado.map((registro) => {
                  const produto = produtos.find(p => p.id === registro.produtoId);
                  return (
                    <TableRow key={registro.id}>
                      <TableCell className="font-medium">
                        {format(registro.dataProducao, "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{produto?.nome || 'Produto removido'}</TableCell>
                      <TableCell className="text-right">{registro.formasProduzidas}</TableCell>
                      <TableCell className="text-right">{registro.unidadesProduzidas}</TableCell>
                      <TableCell>{registro.turno || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {registro.observacoes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditarClick(registro)}
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog para verificação de senha */}
      <Dialog open={dialogSenhaAberta} onOpenChange={setDialogSenhaAberta}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verificação de Administrador</DialogTitle>
            <DialogDescription>
              Digite a senha de administrador para editar este registro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Senha de administrador"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            {senhaErro && (
              <p className="text-sm text-red-500">{senhaErro}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogSenhaAberta(false)}>
              Cancelar
            </Button>
            <Button onClick={verificarSenha}>
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para edição de registro */}
      {registroEditando && (
        <EditarRegistroDialog
          open={dialogEdicaoAberta}
          setOpen={setDialogEdicaoAberta}
          registro={registroEditando}
          produtos={produtos}
          onSalvar={handleSalvarEdicao}
        />
      )}
    </div>
  );
}

interface EditarRegistroDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  registro: any;
  produtos: any[];
  onSalvar: (dados: any) => void;
}

const EditarRegistroDialog = ({
  open,
  setOpen,
  registro,
  produtos,
  onSalvar,
}: EditarRegistroDialogProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      produtoId: registro.produtoId,
      formasProduzidas: registro.formasProduzidas,
      turno: registro.turno || '',
      observacoes: registro.observacoes || '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Registro de Produção</DialogTitle>
          <DialogDescription>
            Data: {format(registro.dataProducao, "dd/MM/yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSalvar)} className="space-y-4">
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Produto</label>
              <Select defaultValue={registro.produtoId.toString()}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id.toString()}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Formas produzidas</label>
              <Input
                type="number"
                min={1}
                {...register('formasProduzidas', { 
                  required: "Campo obrigatório",
                  min: { value: 1, message: "Mínimo de 1 forma" }
                })}
              />
              {errors.formasProduzidas && (
                <p className="text-sm text-red-500">{errors.formasProduzidas.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Turno</label>
              <Select defaultValue={registro.turno || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matutino">Matutino</SelectItem>
                  <SelectItem value="Vespertino">Vespertino</SelectItem>
                  <SelectItem value="Noturno">Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Observações</label>
              <Input
                {...register('observacoes')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
