import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, UserPlus, Target, TrendingUp, AlertCircle, MessageCircle } from "lucide-react";
import { Lead, LeadStatus, STATUS_LABELS, STATUS_COLORS } from "@/types/lead";
import { useSupabaseLeads } from "@/hooks/useSupabaseLeads";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import LeadFormDialog from "@/components/leads/LeadFormDialog";
import LeadStatusChanger from "@/components/leads/LeadStatusChanger";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import { convertLeadToCliente } from "@/utils/leadToClienteConverter";
import { Cliente } from "@/types";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
export default function FunilLeads() {
  const {
    leads,
    loading,
    carregarLeads,
    adicionarLead,
    atualizarLead,
    deletarLead,
    converterLeadEmCliente
  } = useSupabaseLeads();
  const {
    representantes,
    carregarRepresentantes
  } = useSupabaseRepresentantes();
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isClienteDialogOpen, setIsClienteDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [clientePreenchido, setClientePreenchido] = useState<Partial<Cliente> | null>(null);
  const [leadEmConversao, setLeadEmConversao] = useState<Lead | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<LeadStatus | 'todos'>('todos');
  useEffect(() => {
    carregarLeads();
    carregarRepresentantes();
  }, []); // Empty dependency array to run only once on mount
  const getRepresentanteNome = (id?: number) => {
    if (!id) return '-';
    const rep = representantes.find(r => r.id === id);
    return rep ? rep.nome : 'Representante não encontrado';
  };
  const handleSaveLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingLead) {
      await atualizarLead(editingLead.id, leadData);
    } else {
      await adicionarLead(leadData);
    }
    setEditingLead(null);
  };
  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsLeadDialogOpen(true);
  };
  const handleDeleteLead = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      await deletarLead(id);
    }
  };
  const handleMudarStatus = async (lead: Lead, novoStatus: LeadStatus) => {
    await atualizarLead(lead.id, {
      status: novoStatus
    });

    // Se movido para estágios de efetivação, abrir modal de cliente
    if (novoStatus === 'EfetivadosImediato' || novoStatus === 'EfetivadosWhatsApp') {
      const dadosCliente = convertLeadToCliente(lead);
      setClientePreenchido(dadosCliente);
      setLeadEmConversao(lead);
      setIsClienteDialogOpen(true);
    }
  };
  const handleClienteConvertidoSucesso = async () => {
    if (leadEmConversao) {
      toast({
        title: "Lead convertido em cliente!",
        description: `${leadEmConversao.nome} foi cadastrado como cliente com sucesso.`
      });
      setLeadEmConversao(null);
      setClientePreenchido(null);
      setIsClienteDialogOpen(false);
      await carregarLeads();
    }
  };
  const handleWhatsApp = (lead: Lead) => {
    const telefone = lead.contatoTelefone?.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá ${lead.contatoNome || lead.nome}, tudo bem? Gostaria de conversar sobre nossa parceria!`);
    window.open(`https://wa.me/55${telefone}?text=${mensagem}`, '_blank');
  };

  // Filtrar leads
  const leadsFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return leads;
    return leads.filter(lead => lead.status === filtroStatus);
  }, [leads, filtroStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const cadastrados = leads.filter(l => l.status === 'Cadastrado').length;
    const visitados = leads.filter(l => l.status !== 'Cadastrado').length;
    const efetivadosImediato = leads.filter(l => l.status === 'EfetivadosImediato').length;
    const contatosCapturados = leads.filter(l => l.status === 'ContatosCapturados').length;
    const chamadosWhatsApp = leads.filter(l => l.status === 'ChamadosWhatsApp').length;
    const respostaWhatsApp = leads.filter(l => l.status === 'RespostaWhatsApp').length;
    const efetivadosWhatsApp = leads.filter(l => l.status === 'EfetivadosWhatsApp').length;
    const perdidos = leads.filter(l => l.status === 'Perdidos').length;
    
    // Total leads = todos menos os fechados
    const total = leads.length - efetivadosImediato - efetivadosWhatsApp;
    
    const totalEfetivados = efetivadosImediato + efetivadosWhatsApp;
    
    // Taxa de conversão geral: (Efetivados Imediato + Efetivados WhatsApp) / Visitados
    const taxaConversaoGeral = visitados > 0 ? (totalEfetivados / visitados) * 100 : 0;
    
    // Taxa de conversão imediata: Efetivados Imediato / Visitados
    const taxaConversaoImediata = visitados > 0 ? (efetivadosImediato / visitados) * 100 : 0;
    
    // Taxa de conversão WhatsApp: Efetivados WhatsApp / Leads contactados por WhatsApp
    const leadsContactadosWhatsApp = chamadosWhatsApp + respostaWhatsApp + efetivadosWhatsApp;
    const taxaConversaoWhatsApp = leadsContactadosWhatsApp > 0 ? (efetivadosWhatsApp / leadsContactadosWhatsApp) * 100 : 0;
    
    return {
      total,
      cadastrados,
      visitados,
      efetivadosImediato,
      contatosCapturados,
      chamadosWhatsApp,
      respostaWhatsApp,
      efetivadosWhatsApp,
      perdidos,
      taxaConversaoGeral,
      taxaConversaoImediata,
      taxaConversaoWhatsApp
    };
  }, [leads]);
  return <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Funil de Leads</h1>
        <p className="text-muted-foreground text-left">Gerencie leads, acompanhe visitas e conversões</p>
      </div>

      {/* Linha 1: Principais métricas */}
      <div className="grid gap-4 grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cadastrados</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.cadastrados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitados</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.visitados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados na Hora</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.efetivadosImediato}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados WhatsApp</CardTitle>
            <MessageCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.efetivadosWhatsApp}</div>
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Pipeline de follow-up */}
      <div className="grid gap-4 grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Capturados</CardTitle>
            <UserPlus className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.contatosCapturados}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads com contato p/ follow-up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Resposta</CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.chamadosWhatsApp}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responderam</CardTitle>
            <MessageCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.respostaWhatsApp}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avaliando proposta
            </p>
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
      </div>

      {/* Linha 3: Taxas de conversão */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taxaConversaoGeral.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Fechados / Visitados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Fechamento Imediato</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.taxaConversaoImediata.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Fechados na hora / Visitados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão WhatsApp</CardTitle>
            <MessageCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.taxaConversaoWhatsApp.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Fechados WPP / Contactados WPP
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pipeline de Leads</CardTitle>
              <CardDescription>Gerencie o progresso dos leads no funil</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filtroStatus} onValueChange={(value: LeadStatus | 'todos') => setFiltroStatus(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Cadastrado">Cadastrado</SelectItem>
                  <SelectItem value="Visitados">Visitados</SelectItem>
                  <SelectItem value="EfetivadosImediato">Efetivados na Hora</SelectItem>
                  <SelectItem value="ContatosCapturados">Contatos Capturados</SelectItem>
                  <SelectItem value="ChamadosWhatsApp">Chamados WhatsApp</SelectItem>
                  <SelectItem value="RespostaWhatsApp">Responderam</SelectItem>
                  <SelectItem value="EfetivadosWhatsApp">Efetivados WhatsApp</SelectItem>
                  <SelectItem value="Perdidos">Perdidos</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => {
              setEditingLead(null);
              setIsLeadDialogOpen(true);
            }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Lead
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Representante</TableHead>
                <TableHead>Data Visita</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow> : leadsFiltrados.length === 0 ? <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow> : leadsFiltrados.map(lead => <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell>{lead.contatoNome || '-'}</TableCell>
                    <TableCell>{lead.contatoTelefone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[lead.status]}>
                        {STATUS_LABELS[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{getRepresentanteNome(lead.representanteId)}</TableCell>
                    <TableCell>
                      {lead.dataVisita ? format(new Date(lead.dataVisita), 'dd/MM/yyyy HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.contatoTelefone && <Button variant="ghost" size="sm" onClick={() => handleWhatsApp(lead)} title="Enviar WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </Button>}
                        <Button variant="ghost" size="sm" onClick={() => handleEditLead(lead)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <LeadStatusChanger currentStatus={lead.status} onStatusChange={novoStatus => handleMudarStatus(lead, novoStatus)} />
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LeadFormDialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen} lead={editingLead} onSave={handleSaveLead} />

      <ClienteFormDialog 
        open={isClienteDialogOpen} 
        onOpenChange={setIsClienteDialogOpen} 
        dadosIniciais={clientePreenchido || undefined}
        onClienteUpdate={handleClienteConvertidoSucesso} 
      />
    </div>;
}