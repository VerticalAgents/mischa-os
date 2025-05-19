
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, PlusCircle, AlertCircle } from "lucide-react";
import { useStatusAgendamentoStore } from "@/hooks/useStatusAgendamentoStore";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AgendamentoTab() {
  const { 
    statusAgendamento,
    adicionarStatus,
    atualizarStatus,
    removerStatus,
    getStatusFixos,
    getStatusPersonalizados
  } = useStatusAgendamentoStore();
  
  const [novoStatus, setNovoStatus] = useState({
    nome: "",
    descricao: "",
    cor: "#6E59A5" // Default color
  });
  
  const statusFixos = getStatusFixos();
  const statusPersonalizados = getStatusPersonalizados();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status de Agendamento</CardTitle>
          <CardDescription>
            Gerencie os status do fluxo de agendamento de clientes e entregas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Status Padrão do Sistema</h3>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                <span className="text-sm text-muted-foreground">Estes status são obrigatórios e não podem ser alterados</span>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusFixos.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell>
                      <Badge style={{ backgroundColor: status.cor }} className="text-white">
                        {status.nome}
                      </Badge>
                    </TableCell>
                    <TableCell>{status.descricao}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border" 
                          style={{ backgroundColor: status.cor }}
                        />
                        <span className="text-xs">{status.cor}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-8 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Status Personalizados</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-1">
                      <PlusCircle className="h-4 w-4" />
                      <span>Adicionar Status</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Status</DialogTitle>
                      <DialogDescription>
                        Crie um novo status personalizado para o fluxo de agendamento
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nome" className="text-right">Nome</Label>
                        <Input
                          id="nome"
                          value={novoStatus.nome}
                          onChange={(e) => setNovoStatus({...novoStatus, nome: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="descricao" className="text-right">Descrição</Label>
                        <Input
                          id="descricao"
                          value={novoStatus.descricao}
                          onChange={(e) => setNovoStatus({...novoStatus, descricao: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cor" className="text-right">Cor</Label>
                        <div className="col-span-3 flex items-center gap-2">
                          <Input
                            id="cor"
                            type="color"
                            value={novoStatus.cor}
                            onChange={(e) => setNovoStatus({...novoStatus, cor: e.target.value})}
                            className="w-12 h-8 p-1 cursor-pointer"
                          />
                          <Input
                            value={novoStatus.cor}
                            onChange={(e) => setNovoStatus({...novoStatus, cor: e.target.value})}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button onClick={() => {
                          if (!novoStatus.nome) return;
                          adicionarStatus({
                            nome: novoStatus.nome,
                            descricao: novoStatus.descricao,
                            cor: novoStatus.cor,
                            fixo: false
                          });
                          setNovoStatus({ nome: "", descricao: "", cor: "#6E59A5" });
                        }}>Adicionar</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="mt-4">
                {statusPersonalizados.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusPersonalizados.map((status) => (
                        <TableRow key={status.id}>
                          <TableCell>
                            <Badge style={{ backgroundColor: status.cor }} className="text-white">
                              {status.nome}
                            </Badge>
                          </TableCell>
                          <TableCell>{status.descricao}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded-full border" 
                                style={{ backgroundColor: status.cor }}
                              />
                              <span className="text-xs">{status.cor}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removerStatus(status.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum status personalizado cadastrado</p>
                    <p className="text-sm">Clique em "Adicionar Status" para criar um novo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Substatus de Pedidos Agendados</CardTitle>
          <CardDescription>
            Visualize os substatus operacionais para pedidos agendados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Substatus Operacionais</h3>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                <span className="text-sm text-muted-foreground">Estes substatus são obrigatórios e não podem ser alterados</span>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Ações automáticas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Badge className="bg-blue-500 text-white">Agendado</Badge>
                  </TableCell>
                  <TableCell>Pedido com entrega confirmada, ainda não separado</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 border" />
                    </div>
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge className="bg-amber-500 text-white">Separado</Badge>
                  </TableCell>
                  <TableCell>Pedido separado e pronto para despacho</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 border" />
                    </div>
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge className="bg-purple-500 text-white">Despachado</Badge>
                  </TableCell>
                  <TableCell>Pedido enviado para o PDV</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500 border" />
                    </div>
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge className="bg-green-500 text-white">Entregue</Badge>
                  </TableCell>
                  <TableCell>Pedido entregue com sucesso</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 border" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Status principal muda para "Reagendar"</li>
                      <li>Ativa lógica de reagendamento padrão</li>
                    </ul>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge className="bg-red-500 text-white">Retorno</Badge>
                  </TableCell>
                  <TableCell>Entrega falhou e pedido retornou à fábrica</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-500 border" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Status principal muda para "Reagendar"</li>
                      <li>Data sugerida será o próximo dia útil</li>
                    </ul>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
