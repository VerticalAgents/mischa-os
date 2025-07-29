import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Phone, Mail, Calendar, User, Building, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";

interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  origem: string;
  status: 'Novos' | 'Contatados' | 'Em Proposta' | 'Fechados' | 'Perdidos';
  observacoes?: string;
  dataContato?: Date;
  proximaAcao?: string;
  nomeResponsavel?: string;
  contatoResponsavel?: string;
  representanteId?: string;
}

interface Objecao {
  id: string;
  nome: string;
  descricao?: string;
}

export default function FunilLeads() {
  const { representantes, carregarRepresentantes } = useSupabaseRepresentantes();
  
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      nome: 'João Silva',
      empresa: 'Padaria do João',
      email: 'joao@padaria.com',
      telefone: '(11) 99999-9999',
      origem: 'Indicação',
      status: 'Em Proposta',
      observacoes: 'Interessado em produtos premium',
      dataContato: new Date('2024-01-15'),
      proximaAcao: 'Enviar proposta detalhada',
      nomeResponsavel: 'Maria Santos',
      contatoResponsavel: '(11) 98888-8888',
      representanteId: '1'
    },
    {
      id: '2',
      nome: 'Maria Santos',
      empresa: 'Café Central',
      email: 'maria@cafecentral.com',
      telefone: '(11) 98888-8888',
      origem: 'Website',
      status: 'Contatados',
      observacoes: 'Quer conhecer a linha de brownies',
      dataContato: new Date('2024-01-20'),
      proximaAcao: 'Agendar degustação',
      nomeResponsavel: 'Carlos Lima',
      contatoResponsavel: '(11) 97777-7777'
    }
  ]);

  const [objecoes, setObjecoes] = useState<Objecao[]>([
    {
      id: '1',
      nome: 'Preço alto',
      descricao: 'Cliente considera o preço muito alto em relação à concorrência'
    },
    {
      id: '2',
      nome: 'Prazo de entrega',
      descricao: 'Necessita de prazo de entrega menor que o oferecido'
    }
  ]);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isObjecaoModalOpen, setIsObjecaoModalOpen] = useState(false);
  const [novoLead, setNovoLead] = useState<Partial<Lead>>({
    status: 'Novos',
    origem: 'Website'
  });
  const [novaObjecao, setNovaObjecao] = useState<Partial<Objecao>>({});

  useEffect(() => {
    carregarRepresentantes();
  }, [carregarRepresentantes]);

  const adicionarLead = () => {
    if (!novoLead.nome) return;
    
    const lead: Lead = {
      id: Date.now().toString(),
      nome: novoLead.nome,
      empresa: novoLead.empresa,
      email: novoLead.email,
      telefone: novoLead.telefone,
      origem: novoLead.origem || 'Website',
      status: novoLead.status as Lead['status'] || 'Novos',
      observacoes: novoLead.observacoes,
      dataContato: new Date(),
      proximaAcao: novoLead.proximaAcao,
      nomeResponsavel: novoLead.nomeResponsavel,
      contatoResponsavel: novoLead.contatoResponsavel,
      representanteId: novoLead.representanteId
    };

    setLeads([...leads, lead]);
    setNovoLead({ status: 'Novos', origem: 'Website' });
    setIsLeadModalOpen(false);
  };

  const adicionarObjecao = () => {
    if (!novaObjecao.nome) return;
    
    const objecao: Objecao = {
      id: Date.now().toString(),
      nome: novaObjecao.nome,
      descricao: novaObjecao.descricao
    };

    setObjecoes([...objecoes, objecao]);
    setNovaObjecao({});
    setIsObjecaoModalOpen(false);
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'Novos': return 'bg-blue-100 text-blue-800';
      case 'Contatados': return 'bg-yellow-100 text-yellow-800';
      case 'Em Proposta': return 'bg-orange-100 text-orange-800';
      case 'Fechados': return 'bg-green-100 text-green-800';
      case 'Perdidos': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const contadorStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<Lead['status'], number>);

  const getRepresentanteNome = (representanteId?: string) => {
    if (!representanteId) return '-';
    const rep = representantes.find(r => r.id.toString() === representanteId);
    return rep?.nome || '-';
  };

  return (
    <Tabs defaultValue="leads" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="leads">Funil de Leads</TabsTrigger>
        <TabsTrigger value="objecoes">Objeções</TabsTrigger>
      </TabsList>

      <TabsContent value="leads" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Novos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadorStatus['Novos'] || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Contatados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadorStatus['Contatados'] || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">Em Proposta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadorStatus['Em Proposta'] || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Fechados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadorStatus['Fechados'] || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Perdidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadorStatus['Perdidos'] || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Funil de Leads</CardTitle>
                <CardDescription>Gerencie seus leads e oportunidades comerciais</CardDescription>
              </div>
              <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Lead</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome do Lead *</Label>
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
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                    
                    <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="Visita Presencial">Visita Presencial</SelectItem>
                            <SelectItem value="Parceiro">Parceiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Status no Funil</Label>
                        <Select value={novoLead.status} onValueChange={(value) => setNovoLead({ ...novoLead, status: value as Lead['status'] })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Novos">Novos</SelectItem>
                            <SelectItem value="Contatados">Contatados</SelectItem>
                            <SelectItem value="Em Proposta">Em Proposta</SelectItem>
                            <SelectItem value="Fechados">Fechados</SelectItem>
                            <SelectItem value="Perdidos">Perdidos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
                        <Input
                          id="nomeResponsavel"
                          value={novoLead.nomeResponsavel || ''}
                          onChange={(e) => setNovoLead({ ...novoLead, nomeResponsavel: e.target.value })}
                          placeholder="Nome do responsável"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contatoResponsavel">Contato do Responsável</Label>
                        <Input
                          id="contatoResponsavel"
                          value={novoLead.contatoResponsavel || ''}
                          onChange={(e) => setNovoLead({ ...novoLead, contatoResponsavel: e.target.value })}
                          placeholder="Telefone/Email do responsável"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="representante">Representante</Label>
                      <Select value={novoLead.representanteId} onValueChange={(value) => setNovoLead({ ...novoLead, representanteId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um representante" />
                        </SelectTrigger>
                        <SelectContent>
                          {representantes.map((rep) => (
                            <SelectItem key={rep.id} value={rep.id.toString()}>
                              {rep.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Button variant="outline" onClick={() => setIsLeadModalOpen(false)}>
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
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Representante</TableHead>
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
                        {lead.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                        {lead.telefone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{lead.origem}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.nomeResponsavel && (
                          <div className="text-sm font-medium">{lead.nomeResponsavel}</div>
                        )}
                        {lead.contatoResponsavel && (
                          <div className="text-xs text-muted-foreground">{lead.contatoResponsavel}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRepresentanteNome(lead.representanteId)}
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
      </TabsContent>

      <TabsContent value="objecoes" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Objeções Cadastradas
                </CardTitle>
                <CardDescription>Gerencie as possíveis objeções dos leads</CardDescription>
              </div>
              <Dialog open={isObjecaoModalOpen} onOpenChange={setIsObjecaoModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Objeção
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Objeção</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nomeObjecao">Nome da Objeção *</Label>
                      <Input
                        id="nomeObjecao"
                        value={novaObjecao.nome || ''}
                        onChange={(e) => setNovaObjecao({ ...novaObjecao, nome: e.target.value })}
                        placeholder="Ex: Preço alto"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="descricaoObjecao">Descrição</Label>
                      <Textarea
                        id="descricaoObjecao"
                        value={novaObjecao.descricao || ''}
                        onChange={(e) => setNovaObjecao({ ...novaObjecao, descricao: e.target.value })}
                        placeholder="Descreva a objeção em detalhes..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsObjecaoModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={adicionarObjecao}>
                        Cadastrar Objeção
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {objecoes.map((objecao) => (
                  <TableRow key={objecao.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        {objecao.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      {objecao.descricao || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {objecoes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma objeção cadastrada ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
