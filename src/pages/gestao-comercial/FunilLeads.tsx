import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Phone, Mail, Building, Users, TrendingUp, Target, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useClienteStore } from '@/hooks/useClienteStore';
import { createClienteData } from '@/utils/clienteUtils';
import { StatusCliente, TipoLogisticaNome, TipoCobranca, FormaPagamentoNome } from '@/types';

interface Lead {
  id: string;
  nome: string;
  empresa: string;
  telefone: string;
  email: string;
  origem: string;
  status: 'Novo' | 'Qualificado' | 'Proposta' | 'Negociação' | 'Convertido' | 'Perdido';
  observacoes: string;
  dataContato: Date;
  proximoContato?: Date;
  valorEstimado: number;
  probabilidade: number;
  endereco: string;
  cnpj: string;
  responsavel: string;
  categoriaInteresse: string;
  tipoLogistica: TipoLogisticaNome;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;
  quantidadeEstimada: number;
  periodicidadeEstimada: number;
}

const mockLeads: Lead[] = [
  {
    id: '1',
    nome: 'João Silva',
    empresa: 'Restaurante do João',
    telefone: '1199999999',
    email: 'joao@restaurantedojoao.com',
    origem: 'Indicação',
    status: 'Novo',
    observacoes: 'Entrar em contato na próxima semana',
    dataContato: new Date(),
    proximoContato: new Date(new Date().setDate(new Date().getDate() + 7)),
    valorEstimado: 5000,
    probabilidade: 20,
    endereco: 'Rua das Flores, 123',
    cnpj: '12345678901234',
    responsavel: 'Maria',
    categoriaInteresse: 'Alimentos',
    tipoLogistica: 'Própria',
    tipoCobranca: 'À vista',
    formaPagamento: 'Boleto',
    quantidadeEstimada: 100,
    periodicidadeEstimada: 7,
  },
  {
    id: '2',
    nome: 'Maria Souza',
    empresa: 'Mercado da Maria',
    telefone: '2199999999',
    email: 'maria@mercadodamaria.com',
    origem: 'Facebook',
    status: 'Qualificado',
    observacoes: 'Enviar proposta detalhada',
    dataContato: new Date(),
    proximoContato: new Date(new Date().setDate(new Date().getDate() + 3)),
    valorEstimado: 10000,
    probabilidade: 50,
    endereco: 'Avenida Central, 456',
    cnpj: '43210987654321',
    responsavel: 'Pedro',
    categoriaInteresse: 'Bebidas',
    tipoLogistica: 'Distribuição',
    tipoCobranca: 'Consignado',
    formaPagamento: 'PIX',
    quantidadeEstimada: 200,
    periodicidadeEstimada: 14,
  },
  {
    id: '3',
    nome: 'Carlos Ferreira',
    empresa: 'Bar do Carlão',
    telefone: '3199999999',
    email: 'carlos@bardocarlão.com',
    origem: 'Google Ads',
    status: 'Proposta',
    observacoes: 'Aguardando feedback do cliente',
    dataContato: new Date(),
    proximoContato: new Date(new Date().setDate(new Date().getDate() + 10)),
    valorEstimado: 7500,
    probabilidade: 70,
    endereco: 'Travessa da Esquina, 789',
    cnpj: '98765432109876',
    responsavel: 'Ana',
    categoriaInteresse: 'Limpeza',
    tipoLogistica: 'Própria',
    tipoCobranca: 'À vista',
    formaPagamento: 'Dinheiro',
    quantidadeEstimada: 150,
    periodicidadeEstimada: 21,
  },
  {
    id: '4',
    nome: 'Ana Paula',
    empresa: 'Loja da Ana',
    telefone: '4199999999',
    email: 'ana@lojadana.com',
    origem: 'LinkedIn',
    status: 'Negociação',
    observacoes: 'Negociando condições de pagamento',
    dataContato: new Date(),
    proximoContato: new Date(new Date().setDate(new Date().getDate() + 5)),
    valorEstimado: 12000,
    probabilidade: 90,
    endereco: 'Rua Principal, 1011',
    cnpj: '54321678905432',
    responsavel: 'Carlos',
    categoriaInteresse: 'Higiene',
    tipoLogistica: 'Distribuição',
    tipoCobranca: 'Consignado',
    formaPagamento: 'Boleto',
    quantidadeEstimada: 250,
    periodicidadeEstimada: 28,
  },
  {
    id: '5',
    nome: 'Pedro Henrique',
    empresa: 'Supermercado do Pedro',
    telefone: '5199999999',
    email: 'pedro@supermercadodopedro.com',
    origem: 'E-mail Marketing',
    status: 'Convertido',
    observacoes: 'Cliente fidelizado',
    dataContato: new Date(),
    valorEstimado: 15000,
    probabilidade: 100,
    endereco: 'Avenida Secundária, 1213',
    cnpj: '65432187906543',
    responsavel: 'Maria',
    categoriaInteresse: 'Outros',
    tipoLogistica: 'Própria',
    tipoCobranca: 'À vista',
    formaPagamento: 'PIX',
    quantidadeEstimada: 300,
    periodicidadeEstimada: 30,
  },
  {
    id: '6',
    nome: 'Juliana Almeida',
    empresa: 'Empório da Ju',
    telefone: '6199999999',
    email: 'juliana@emporiodaju.com',
    origem: 'Instagram',
    status: 'Perdido',
    observacoes: 'Não mostrou interesse',
    dataContato: new Date(),
    valorEstimado: 2000,
    probabilidade: 0,
    endereco: 'Rua da Praia, 1415',
    cnpj: '76543219076543',
    responsavel: 'Pedro',
    categoriaInteresse: 'Alimentos',
    tipoLogistica: 'Distribuição',
    tipoCobranca: 'Consignado',
    formaPagamento: 'Dinheiro',
    quantidadeEstimada: 50,
    periodicidadeEstimada: 7,
  },
];

