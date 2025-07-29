
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, UserPlus, Target, TrendingUp, AlertCircle, Building, HelpingHand, UserCircle, Users } from "lucide-react";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useNavigate, useLocation } from "react-router-dom";

interface Lead {
  id: string;
  nome: string;
  origem: string;
  status: 'Novos' | 'Contatados' | 'Em Proposta' | 'Fechados' | 'Perdidos';
  nomeResponsavel: string;
  contatoResponsavel: string;
  representanteId?: number;
  observacoes?: string;
  dataContato?: Date;
  dataCriacao: Date;
}

interface Objecao {
  id: string;
  nome: string;
  descricao?: string;
  dataCriacao: Date;
}

const origens = [
  'Site',
  'Indicação',
  'Telefone',
  'Email',
  'Redes Sociais',
  'Eventos',
  'Prospecção Ativa',
  'Outros'
];

export default function FunilLeads() {
  const navigate = useNavigate();
  const location = useLocation();
  const { representantes, carregarRepresentantes } = useSupabaseRepresentantes();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [objecoes, setObjecoes] = useState<Objecao[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isObjecaoDialogOpen, setIsObjecaoDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingObjecao, setEditingObjecao] = useState<Objecao | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    origem: '',
    status: 'Novos' as Lead['status'],
    nomeResponsavel: '',
    contatoResponsavel: '',
    representanteId: '',
    observacoes: ''
  });

  const [objecaoFormData, setObjecaoFormData] = useState({
    nome: '',
    descricao: ''
  });

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('funil-leads')) return 'funil-leads';
    if (path.includes('distribuidores')) return 'distribuidores';
    if (path.includes('parceiros')) return 'parceiros';
    return 'representantes';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/gestao-comercial/${value}`);
  };

  useEffect(() => {
    carregarRepresentantes();
  }, [carregarRepresentantes]);

  const resetForm = () => {
    setFormData({
      nome: '',
      origem: '',
      status: 'Novos',
      nomeResponsavel: '',
      contatoResponsavel: '',
      representanteId: '',
      observacoes: ''
    });
    setEditingLead(null);
  };

  const resetObjecaoForm = () => {
    setObjecaoFormData({
      nome: '',
      descricao: ''
    });
    setEditingObjecao(null);
  };

  const handleSaveLead = () => {
    if (!formData.nome || !formData.origem || !formData.nomeResponsavel || !formData.contatoResponsavel) {
      return;
    }

    const leadData: Lead = {
      id: editingLead?.id || Date.now().toString(),
      nome: formData.nome,
      origem: formData.origem,
      status: formData.status,
      nomeResponsavel: formData.nomeResponsavel,
      contatoResponsavel: formData.contatoResponsavel,
      representanteId: formData.representanteId ? Number(formData.representanteId) : undefined,
      observacoes: formData.observacoes || undefined,
      dataContato: new Date(),
      dataCriacao: editingLead?.dataCriacao || new Date()
    };

    if (editingLead) {
      setLeads(leads.map(lead => lead.id === editingLead.id ? leadData : lead));
    } else {
      setLeads([...leads, leadData]);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleSaveObjecao = () => {
    if (!objecaoFormData.nome) {
      return;
    }

    const objecaoData: Objecao = {
      id: editingObjecao?.id || Date.now().toString(),
      nome: objecaoFormData.nome,
      descricao: objecaoFormData.descricao || undefined,
      dataCriacao: editingObjecao?.dataCriacao || new Date()
    };

    if (editingObjecao) {
      setObjecoes(objecoes.map(obj => obj.id === editingObjecao.id ? objecaoData : obj));
    } else {
      setObjecoes([...objecoes, objecaoData]);
    }

    setIsObjecaoDialogOpen(false);
    resetObjecaoForm();
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      nome: lead.nome,
      origem: lead.origem,
      status: lead.status,
      nomeResponsavel: lead.nomeResponsavel,
      contatoResponsavel: lead.contatoResponsavel,
      representanteId: lead.representanteId?.toString() || '',
      observacoes: lead.observacoes || ''
    });
    setIsDialogOpen(true);
  };

  const handleEditObjecao = (objecao: Objecao) => {
    setEditingObjecao(objecao);
    setObjecaoFormData({
      nome: objecao.nome,
      descricao: objecao.descricao || ''
    });
    setIsObjecaoDialogOpen(true);
  };

  const handleDeleteLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleDeleteObjecao = (id: string) => {
    setObjecoes(objecoes.filter(obj => obj.id !== id));
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'Novos': return 'bg-blue-100 text-blue-800';
      case 'Contatados': return 'bg-yellow-100 text-yellow-800';
      case 'Em Proposta': return 'bg-purple-100 text-purple-800';
      case 'Fechados': return 'bg-green-100 text-green-800';
      case 'Perdidos': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRepresentanteNome = (id?: number) => {
    if (!id) return '-';
    const rep = representantes.find(r => r.id === id);
    return rep ? rep.nome : 'Representante não encontrado';
  };

  // Calculate statistics
  const stats = {
    total: leads.length,
    novos: leads.filter(l => l.status === 'Novos').length,
    contatados: leads.filter(l => l.status === 'Contatados').length,
    emProposta: leads.filter(l => l.status === 'Em Proposta').length,
    fechados: leads.filter(l => l.status === 'Fechados').length,
    perdidos: leads.filter(l => l.status === 'Perdidos').length,
    taxaConversao: leads.length > 0 ? (leads.filter(l => l.status === 'Fechados').length / leads.length) * 100 : 0
  };

  return (
    <div className="space-y-6">
      {/* Commercial Management Tabs - Always visible at the top */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto py-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="representantes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Representantes</span>
              </TabsTrigger>
              <TabsTrigger value="funil-leads" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Funil de Leads</span>
              </TabsTrigger>
              <TabsTrigger value="distribuidores" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Distribuidores</span>
              </TabsTrigger>
              <TabsTrigger value="parceiros" className="flex items-center gap-2">
                <HelpingHand className="h-4 w-4" />
                <span className="hidden sm:inline">Parceiros</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Funil de Leads</h1>
        <p className="text-muted-foreground">Gerencie leads, objeções e acompanhe o funil de vendas</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.novos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatados</CardTitle>
            <Target className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.contatados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Proposta</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.emProposta}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fechados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.perdidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taxaConversao.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Gerenciar Leads</TabsTrigger>
          <TabsTrigger value="objecoes">Objeções</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Leads</CardTitle>
                  <CardDescription>Gerencie todos os leads do funil de vendas</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
                      <DialogDescription>
                        Preencha as informações do lead abaixo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nome" className="text-right">Nome</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                          className="col-span-3"
                          placeholder="Nome do lead"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="origem" className="text-right">Origem</Label>
                        <Select value={formData.origem} onValueChange={(value) => setFormData({...formData, origem: value})}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                          <SelectContent>
                            {origens.map((origem) => (
                              <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select value={formData.status} onValueChange={(value: Lead['status']) => setFormData({...formData, status: value})}>
                          <SelectTrigger className="col-span-3">
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
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="responsavel" className="text-right">Responsável</Label>
                        <Input
                          id="responsavel"
                          value={formData.nomeResponsavel}
                          onChange={(e) => setFormData({...formData, nomeResponsavel: e.target.value})}
                          className="col-span-3"
                          placeholder="Nome do responsável"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contato" className="text-right">Contato</Label>
                        <Input
                          id="contato"
                          value={formData.contatoResponsavel}
                          onChange={(e) => setFormData({...formData, contatoResponsavel: e.target.value})}
                          className="col-span-3"
                          placeholder="Email ou telefone"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="representante" className="text-right">Representante</Label>
                        <Select value={formData.representanteId} onValueChange={(value) => setFormData({...formData, representanteId: value})}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione um representante" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {representantes.map((rep) => (
                              <SelectItem key={rep.id} value={rep.id.toString()}>{rep.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="observacoes" className="text-right">Observações</Label>
                        <Textarea
                          id="observacoes"
                          value={formData.observacoes}
                          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                          className="col-span-3"
                          placeholder="Observações adicionais"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleSaveLead}>
                        {editingLead ? 'Atualizar' : 'Criar'} Lead
                      </Button>
                    </DialogFooter>
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{lead.nome}</div>
                          <div className="text-sm text-muted-foreground">{lead.contatoResponsavel}</div>
                        </div>
                      </TableCell>
                      <TableCell>{lead.origem}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.nomeResponsavel}</TableCell>
                      <TableCell>{getRepresentanteNome(lead.representanteId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEditLead(lead)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {leads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhum lead cadastrado ainda</p>
                  <p className="text-sm">Clique em "Novo Lead" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objecoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Objeções</CardTitle>
                  <CardDescription>Cadastre e gerencie possíveis objeções de vendas</CardDescription>
                </div>
                <Dialog open={isObjecaoDialogOpen} onOpenChange={setIsObjecaoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetObjecaoForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Objeção
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{editingObjecao ? 'Editar Objeção' : 'Nova Objeção'}</DialogTitle>
                      <DialogDescription>
                        Cadastre uma nova objeção que pode surgir durante o processo de vendas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nomeObjecao" className="text-right">Nome</Label>
                        <Input
                          id="nomeObjecao"
                          value={objecaoFormData.nome}
                          onChange={(e) => setObjecaoFormData({...objecaoFormData, nome: e.target.value})}
                          className="col-span-3"
                          placeholder="Nome da objeção"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="descricaoObjecao" className="text-right">Descrição</Label>
                        <Textarea
                          id="descricaoObjecao"
                          value={objecaoFormData.descricao}
                          onChange={(e) => setObjecaoFormData({...objecaoFormData, descricao: e.target.value})}
                          className="col-span-3"
                          placeholder="Descrição detalhada da objeção"
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleSaveObjecao}>
                        {editingObjecao ? 'Atualizar' : 'Criar'} Objeção
                      </Button>
                    </DialogFooter>
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
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {objecoes.map((objecao) => (
                    <TableRow key={objecao.id}>
                      <TableCell className="font-medium">{objecao.nome}</TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">
                          {objecao.descricao || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{objecao.dataCriacao.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEditObjecao(objecao)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteObjecao(objecao.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {objecoes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhuma objeção cadastrada ainda</p>
                  <p className="text-sm">Clique em "Nova Objeção" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
