import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Edit, Trash2, UserPlus, Target, TrendingUp, AlertCircle, MessageCircle, 
  FileText, CheckCircle2, Phone, MapPin, Clock, Trophy, Zap 
} from "lucide-react";
import { Lead, LeadStatus, getCanalFollowup } from "@/types/lead";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";
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

    // Se movido para qualquer estágio de efetivação, abrir modal de cliente
    if (novoStatus.startsWith('efetivado_')) {
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
    // === GRUPO 1: PIPELINE (FLUXO) ===
    const paraVisitar = leads.filter(l => l.status === 'cadastrado').length;
    const visitados = leads.filter(l => l.status !== 'cadastrado').length;
    
    // === GRUPO 2: AÇÕES NECESSÁRIAS (Prioridade do Vendedor) ===
    const pendenciasWpp = leads.filter(l => l.status === 'followup_wpp_pendente').length;
    const retornosPresenciais = leads.filter(l => l.status === 'followup_presencial_pendente').length;
    
    // === GRUPO 3: EM NEGOCIAÇÃO (Aguardando Cliente) ===
    const aguardandoCliente = leads.filter(l => 
      l.status === 'followup_wpp_tentativa' ||
      l.status === 'followup_wpp_negociacao' ||
      l.status === 'followup_presencial_tentativa' ||
      l.status === 'followup_presencial_negociacao'
    ).length;
    
    // === GRUPO 4: RESULTADOS ===
    const totalEfetivados = leads.filter(l => 
      l.status === 'efetivado_imediato' ||
      l.status === 'efetivado_wpp' ||
      l.status === 'efetivado_presencial'
    ).length;
    
    const totalPerdidos = leads.filter(l =>
      l.status === 'perdido_imediato' ||
      l.status === 'perdido_wpp' ||
      l.status === 'perdido_presencial'
    ).length;
    
    // Taxa de Conversão: (Total Efetivados / Total Visitados) * 100
    const taxaConversao = visitados > 0 
      ? ((totalEfetivados / visitados) * 100).toFixed(1)
      : '0.0';
    
    // Detalhamento por canal
    const efetivadosImediato = leads.filter(l => l.status === 'efetivado_imediato').length;
    const efetivadosWpp = leads.filter(l => l.status === 'efetivado_wpp').length;
    const efetivadosPresencial = leads.filter(l => l.status === 'efetivado_presencial').length;
    const efetivadosInbound = leads.filter(l => l.status === 'efetivado_inbound').length;
    
    // Contatos capturados (leads com telefone preenchido)
    const contatosCapturados = leads.filter(l => 
      l.contatoTelefone && l.contatoTelefone.trim() !== ''
    ).length;
    
    return {
      // Grupo 1
      paraVisitar,
      visitados,
      
      // Grupo 2
      pendenciasWpp,
      retornosPresenciais,
      
      // Grupo 3
      aguardandoCliente,
      
      // Grupo 4
      taxaConversao,
      totalEfetivados,
      efetivadosImediato,
      efetivadosWpp,
      efetivadosPresencial,
      efetivadosInbound,
      totalPerdidos,
      
      // Extra
      contatosCapturados
    };
  }, [leads]);
  return <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Funil de Leads</h1>
        <p className="text-muted-foreground text-left">Gerencie leads, acompanhe visitas e conversões</p>
      </div>

      {/* === GRUPO 1: PIPELINE === */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Para Visitar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paraVisitar}</div>
            <p className="text-xs text-muted-foreground">Leads cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visitados}</div>
            <p className="text-xs text-muted-foreground">Já receberam amostras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Capturados</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contatosCapturados}</div>
            <p className="text-xs text-muted-foreground">Leads com WhatsApp</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.taxaConversao}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEfetivados} de {stats.visitados} visitados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* === GRUPO 2: AÇÕES NECESSÁRIAS === */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">⚠️ Pendências WhatsApp</CardTitle>
            <MessageCircle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.pendenciasWpp}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Contatos capturados aguardando mensagem
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">⚠️ Retornos Presenciais</CardTitle>
            <MapPin className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.retornosPresenciais}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes aguardando revisita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* === GRUPO 3: EM NEGOCIAÇÃO === */}
      <div className="grid gap-4 md:grid-cols-1 mb-6">
        <Card className="border-purple-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.aguardandoCliente}</div>
            <p className="text-xs text-muted-foreground">Aguardando resposta do cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* === GRUPO 4: RESULTADOS === */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalEfetivados}</div>
            <p className="text-xs text-muted-foreground">Clientes fechados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados na Hora</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.efetivadosImediato}</div>
            <p className="text-xs text-muted-foreground">Na primeira visita</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados WhatsApp</CardTitle>
            <MessageCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.efetivadosWpp}</div>
            <p className="text-xs text-muted-foreground">Via mensagem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados Presencial</CardTitle>
            <UserPlus className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.efetivadosPresencial}</div>
            <p className="text-xs text-muted-foreground">No retorno</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados Inbound</CardTitle>
            <Phone className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.efetivadosInbound}</div>
            <p className="text-xs text-muted-foreground">Cliente veio até nós</p>
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
                  <SelectItem value="cadastrado">Cadastrado</SelectItem>
                  <SelectItem value="visitado">Visitado</SelectItem>
                  <SelectItem value="followup_wpp_pendente">WhatsApp Pendente</SelectItem>
                  <SelectItem value="followup_wpp_tentativa">WhatsApp Enviado</SelectItem>
                  <SelectItem value="followup_wpp_negociacao">Negociando (WhatsApp)</SelectItem>
                  <SelectItem value="followup_presencial_pendente">Retorno Pendente</SelectItem>
                  <SelectItem value="followup_presencial_tentativa">Revisitado</SelectItem>
                  <SelectItem value="followup_presencial_negociacao">Negociando (Presencial)</SelectItem>
                  <SelectItem value="efetivado_imediato">Fechado na Hora</SelectItem>
                  <SelectItem value="efetivado_wpp">Fechado WhatsApp</SelectItem>
                  <SelectItem value="efetivado_presencial">Fechado Presencial</SelectItem>
                  <SelectItem value="efetivado_inbound">Fechado Inbound</SelectItem>
                  <SelectItem value="perdido_imediato">Perdido Imediato</SelectItem>
                  <SelectItem value="perdido_wpp">Perdido WhatsApp</SelectItem>
                  <SelectItem value="perdido_presencial">Perdido Presencial</SelectItem>
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
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>{getRepresentanteNome(lead.representanteId)}</TableCell>
                    <TableCell>
                      {lead.dataVisita ? format(new Date(lead.dataVisita), 'dd/MM/yyyy HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão de Ação Rápida Dinâmico */}
                        {getCanalFollowup(lead.status) === 'wpp' && lead.contatoTelefone && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleWhatsApp(lead)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            WhatsApp
                          </Button>
                        )}
                        
                        {getCanalFollowup(lead.status) === 'presencial' && lead.linkGoogleMaps && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => window.open(lead.linkGoogleMaps, '_blank')}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Ir ao Local
                          </Button>
                        )}
                        
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