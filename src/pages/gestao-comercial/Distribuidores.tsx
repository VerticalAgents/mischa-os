
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Building, Phone, Mail, MapPin, Truck, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Distribuidor {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  contatoPrincipal?: string;
  status: 'Ativo' | 'Inativo' | 'Em Negociação' | 'Suspenso';
  tipoDistribuicao: 'Regional' | 'Nacional' | 'Local';
  comissao?: number;
  volumeMinimo?: number;
  observacoes?: string;
  dataContrato?: Date;
}

export default function Distribuidores() {
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([
    {
      id: '1',
      nome: 'Distribuição Centro-Oeste',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua das Empresas, 123',
      cidade: 'Goiânia',
      estado: 'GO',
      telefone: '(62) 3333-4444',
      email: 'contato@distco.com',
      contatoPrincipal: 'Carlos Silva',
      status: 'Ativo',
      tipoDistribuicao: 'Regional',
      comissao: 15,
      volumeMinimo: 1000,
      observacoes: 'Principal distribuidor da região Centro-Oeste',
      dataContrato: new Date('2023-06-01')
    },
    {
      id: '2',
      nome: 'Alimentos do Norte Ltda',
      cnpj: '98.765.432/0001-10',
      endereco: 'Av. Principal, 456',
      cidade: 'Manaus',
      estado: 'AM',
      telefone: '(92) 2222-3333',
      email: 'vendas@alimentosnorte.com',
      contatoPrincipal: 'Ana Costa',
      status: 'Em Negociação',
      tipoDistribuicao: 'Regional',
      comissao: 12,
      volumeMinimo: 800,
      observacoes: 'Negociando expansão para toda a região Norte',
      dataContrato: undefined
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoDistribuidor, setNovoDistribuidor] = useState<Partial<Distribuidor>>({
    status: 'Em Negociação',
    tipoDistribuicao: 'Local'
  });

  const adicionarDistribuidor = () => {
    if (!novoDistribuidor.nome) return;
    
    const distribuidor: Distribuidor = {
      id: Date.now().toString(),
      nome: novoDistribuidor.nome,
      cnpj: novoDistribuidor.cnpj,
      endereco: novoDistribuidor.endereco,
      cidade: novoDistribuidor.cidade,
      estado: novoDistribuidor.estado,
      telefone: novoDistribuidor.telefone,
      email: novoDistribuidor.email,
      contatoPrincipal: novoDistribuidor.contatoPrincipal,
      status: novoDistribuidor.status as Distribuidor['status'] || 'Em Negociação',
      tipoDistribuicao: novoDistribuidor.tipoDistribuicao as Distribuidor['tipoDistribuicao'] || 'Local',
      comissao: novoDistribuidor.comissao,
      volumeMinimo: novoDistribuidor.volumeMinimo,
      observacoes: novoDistribuidor.observacoes,
      dataContrato: novoDistribuidor.status === 'Ativo' ? new Date() : undefined
    };

    setDistribuidores([...distribuidores, distribuidor]);
    setNovoDistribuidor({ status: 'Em Negociação', tipoDistribuicao: 'Local' });
    setIsModalOpen(false);
  };

  const getStatusColor = (status: Distribuidor['status']) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800';
      case 'Em Negociação': return 'bg-yellow-100 text-yellow-800';
      case 'Inativo': return 'bg-gray-100 text-gray-800';
      case 'Suspenso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: Distribuidor['tipoDistribuicao']) => {
    switch (tipo) {
      case 'Nacional': return 'bg-blue-100 text-blue-800';
      case 'Regional': return 'bg-purple-100 text-purple-800';
      case 'Local': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Distribuidores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distribuidores.filter(d => d.status === 'Ativo').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Em Negociação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distribuidores.filter(d => d.status === 'Em Negociação').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Regionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distribuidores.filter(d => d.tipoDistribuicao === 'Regional').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Volume Mensal (mil unidades)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distribuidores.filter(d => d.status === 'Ativo')
                .reduce((acc, d) => acc + (d.volumeMinimo || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Distribuidores */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rede de Distribuidores</CardTitle>
              <CardDescription>Gerencie sua rede de distribuição e parcerias comerciais</CardDescription>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Distribuidor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Distribuidor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="nome">Razão Social *</Label>
                      <Input
                        id="nome"
                        value={novoDistribuidor.nome || ''}
                        onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, nome: e.target.value })}
                        placeholder="Nome da empresa distribuidora"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={novoDistribuidor.cnpj || ''}
                        onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contatoPrincipal">Contato Principal</Label>
                      <Input
                        id="contatoPrincipal"
                        value={novoDistribuidor.contatoPrincipal || ''}
                        onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, contatoPrincipal: e.target.value })}
                        placeholder="Nome do contato"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={novoDistribuidor.endereco || ''}
                      onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, endereco: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={novoDistribuidor.cidade || ''}
                        onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, cidade: e.target.value })}
                        placeholder="Nome da cidade"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={novoDistribuidor.estado || ''}
                        onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, estado: e.target.value })}
                        placeholder="UF"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={novoDistribuidor.telefone || ''}
                        onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, telefone: e.target.value })}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={novoDistribuidor.email || ''}
                        onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, email: e.target.value })}
                        placeholder="contato@distribuidor.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={novoDistribuidor.status} onValueChange={(value) => setNovoDistribuidor({ ...novoDistribuidor, status: value as Distribuidor['status'] })}>
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
                      <Label htmlFor="tipoDistribuicao">Tipo de Distribuição</Label>
                      <Select value={novoDistribuidor.tipoDistribuicao} onValueChange={(value) => setNovoDistribuidor({ ...novoDistribuidor, tipoDistribuicao: value as Distribuidor['tipoDistribuicao'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Local">Local</SelectItem>
                          <SelectItem value="Regional">Regional</SelectItem>
                          <SelectItem value="Nacional">Nacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="comissao">Comissão (%)</Label>
                      <Input
                        id="comissao"
                        type="number"
                        value={novoDistribuidor.comissao || ''}
                        onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, comissao: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="volumeMinimo">Volume Mínimo (unidades/mês)</Label>
                    <Input
                      id="volumeMinimo"
                      type="number"
                      value={novoDistribuidor.volumeMinimo || ''}
                      onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, volumeMinimo: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={novoDistribuidor.observacoes || ''}
                      onChange={(e) => setNovoDistribuidor({ ...novoDistribuidor, observacoes: e.target.value })}
                      placeholder="Observações sobre o distribuidor..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={adicionarDistribuidor}>
                      Adicionar Distribuidor
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
                <TableHead>Distribuidor</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead className="text-right">Vol. Mínimo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribuidores.map((distribuidor) => (
                <TableRow key={distribuidor.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {distribuidor.nome}
                      </div>
                      {distribuidor.cnpj && (
                        <div className="text-sm text-muted-foreground">
                          CNPJ: {distribuidor.cnpj}
                        </div>
                      )}
                      {distribuidor.contatoPrincipal && (
                        <div className="text-sm text-muted-foreground">
                          Contato: {distribuidor.contatoPrincipal}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {distribuidor.endereco && (
                        <div className="text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {distribuidor.endereco}
                        </div>
                      )}
                      {(distribuidor.cidade || distribuidor.estado) && (
                        <div className="text-sm text-muted-foreground">
                          {distribuidor.cidade}{distribuidor.cidade && distribuidor.estado ? ', ' : ''}{distribuidor.estado}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {distribuidor.email && (
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {distribuidor.email}
                        </div>
                      )}
                      {distribuidor.telefone && (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {distribuidor.telefone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoColor(distribuidor.tipoDistribuicao)}>
                      {distribuidor.tipoDistribuicao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(distribuidor.status)}>
                      {distribuidor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {distribuidor.comissao && (
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-3 w-3" />
                        {distribuidor.comissao}%
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {distribuidor.volumeMinimo && (
                      <div className="flex items-center justify-end gap-1">
                        <Truck className="h-3 w-3" />
                        {distribuidor.volumeMinimo.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {distribuidores.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum distribuidor cadastrado ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
