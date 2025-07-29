
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Handshake, Phone, Mail, MapPin, Calendar, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Parceiro {
  id: string;
  nome: string;
  tipo: 'Fornecedor' | 'Prestador de Serviço' | 'Parceiro Estratégico' | 'Consultor';
  categoria?: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  contatoPrincipal?: string;
  status: 'Ativo' | 'Inativo' | 'Em Negociação' | 'Suspenso';
  avaliacao?: number;
  observacoes?: string;
  dataInicio?: Date;
  valorContrato?: number;
}

export default function Parceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([
    {
      id: '1',
      nome: 'Logística Express',
      tipo: 'Prestador de Serviço',
      categoria: 'Transporte',
      cnpj: '11.222.333/0001-44',
      endereco: 'Av. Logística, 789',
      telefone: '(11) 4444-5555',
      email: 'contato@logisticaexpress.com',
      contatoPrincipal: 'Roberto Santos',
      status: 'Ativo',
      avaliacao: 4.5,
      observacoes: 'Parceiro principal para entregas na Grande São Paulo',
      dataInicio: new Date('2023-01-15'),
      valorContrato: 25000
    },
    {
      id: '2',
      nome: 'Ingredientes Premium',
      tipo: 'Fornecedor',
      categoria: 'Matéria-prima',
      cnpj: '55.666.777/0001-88',
      endereco: 'Rua dos Ingredientes, 456',
      telefone: '(11) 6666-7777',
      email: 'vendas@ingredientespremium.com',
      contatoPrincipal: 'Marisa Costa',
      status: 'Ativo',
      avaliacao: 5,
      observacoes: 'Fornecedor de chocolate belga e ingredientes especiais',
      dataInicio: new Date('2022-08-10'),
      valorContrato: 50000
    },
    {
      id: '3',
      nome: 'Consultoria Digital',
      tipo: 'Consultor',
      categoria: 'Marketing',
      telefone: '(11) 8888-9999',
      email: 'contato@consultoriadigital.com',
      contatoPrincipal: 'Pedro Oliveira',
      status: 'Em Negociação',
      avaliacao: 4,
      observacoes: 'Negociando projeto de marketing digital e e-commerce',
      valorContrato: 15000
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoParceiro, setNovoParceiro] = useState<Partial<Parceiro>>({
    status: 'Em Negociação',
    tipo: 'Fornecedor'
  });

  const adicionarParceiro = () => {
    if (!novoParceiro.nome) return;
    
    const parceiro: Parceiro = {
      id: Date.now().toString(),
      nome: novoParceiro.nome,
      tipo: novoParceiro.tipo as Parceiro['tipo'] || 'Fornecedor',
      categoria: novoParceiro.categoria,
      cnpj: novoParceiro.cnpj,
      endereco: novoParceiro.endereco,
      telefone: novoParceiro.telefone,
      email: novoParceiro.email,
      contatoPrincipal: novoParceiro.contatoPrincipal,
      status: novoParceiro.status as Parceiro['status'] || 'Em Negociação',
      avaliacao: novoParceiro.avaliacao,
      observacoes: novoParceiro.observacoes,
      dataInicio: novoParceiro.status === 'Ativo' ? new Date() : undefined,
      valorContrato: novoParceiro.valorContrato
    };

    setParceiros([...parceiros, parceiro]);
    setNovoParceiro({ status: 'Em Negociação', tipo: 'Fornecedor' });
    setIsModalOpen(false);
  };

  const getStatusColor = (status: Parceiro['status']) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800';
      case 'Em Negociação': return 'bg-yellow-100 text-yellow-800';
      case 'Inativo': return 'bg-gray-100 text-gray-800';
      case 'Suspenso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: Parceiro['tipo']) => {
    switch (tipo) {
      case 'Fornecedor': return 'bg-blue-100 text-blue-800';
      case 'Prestador de Serviço': return 'bg-purple-100 text-purple-800';
      case 'Parceiro Estratégico': return 'bg-orange-100 text-orange-800';
      case 'Consultor': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (avaliacao?: number) => {
    if (!avaliacao) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-3 w-3 ${i <= avaliacao ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Parceiros Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parceiros.filter(p => p.status === 'Ativo').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parceiros.filter(p => p.tipo === 'Fornecedor').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Prestadores de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parceiros.filter(p => p.tipo === 'Prestador de Serviço').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Valor Total Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {parceiros.filter(p => p.status === 'Ativo')
                .reduce((acc, p) => acc + (p.valorContrato || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Parceiros */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rede de Parceiros</CardTitle>
              <CardDescription>Gerencie fornecedores, prestadores de serviço e parceiros estratégicos</CardDescription>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Parceiro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Parceiro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="nome">Nome/Razão Social *</Label>
                      <Input
                        id="nome"
                        value={novoParceiro.nome || ''}
                        onChange={(e) => setNovoParceiro({ ...novoParceiro, nome: e.target.value })}
                        placeholder="Nome do parceiro"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tipo">Tipo de Parceiro</Label>
                      <Select value={novoParceiro.tipo} onValueChange={(value) => setNovoParceiro({ ...novoParceiro, tipo: value as Parceiro['tipo'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                          <SelectItem value="Prestador de Serviço">Prestador de Serviço</SelectItem>
                          <SelectItem value="Parceiro Estratégico">Parceiro Estratégico</SelectItem>
                          <SelectItem value="Consultor">Consultor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="categoria">Categoria</Label>
                      <Input
                        id="categoria"
                        value={novoParceiro.categoria || ''}
                        onChange={(e) => setNovoParceiro({ ...novoParceiro, categoria: e.target.value })}
                        placeholder="Ex: Matéria-prima, Transporte, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={novoParceiro.cnpj || ''}
                        onChange={(e) => setNovoParceiro({ ...novoParceiro, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contatoPrincipal">Contato Principal</Label>
                      <Input
                        id="contatoPrincipal"
                        value={novoParceiro.contatoPrincipal || ''}
                        onChange={(e) => setNovoParceiro({ ...novoParceiro, contatoPrincipal: e.target.value })}
                        placeholder="Nome do contato"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={novoParceiro.endereco || ''}
                      onChange={(e) => setNovoParceiro({ ...novoParceiro, endereco: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={novoParceiro.telefone || ''}
                        onChange={(e) => setNovoParceiro({ ...novoParceiro, telefone: e.target.value })}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={novoParceiro.email || ''}
                        onChange={(e) => setNovoParceiro({ ...novoParceiro, email: e.target.value })}
                        placeholder="contato@parceiro.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={novoParceiro.status} onValueChange={(value) => setNovoParceiro({ ...novoParceiro, status: value as Parceiro['status'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="Suspenso">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="avaliacao">Avaliação (1-5)</Label>
                      <Select value={novoParceiro.avaliacao?.toString()} onValueChange={(value) => setNovoParceiro({ ...novoParceiro, avaliacao: Number(value) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 ⭐</SelectItem>
                          <SelectItem value="2">2 ⭐</SelectItem>
                          <SelectItem value="3">3 ⭐</SelectItem>
                          <SelectItem value="4">4 ⭐</SelectItem>
                          <SelectItem value="5">5 ⭐</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="valorContrato">Valor Contrato (R$)</Label>
                      <Input
                        id="valorContrato"
                        type="number"
                        value={novoParceiro.valorContrato || ''}
                        onChange={(e) => setNovoParceiro({ ...novoParceiro, valorContrato: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={novoParceiro.observacoes || ''}
                      onChange={(e) => setNovoParceiro({ ...novoParceiro, observacoes: e.target.value })}
                      placeholder="Observações sobre o parceiro..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={adicionarParceiro}>
                      Adicionar Parceiro
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parceiro</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead className="text-right">Valor Contrato</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parceiros.map((parceiro) => (
                <TableRow key={parceiro.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <Handshake className="h-4 w-4" />
                        {parceiro.nome}
                      </div>
                      {parceiro.categoria && (
                        <div className="text-sm text-muted-foreground">
                          {parceiro.categoria}
                        </div>
                      )}
                      {parceiro.contatoPrincipal && (
                        <div className="text-sm text-muted-foreground">
                          Contato: {parceiro.contatoPrincipal}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {parceiro.email && (
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {parceiro.email}
                        </div>
                      )}
                      {parceiro.telefone && (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {parceiro.telefone}
                        </div>
                      )}
                      {parceiro.endereco && (
                        <div className="text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {parceiro.endereco}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoColor(parceiro.tipo)}>
                      {parceiro.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(parceiro.status)}>
                      {parceiro.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {renderStars(parceiro.avaliacao)}
                  </TableCell>
                  <TableCell className="text-right">
                    {parceiro.valorContrato && (
                      <div className="font-mono">
                        R$ {parceiro.valorContrato.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {parceiro.dataInicio && (
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {parceiro.dataInicio.toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {parceiros.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum parceiro cadastrado ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
