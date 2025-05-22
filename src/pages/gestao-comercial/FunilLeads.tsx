import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Phone, MapPin, User, CalendarClock, Check, ChevronRight } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Types
type LeadStage = "identificado" | "contato" | "proposta" | "negociacao" | "ativo" | "perdido";

interface Lead {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
  etapa: LeadStage;
  observacoes: string;
  responsavel: string;
  cidade: string;
  rota: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
  // Extended fields for CRM functionality
  razaoSocial?: string;
  cnpj?: string;
  email?: string;
  endereco?: string;
  bairro?: string;
  estado?: string;
  cep?: string;
  tipoLogistica?: string;
  formaPagamento?: string;
  diasVisita?: string[];
  detalhesContrato?: string;
  motivoPerda?: string;
}

// Stage configuration
const leadStages: {id: LeadStage, title: string}[] = [
  { id: "identificado", title: "Identificado" },
  { id: "contato", title: "Contato Realizado" },
  { id: "proposta", title: "Proposta Enviada" },
  { id: "negociacao", title: "Em Negociação" },
  { id: "ativo", title: "Cliente Ativado" },
  { id: "perdido", title: "Perdido" }
];

// Mock data for responsible and cities
const responsaveis = ["Ana", "Carlos", "Rafael", "Juliana", "Todos"];
const cidades = ["Porto Alegre", "Canoas", "São Leopoldo", "Novo Hamburgo", "Todas"];
const tiposLogistica = ["Própria", "Terceirizada", "Retirada no Local"];
const formasPagamento = ["À Vista", "Boleto", "Cartão de Crédito", "PIX", "Prazo 15 dias", "Prazo 30 dias"];
const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function FunilLeads() {
  const clienteStore = useClienteStore();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [responsavelFilter, setResponsavelFilter] = useState("Todos");
  const [cidadeFilter, setCidadeFilter] = useState("Todas");
  const [novoLead, setNovoLead] = useState<Partial<Lead>>({
    etapa: "identificado",
    responsavel: "Ana",
    rota: "Zona Sul"
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState("info-basica");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Initialize leads with mock data
  useEffect(() => {
    const mockData: Lead[] = [
      {
        id: "1",
        nome: "Café Central",
        contato: "João Silva",
        telefone: "(51) 98765-4321",
        etapa: "identificado",
        observacoes: "Indicado pelo cliente Maria",
        responsavel: "Ana",
        cidade: "Porto Alegre",
        rota: "Zona Sul",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
      {
        id: "2",
        nome: "Padaria Bom Pão",
        contato: "Maria Oliveira",
        telefone: "(51) 91234-5678",
        etapa: "contato",
        observacoes: "Primeira reunião agendada",
        responsavel: "Carlos",
        cidade: "Canoas",
        rota: "Região Metropolitana",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
      {
        id: "3",
        nome: "Doceria Feliz",
        contato: "Pedro Santos",
        telefone: "(51) 98888-5555",
        etapa: "proposta",
        observacoes: "Aguardando retorno da proposta",
        responsavel: "Ana",
        cidade: "Porto Alegre",
        rota: "Centro",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        razaoSocial: "Doces & Cia LTDA",
        cnpj: "12.345.678/0001-90",
        email: "contato@doceriafeliz.com.br"
      },
      {
        id: "4",
        nome: "Supermercado Economia",
        contato: "Lucas Machado",
        telefone: "(51) 97777-6666",
        etapa: "negociacao",
        observacoes: "Negociando descontos por volume",
        responsavel: "Rafael",
        cidade: "São Leopoldo",
        rota: "Vale dos Sinos",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        razaoSocial: "Economia Supermercados SA",
        cnpj: "45.678.901/0001-23",
        email: "compras@economia.com.br",
        endereco: "Av. Principal, 1500",
        tipoLogistica: "Própria",
        formaPagamento: "Prazo 30 dias"
      },
      {
        id: "5",
        nome: "Hotel Encanto",
        contato: "Ana Paula",
        telefone: "(51) 96666-3333",
        etapa: "ativo",
        observacoes: "Cliente desde 01/2024",
        responsavel: "Juliana",
        cidade: "Novo Hamburgo",
        rota: "Vale dos Sinos",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        razaoSocial: "Hotel Encanto LTDA",
        cnpj: "78.901.234/0001-56",
        email: "reservas@hotelencanto.com.br",
        endereco: "Rua das Flores, 500",
        bairro: "Centro",
        estado: "RS",
        cep: "90000-000",
        tipoLogistica: "Terceirizada",
        formaPagamento: "Boleto",
        diasVisita: ["Segunda", "Quinta"],
        detalhesContrato: "Fornecimento semanal para café da manhã"
      },
      {
        id: "6",
        nome: "Mercado do João",
        contato: "João Pereira",
        telefone: "(51) 95555-4444",
        etapa: "perdido",
        observacoes: "Preço fora do orçamento",
        responsavel: "Carlos",
        cidade: "Canoas",
        rota: "Região Metropolitana",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        motivoPerda: "Cliente optou por fornecedor com preço mais baixo"
      }
    ];
    
    setLeads(mockData);
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.contato.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResponsavel = responsavelFilter === "Todos" || lead.responsavel === responsavelFilter;
    const matchesCidade = cidadeFilter === "Todas" || lead.cidade === cidadeFilter;
    
    return matchesSearch && matchesResponsavel && matchesCidade;
  });

  const handleSalvarLead = () => {
    if (!novoLead.nome || !novoLead.contato || !novoLead.telefone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (editingId) {
      setLeads(prev => 
        prev.map(lead => 
          lead.id === editingId 
            ? { ...lead, ...novoLead, dataAtualizacao: new Date() } as Lead
            : lead
        )
      );
      
      toast({
        title: "Lead atualizado",
        description: `O lead ${novoLead.nome} foi atualizado com sucesso.`
      });
    } else {
      const now = new Date();
      const id = Math.random().toString(36).substr(2, 9);
      setLeads(prev => [...prev, {
        ...novoLead,
        id,
        dataCriacao: now,
        dataAtualizacao: now
      } as Lead]);
      
      toast({
        title: "Lead adicionado",
        description: `O lead ${novoLead.nome} foi adicionado com sucesso.`
      });
    }
    
    setDialogOpen(false);
    setNovoLead({
      etapa: "identificado",
      responsavel: "Ana",
      rota: "Zona Sul"
    });
    setEditingId(null);
  };

  // Convert lead to cliente when moved to "ativo" stage
  const convertLeadToClient = (lead: Lead) => {
    try {
      if (!lead.razaoSocial || !lead.cidade) {
        toast({
          title: "Dados incompletos",
          description: "Para ativar um cliente, complete os dados cadastrais completos.",
          variant: "destructive"
        });
        return false;
      }
      
      // Add the lead as a client in the client store
      clienteStore.addCliente({
        id: lead.id,
        nome: lead.nome,
        razaoSocial: lead.razaoSocial || "",
        cnpjCpf: lead.cnpj || "",
        contato: lead.contato,
        telefone: lead.telefone,
        email: lead.email || "",
        endereco: lead.endereco || "",
        cidade: lead.cidade,
        estado: lead.estado || "RS",
        cep: lead.cep || "",
        representante: lead.responsavel,
        categoriaEstabelecimento: "Novo",
        rota: lead.rota,
        statusCliente: "Ativo",
        tipoLogistica: lead.tipoLogistica || "Própria",
        formaPagamento: lead.formaPagamento || "À Vista",
        diasEntrega: lead.diasVisita || ["Segunda"],
        observacoes: lead.observacoes,
        giroSemanal: 0,
        visibilidade: true
      });
      
      toast({
        title: "Cliente ativado",
        description: `${lead.nome} foi convertido para cliente com sucesso!`,
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error("Erro ao converter lead para cliente:", error);
      toast({
        title: "Erro ao converter lead",
        description: "Ocorreu um erro ao converter o lead para cliente.",
        variant: "destructive"
      });
      return false;
    }
  };

  const editLead = (lead: Lead) => {
    setNovoLead({...lead});
    setEditingId(lead.id);
    setDialogOpen(true);
  };

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
  };

  // Handle dragging leads between columns
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside the list or in same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find the lead being moved
    const movedLead = leads.find(lead => lead.id === draggableId);
    if (!movedLead) return;

    // If the lead was dropped in a different column
    if (destination.droppableId !== source.droppableId) {
      const newStage = destination.droppableId as LeadStage;
      
      // If moving to "ativo", try to convert to client
      if (newStage === "ativo" && movedLead.etapa !== "ativo") {
        // If lead doesn't have enough data, open details dialog first
        if (!movedLead.razaoSocial || !movedLead.cnpj) {
          toast({
            title: "Dados incompletos",
            description: "Complete o cadastro do lead antes de movê-lo para Cliente Ativado.",
            variant: "destructive"
          });
          setSelectedLead(movedLead);
          setDetailsOpen(true);
          return;
        }
        
        // Try to convert the lead to client
        const success = convertLeadToClient(movedLead);
        if (!success) {
          return; // Don't move if conversion failed
        }
      }
      
      // Update the lead's stage
      setLeads(prev => prev.map(lead => {
        if (lead.id === draggableId) {
          return {
            ...lead,
            etapa: newStage,
            dataAtualizacao: new Date()
          };
        }
        return lead;
      }));

      // Show toast for the stage change
      toast({
        title: "Lead atualizado",
        description: `${movedLead.nome} foi movido para ${leadStages.find(s => s.id === newStage)?.title}.`
      });
    }
  };

  const handleSaveDetails = () => {
    if (!selectedLead) return;

    // Update the lead with the details
    setLeads(prev => prev.map(lead => 
      lead.id === selectedLead.id ? selectedLead : lead
    ));

    // If the lead is in "ativo" stage, convert to client
    if (selectedLead.etapa === "ativo") {
      convertLeadToClient(selectedLead);
    }
    
    setDetailsOpen(false);
    toast({
      title: "Detalhes salvos",
      description: "Os detalhes do lead foram atualizados com sucesso."
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads por nome ou contato..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={responsavelFilter}
            onValueChange={setResponsavelFilter}
          >
            <SelectTrigger className="w-[160px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              {responsaveis.map(resp => (
                <SelectItem key={resp} value={resp}>{resp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={cidadeFilter}
            onValueChange={setCidadeFilter}
          >
            <SelectTrigger className="w-[160px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              {cidades.map(cidade => (
                <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Lead" : "Adicionar Novo Lead"}</DialogTitle>
              <DialogDescription>
                Preencha as informações do lead abaixo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome da Empresa*</Label>
                <Input
                  id="nome"
                  value={novoLead.nome || ""}
                  onChange={e => setNovoLead({...novoLead, nome: e.target.value})}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contato">Nome do Contato*</Label>
                  <Input
                    id="contato"
                    value={novoLead.contato || ""}
                    onChange={e => setNovoLead({...novoLead, contato: e.target.value})}
                    placeholder="Nome da pessoa de contato"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone*</Label>
                  <Input
                    id="telefone"
                    value={novoLead.telefone || ""}
                    onChange={e => setNovoLead({...novoLead, telefone: e.target.value})}
                    placeholder="(xx) xxxxx-xxxx"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="responsavel">Responsável*</Label>
                  <Select
                    value={novoLead.responsavel}
                    onValueChange={(value) => setNovoLead({...novoLead, responsavel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsaveis.filter(r => r !== "Todos").map(resp => (
                        <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="etapa">Etapa*</Label>
                  <Select
                    value={novoLead.etapa}
                    onValueChange={(value) => setNovoLead({...novoLead, etapa: value as LeadStage})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadStages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cidade">Cidade*</Label>
                  <Select
                    value={novoLead.cidade}
                    onValueChange={(value) => setNovoLead({...novoLead, cidade: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {cidades.filter(c => c !== "Todas").map(cidade => (
                        <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rota">Rota</Label>
                  <Input
                    id="rota"
                    value={novoLead.rota || ""}
                    onChange={e => setNovoLead({...novoLead, rota: e.target.value})}
                    placeholder="Rota de atendimento"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={novoLead.observacoes || ""}
                  onChange={e => setNovoLead({...novoLead, observacoes: e.target.value})}
                  placeholder="Informações adicionais"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarLead}>
                {editingId ? "Salvar Alterações" : "Adicionar Lead"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Lead Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead: {selectedLead?.nome}</DialogTitle>
            <DialogDescription>
              Adicione mais informações para completar o cadastro do lead.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <>
              <Tabs value={detailsTab} onValueChange={setDetailsTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info-basica">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                  <TabsTrigger value="comercial">Dados Comerciais</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info-basica" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Nome da Empresa</Label>
                      <Input
                        value={selectedLead.nome}
                        onChange={e => setSelectedLead({...selectedLead, nome: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Razão Social</Label>
                      <Input
                        value={selectedLead.razaoSocial || ""}
                        onChange={e => setSelectedLead({...selectedLead, razaoSocial: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>CNPJ</Label>
                      <Input
                        value={selectedLead.cnpj || ""}
                        onChange={e => setSelectedLead({...selectedLead, cnpj: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={selectedLead.email || ""}
                        onChange={e => setSelectedLead({...selectedLead, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Nome do Contato</Label>
                      <Input
                        value={selectedLead.contato}
                        onChange={e => setSelectedLead({...selectedLead, contato: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Telefone</Label>
                      <Input
                        value={selectedLead.telefone}
                        onChange={e => setSelectedLead({...selectedLead, telefone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={selectedLead.observacoes || ""}
                      onChange={e => setSelectedLead({...selectedLead, observacoes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="endereco" className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label>Endereço Completo</Label>
                    <Input
                      value={selectedLead.endereco || ""}
                      onChange={e => setSelectedLead({...selectedLead, endereco: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Bairro</Label>
                      <Input
                        value={selectedLead.bairro || ""}
                        onChange={e => setSelectedLead({...selectedLead, bairro: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Cidade</Label>
                      <Select
                        value={selectedLead.cidade}
                        onValueChange={(value) => setSelectedLead({...selectedLead, cidade: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {cidades.filter(c => c !== "Todas").map(cidade => (
                            <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Estado</Label>
                      <Input
                        value={selectedLead.estado || "RS"}
                        onChange={e => setSelectedLead({...selectedLead, estado: e.target.value})}
                        maxLength={2}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>CEP</Label>
                      <Input
                        value={selectedLead.cep || ""}
                        onChange={e => setSelectedLead({...selectedLead, cep: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Rota</Label>
                      <Input
                        value={selectedLead.rota || ""}
                        onChange={e => setSelectedLead({...selectedLead, rota: e.target.value})}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="comercial" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tipo de Logística</Label>
                      <Select
                        value={selectedLead.tipoLogistica || ""}
                        onValueChange={(value) => setSelectedLead({...selectedLead, tipoLogistica: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposLogistica.map(tipo => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Forma de Pagamento</Label>
                      <Select
                        value={selectedLead.formaPagamento || ""}
                        onValueChange={(value) => setSelectedLead({...selectedLead, formaPagamento: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {formasPagamento.map(forma => (
                            <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Dias de Visita/Entrega</Label>
                    <div className="flex flex-wrap gap-2">
                      {diasSemana.map(dia => (
                        <Button
                          key={dia}
                          type="button"
                          variant={selectedLead.diasVisita?.includes(dia) ? "default" : "outline"}
                          className="h-8"
                          onClick={() => {
                            const currentDias = selectedLead.diasVisita || [];
                            const newDias = currentDias.includes(dia)
                              ? currentDias.filter(d => d !== dia)
                              : [...currentDias, dia];
                            setSelectedLead({...selectedLead, diasVisita: newDias});
                          }}
                        >
                          {dia}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Responsável</Label>
                    <Select
                      value={selectedLead.responsavel}
                      onValueChange={(value) => setSelectedLead({...selectedLead, responsavel: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsaveis.filter(r => r !== "Todos").map(resp => (
                          <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>{selectedLead.etapa === "perdido" ? "Motivo da Perda" : "Detalhes do Contrato"}</Label>
                    <Textarea
                      value={(selectedLead.etapa === "perdido" ? selectedLead.motivoPerda : selectedLead.detalhesContrato) || ""}
                      onChange={e => {
                        if (selectedLead.etapa === "perdido") {
                          setSelectedLead({...selectedLead, motivoPerda: e.target.value});
                        } else {
                          setSelectedLead({...selectedLead, detalhesContrato: e.target.value});
                        }
                      }}
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveDetails}>
                  {selectedLead.etapa === "ativo" ? "Salvar e Ativar Cliente" : "Salvar Detalhes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
          {leadStages.map((stage) => (
            <div key={stage.id} className="min-w-[250px]">
              <div className="flex justify-between items-center bg-secondary p-2 rounded-md mb-3">
                <h3 className="font-medium">{stage.title}</h3>
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {filteredLeads.filter(lead => lead.etapa === stage.id).length}
                </div>
              </div>
              
              <Droppable droppableId={stage.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3 min-h-[200px]"
                  >
                    {filteredLeads
                      .filter(lead => lead.etapa === stage.id)
                      .map((lead, index) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id}
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-2 cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <CardHeader className="p-2">
                                <CardTitle className="text-sm flex justify-between">
                                  {lead.nome}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-2 pt-0">
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                                  <User className="h-3 w-3" />
                                  <span>{lead.contato}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{lead.telefone}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{lead.cidade}</span>
                                  <span className="mx-1">•</span>
                                  <User className="h-3 w-3" />
                                  <span>{lead.responsavel}</span>
                                </div>
                                {lead.observacoes && (
                                  <p className="text-xs mt-2 border-t pt-1 line-clamp-2 text-muted-foreground">
                                    {lead.observacoes}
                                  </p>
                                )}
                                <div className="text-xs flex items-center mt-2 text-muted-foreground">
                                  <CalendarClock className="h-3 w-3 mr-1" />
                                  <span>
                                    {new Date(lead.dataAtualizacao).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 h-auto text-xs mt-2 text-primary w-full justify-end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLeadDetails(lead);
                                  }}
                                >
                                  {lead.razaoSocial ? "Ver Detalhes" : "Completar Cadastro"}
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
