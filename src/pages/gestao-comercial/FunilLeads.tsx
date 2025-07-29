
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, Calendar, User, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  origem: string;
  status: 'Novo' | 'Contatado' | 'Qualificado' | 'Proposta' | 'Fechado' | 'Perdido';
  observacoes?: string;
  dataContato?: Date;
  proximaAcao?: string;
}

export default function FunilLeads() {
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      nome: 'João Silva',
      empresa: 'Padaria do João',
      email: 'joao@padaria.com',
      telefone: '(11) 99999-9999',
      origem: 'Indicação',
      status: 'Qualificado',
      observacoes: 'Interessado em produtos premium',
      dataContato: new Date('2024-01-15'),
      proximaAcao: 'Enviar proposta detalhada'
    },
    {
      id: '2',
      nome: 'Maria Santos',
      empresa: 'Café Central',
      email: 'maria@cafecentral.com',
      telefone: '(11) 98888-8888',
      origem: 'Website',
      status: 'Contatado',
      observacoes: 'Quer conhecer a linha de brownies',
      dataContato: new Date('2024-01-20'),
      proximaAcao: 'Agendar degustação'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoLead, setNovoLead] = useState<Partial<Lead>>({
    status: 'Novo',
    origem: 'Website'
  });

  const adicionarLead = () => {
    if (!novoLead.nome) return;
    
    const lead: Lead = {
      id: Date.now().toString(),
      nome: novoLead.nome,
      empresa: novoLead.empresa,
      email: novoLead.email,
      telefone: novoLead.telefone,
      origem: novoLead.origem || 'Website',
      status: novoLead.status as Lead['status'] || 'Novo',
      observacoes: novoLead.observacoes,
      dataContato: new Date(),
      proximaAcao: novoLead.proximaAcao
    };

    setLeads([...leads, lead]);
    setNovoLead({ status: 'Novo', origem: 'Website' });
    setIsModalOpen(false);
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'Novo': return 'bg-blue-100 text-blue-800';
      case 'Contatado': return 'bg-yellow-100 text-yellow-800';
      case 'Qualificado': return 'bg-purple-100 text-purple-800';
      case 'Proposta': return 'bg-orange-100 text-orange-800';
      case 'Fechado': return 'bg-green-100 text-green-800';
      case 'Perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const contadorStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<Lead['status'], number>);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Novos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contadorStatus['Novo'] || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Contatados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contadorStatus['Contatado'] || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Qualificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contadorStatus['Qualificado'] || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Em Proposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contadorStatus['Proposta'] || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contadorStatus['Fechado'] || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Perdidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contadorStatus['Perdido'] || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Funil de Leads</CardTitle>
              <CardDescription>Gerencie seus leads e oportunidades comerciais</CardDescription>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={novoLead.nome || ''}
                      onChange={(e) => setNovoLead({ ...novoLead, nome: e.target.value })}
                      placeholder="Nome do lead"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      value={novoLead.empresa || ''}
                      onChange={(e) => setNovoLead({ ...novoLead, empresa: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={novoLead.email || ''}
                        onChange={(e) => setNovoLead({ ...novoLead, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={novoLead.telefone || ''}
                        onChange={(e) => setNovoLead({ ...novoLead, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="origem">Origem</Label>
                      <Select value={novoLead.origem} onValueChange={(value) => setNovoLead({ ...novoLead, origem: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Indicação">Indicação</SelectItem>
                          <SelectItem value="Telefone">Telefone</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Evento">Evento</SelectItem>
                          <SelectItem value="Redes Sociais">Redes Sociais</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={novoLead.status} onValueChange={(value) => setNovoLead({ ...novoLead, status: value as Lead['status'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Novo">Novo</SelectItem>
                          <SelectItem value="Contatado">Contatado</SelectItem>
                          <SelectItem value="Qualificado">Qualificado</SelectItem>
                          <SelectItem value="Proposta">Proposta</SelectItem>
                          <SelectItem value="Fechado">Fechado</SelectItem>
                          <SelectItem value="Perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={novoLead.observacoes || ''}
                      onChange={(e) => setNovoLead({ ...novoLead, observacoes: e.target.value })}
                      placeholder="Observações sobre o lead..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="proximaAcao">Próxima Ação</Label>
                    <Input
                      id="proximaAcao"
                      value={novoLead.proximaAcao || ''}
                      onChange={(e) => setNovoLead({ ...novoLead, proximaAcao: e.target.value })}
                      placeholder="Próxima ação a ser tomada"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={adicionarLead}>
                      Adicionar Lead
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
                <TableHead>Lead</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead>Próxima Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {lead.nome}
                      </div>
                      {lead.empresa && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {lead.empresa}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.telefone && (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.telefone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{lead.origem}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.dataContato && (
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {lead.dataContato.toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.proximaAcao && (
                      <div className="text-sm text-muted-foreground">
                        {lead.proximaAcao}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {leads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead cadastrado ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