const statusConfig = {
  Novo: { color: 'secondary', label: 'Novo' },
  Qualificado: { color: 'blue', label: 'Qualificado' },
  Proposta: { color: 'yellow', label: 'Proposta' },
  Negociação: { color: 'purple', label: 'Negociação' },
  Convertido: { color: 'green', label: 'Convertido' },
  Perdido: { color: 'destructive', label: 'Perdido' },
};

export default function FunilLeads() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [newLead, setNewLead] = useState<Omit<Lead, 'id' | 'dataContato'>>({
    nome: '',
    empresa: '',
    telefone: '',
    email: '',
    origem: '',
    status: 'Novo',
    observacoes: '',
    proximoContato: new Date(),
    valorEstimado: 0,
    probabilidade: 0,
    endereco: '',
    cnpj: '',
    responsavel: '',
    categoriaInteresse: '',
    tipoLogistica: 'Própria',
    tipoCobranca: 'À vista',
    formaPagamento: 'Boleto',
    quantidadeEstimada: 0,
    periodicidadeEstimada: 0,
  });
  
  const { adicionarCliente } = useClienteStore();
  
  const filteredLeads = leads.filter(lead => {
    const searchRegex = new RegExp(searchTerm, 'i');
    const matchesSearch = searchRegex.test(lead.nome) || searchRegex.test(lead.empresa);
    const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setIsFilterModalOpen(false);
  };

  const handleOpenDetailModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedLead(null);
    setIsDetailModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLead(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setNewLead(prev => ({ ...prev, proximoContato: date }));
  };

  const handleAddLead = () => {
    const newId = Math.random().toString(36).substring(7);
    const leadToAdd: Lead = {
      id: newId,
      nome: newLead.nome,
      empresa: newLead.empresa,
      telefone: newLead.telefone,
      email: newLead.email,
      origem: newLead.origem,
      status: newLead.status,
      observacoes: newLead.observacoes,
      dataContato: new Date(),
      proximoContato: newLead.proximoContato,
      valorEstimado: newLead.valorEstimado,
      probabilidade: newLead.probabilidade,
      endereco: newLead.endereco,
      cnpj: newLead.cnpj,
      responsavel: newLead.responsavel,
      categoriaInteresse: newLead.categoriaInteresse,
      tipoLogistica: newLead.tipoLogistica,
      tipoCobranca: newLead.tipoCobranca,
      formaPagamento: newLead.formaPagamento,
      quantidadeEstimada: newLead.quantidadeEstimada,
      periodicidadeEstimada: newLead.periodicidadeEstimada,
    };
    setLeads(prev => [...prev, leadToAdd]);
    setIsAddLeadModalOpen(false);
    setNewLead({
      nome: '',
      empresa: '',
      telefone: '',
      email: '',
      origem: '',
      status: 'Novo',
      observacoes: '',
      proximoContato: new Date(),
      valorEstimado: 0,
      probabilidade: 0,
      endereco: '',
      cnpj: '',
      responsavel: '',
      categoriaInteresse: '',
      tipoLogistica: 'Própria',
      tipoCobranca: 'À vista',
      formaPagamento: 'Boleto',
      quantidadeEstimada: 0,
      periodicidadeEstimada: 0,
    });
    toast.success('Lead adicionado com sucesso!');
  };

  const handleConvertToClient = async (lead: Lead) => {
    try {
      const clienteData = createClienteData({
        nome: lead.nome,
        cnpjCpf: lead.cnpj,
        enderecoEntrega: lead.endereco,
        contatoNome: lead.nome,
        contatoTelefone: lead.telefone,
        contatoEmail: lead.email,
        quantidadePadrao: lead.quantidadeEstimada,
        periodicidadePadrao: lead.periodicidadeEstimada,
        statusCliente: 'Ativo' as StatusCliente,
        tipoLogistica: lead.tipoLogistica,
        tipoCobranca: lead.tipoCobranca,
        formaPagamento: lead.formaPagamento,
        observacoes: lead.observacoes,
        metaGiroSemanal: Math.ceil(lead.quantidadeEstimada / 7),
        giroMedioSemanal: Math.ceil(lead.quantidadeEstimada / 7)
      });

      await adicionarCliente(clienteData);
      
      // Update lead status
      setLeads(prev => prev.map(l => 
        l.id === lead.id 
          ? { ...l, status: 'Convertido' as const }
          : l
      ));
      
      toast.success('Lead convertido para cliente com sucesso!');
      setSelectedLead(null);
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Erro ao converter lead:', error);
      toast.error('Erro ao converter lead para cliente');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Funil de Leads</h1>
        <div className="flex space-x-2">
          <Input
            type="search"
            placeholder="Buscar lead..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="md:w-64"
          />
          <Button variant="outline" onClick={() => setIsFilterModalOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button onClick={() => setIsAddLeadModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map(lead => (
          <Card key={lead.id} className="bg-white shadow-md rounded-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{lead.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                <Badge variant={statusConfig[lead.status].color}>{statusConfig[lead.status].label}</Badge>
                <p className="text-sm text-gray-500">{lead.empresa}</p>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${lead.telefone}`} className="text-blue-500 hover:underline">{lead.telefone}</a>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${lead.email}`} className="text-blue-500 hover:underline">{lead.email}</a>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={() => handleOpenDetailModal(lead)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lead Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="negocio">Negócio</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <p className="font-semibold">{selectedLead.nome}</p>
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <p className="font-semibold">{selectedLead.empresa}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={statusConfig[selectedLead.status].color}>{statusConfig[selectedLead.status].label}</Badge>
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <p className="font-semibold">{selectedLead.responsavel}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="contato" className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone</Label>
                    <p className="font-semibold">
                      <a href={`tel:${selectedLead.telefone}`} className="text-blue-500 hover:underline">
                        {selectedLead.telefone}
                      </a>
                    </p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-semibold">
                      <a href={`mailto:${selectedLead.email}`} className="text-blue-500 hover:underline">
                        {selectedLead.email}
                      </a>
                    </p>
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <p className="font-semibold">{selectedLead.endereco}</p>
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <p className="font-semibold">{selectedLead.cnpj}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="negocio" className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Estimado</Label>
                    <p className="font-semibold">R$ {selectedLead.valorEstimado.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Probabilidade</Label>
                    <p className="font-semibold">{selectedLead.probabilidade}%</p>
                  </div>
                  <div>
                    <Label>Origem</Label>
                    <p className="font-semibold">{selectedLead.origem}</p>
                  </div>
                  <div>
                    <Label>Categoria de Interesse</Label>
                    <p className="font-semibold">{selectedLead.categoriaInteresse}</p>
                  </div>
                  <div>
                    <Label>Próximo Contato</Label>
                    <p className="font-semibold">{selectedLead.proximoContato?.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <p className="font-semibold">{selectedLead.observacoes}</p>
                  </div>
                </div>
              </TabsContent>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseDetailModal}>Fechar</Button>
                {selectedLead.status !== 'Convertido' && (
                  <Button onClick={() => handleConvertToClient(selectedLead)}>Converter para Cliente</Button>
                )}
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrar Leads</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={handleStatusFilterChange} defaultValue={statusFilter}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Novo">Novo</SelectItem>
                <SelectItem value="Qualificado">Qualificado</SelectItem>
                <SelectItem value="Proposta">Proposta</SelectItem>
                <SelectItem value="Negociação">Negociação</SelectItem>
                <SelectItem value="Convertido">Convertido</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lead Modal */}
      <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Lead</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" value={newLead.nome} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Input id="empresa" name="empresa" value={newLead.empresa} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" value={newLead.telefone} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" value={newLead.email} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="origem">Origem</Label>
              <Input id="origem" name="origem" value={newLead.origem} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" value={newLead.status} onValueChange={(value) => setNewLead(prev => ({ ...prev, status: value as any }))}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novo">Novo</SelectItem>
                  <SelectItem value="Qualificado">Qualificado</SelectItem>
                  <SelectItem value="Proposta">Proposta</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                  <SelectItem value="Convertido">Convertido</SelectItem>
                  <SelectItem value="Perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="valorEstimado">Valor Estimado</Label>
              <Input
                type="number"
                id="valorEstimado"
                name="valorEstimado"
                value={String(newLead.valorEstimado)}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="probabilidade">Probabilidade (%)</Label>
              <Input
                type="number"
                id="probabilidade"
                name="probabilidade"
                value={String(newLead.probabilidade)}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" name="endereco" value={newLead.endereco} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" value={newLead.cnpj} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="responsavel">Responsável</Label>
              <Input id="responsavel" name="responsavel" value={newLead.responsavel} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="categoriaInteresse">Categoria de Interesse</Label>
              <Input
                id="categoriaInteresse"
                name="categoriaInteresse"
                value={newLead.categoriaInteresse}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="tipoLogistica">Tipo de Logística</Label>
              <Select name="tipoLogistica" value={newLead.tipoLogistica} onValueChange={(value) => setNewLead(prev => ({ ...prev, tipoLogistica: value as any }))}>
                <SelectTrigger id="tipoLogistica">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Própria">Própria</SelectItem>
                  <SelectItem value="Distribuição">Distribuição</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
              <Select name="tipoCobranca" value={newLead.tipoCobranca} onValueChange={(value) => setNewLead(prev => ({ ...prev, tipoCobranca: value as any }))}>
                <SelectTrigger id="tipoCobranca">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="À vista">À vista</SelectItem>
                  <SelectItem value="Consignado">Consignado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
              <Select name="formaPagamento" value={newLead.formaPagamento} onValueChange={(value) => setNewLead(prev => ({ ...prev, formaPagamento: value as any }))}>
                <SelectTrigger id="formaPagamento">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantidadeEstimada">Quantidade Estimada</Label>
              <Input
                type="number"
                id="quantidadeEstimada"
                name="quantidadeEstimada"
                value={String(newLead.quantidadeEstimada)}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="periodicidadeEstimada">Periodicidade Estimada</Label>
              <Input
                type="number"
                id="periodicidadeEstimada"
                name="periodicidadeEstimada"
                value={String(newLead.periodicidadeEstimada)}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" value={newLead.observacoes} onChange={handleInputChange} />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddLeadModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddLead}>Adicionar Lead</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
