
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Phone, MapPin, User, CalendarClock, Building as BuildingIcon, FileText, Mail } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "@/components/ui/use-toast";
import { useClienteStore } from "@/hooks/useClienteStore";

// Types
type LeadStage = "identificado" | "contato" | "proposta" | "negociacao" | "ativo" | "perdido";

interface Lead {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
  email?: string;
  etapa: LeadStage;
  observacoes: string;
  responsavel: string;
  cidade: string;
  rota: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
  // Campos adicionais para integração com Cliente
  endereco?: string;
  bairro?: string;
  estado?: string;
  cnpjCpf?: string;
  categoriaEstabelecimento?: string;
  tipoLogistica?: string;
  formaPagamento?: string;
  diasEntrega?: string[];
  valorGiroSemanal?: number;
  giroOrigem?: string;
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

// Mock data for dropdowns
const responsaveis = ["Ana", "Carlos", "Rafael", "Juliana", "Todos"];
const cidades = ["Porto Alegre", "Canoas", "São Leopoldo", "Novo Hamburgo", "Todas"];
const rotas = ["Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Região Metropolitana", "Vale dos Sinos"];
const categoriasEstabelecimento = ["Café", "Padaria", "Restaurante", "Hotel", "Mercado", "Outro"];
const tiposLogistica = ["Entrega Própria", "Entrega Terceirizada", "Retirada no Local"];
const formasPagamento = ["À Vista", "Boleto 15 dias", "Boleto 30 dias", "PIX"];
const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function FunilLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [responsavelFilter, setResponsavelFilter] = useState("Todos");
  const [cidadeFilter, setCidadeFilter] = useState("Todas");
  const [novoLead, setNovoLead] = useState<Partial<Lead>>({
    etapa: "identificado",
    responsavel: "Ana",
    rota: "Zona Sul",
    diasEntrega: []
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDiasSemana, setSelectedDiasSemana] = useState<string[]>([]);

  // Get the addCliente function from the cliente store
  const { addCliente } = useClienteStore();

  // Initialize leads with mock data
  useEffect(() => {
    const mockData: Lead[] = [
      {
        id: "1",
        nome: "Café Central",
        contato: "João Silva",
        telefone: "(51) 98765-4321",
        email: "contato@cafecentral.com.br",
        etapa: "identificado",
        observacoes: "Indicado pelo cliente Maria",
        responsavel: "Ana",
        cidade: "Porto Alegre",
        rota: "Zona Sul",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        endereco: "Rua das Flores, 123",
        bairro: "Centro",
        estado: "RS",
        cnpjCpf: "12.345.678/0001-90",
        categoriaEstabelecimento: "Café",
        tipoLogistica: "Entrega Própria",
        formaPagamento: "À Vista",
        diasEntrega: ["Segunda", "Quarta", "Sexta"],
        valorGiroSemanal: 800,
        giroOrigem: "Estimativa"
      },
      {
        id: "2",
        nome: "Padaria Bom Pão",
        contato: "Maria Oliveira",
        telefone: "(51) 91234-5678",
        email: "maria@bompao.com.br",
        etapa: "contato",
        observacoes: "Primeira reunião agendada",
        responsavel: "Carlos",
        cidade: "Canoas",
        rota: "Região Metropolitana",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        endereco: "Av. Brasil, 500",
        bairro: "Centro",
        estado: "RS",
        cnpjCpf: "98.765.432/0001-10",
        categoriaEstabelecimento: "Padaria",
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
        endereco: "Av. das Flores, 1000",
        bairro: "Centro",
        estado: "RS",
        cnpjCpf: "11.222.333/0001-44",
        categoriaEstabelecimento: "Hotel",
        tipoLogistica: "Entrega Própria",
        formaPagamento: "Boleto 30 dias",
        diasEntrega: ["Terça", "Quinta"],
        valorGiroSemanal: 1500,
        giroOrigem: "Informado pelo cliente"
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
      }
    ];
    
    setLeads(mockData);
  }, []);

  // Update selectedDiasSemana when editing a lead
  useEffect(() => {
    if (editingId && novoLead.diasEntrega) {
      setSelectedDiasSemana(novoLead.diasEntrega);
    } else {
      setSelectedDiasSemana([]);
    }
  }, [editingId, novoLead.diasEntrega]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.contato?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResponsavel = responsavelFilter === "Todos" || lead.responsavel === responsavelFilter;
    const matchesCidade = cidadeFilter === "Todas" || lead.cidade === cidadeFilter;
    
    return matchesSearch && matchesResponsavel && matchesCidade;
  });

  // Handle day of week selection
  const handleDiasSemanaToggle = (dia: string) => {
    setSelectedDiasSemana(prev => {
      if (prev.includes(dia)) {
        return prev.filter(d => d !== dia);
      } else {
        return [...prev, dia];
      }
    });
  };

  // Update the novoLead state when selectedDiasSemana changes
  useEffect(() => {
    setNovoLead(prev => ({
      ...prev,
      diasEntrega: selectedDiasSemana
    }));
  }, [selectedDiasSemana]);

  const handleSalvarLead = () => {
    if (editingId) {
      setLeads(prev => 
        prev.map(lead => 
          lead.id === editingId 
            ? { ...lead, ...novoLead, id: editingId, dataAtualizacao: new Date() }
            : lead
        )
      );
    } else {
      const now = new Date();
      const id = Math.random().toString(36).substr(2, 9);
      setLeads(prev => [...prev, {
        ...novoLead,
        id,
        dataCriacao: now,
        dataAtualizacao: now
      } as Lead]);
    }
    
    setDialogOpen(false);
    setNovoLead({
      etapa: "identificado",
      responsavel: "Ana",
      rota: "Zona Sul",
      diasEntrega: []
    });
    setEditingId(null);
    setSelectedDiasSemana([]);
  };

  const editLead = (lead: Lead) => {
    setNovoLead({...lead});
    setEditingId(lead.id);
    setDialogOpen(true);
  };

  // Convert a lead to a client when it's moved to "ativo" stage
  const convertLeadToClient = (lead: Lead) => {
    if (!lead.nome || !lead.cidade) {
      toast({
        title: "Dados insuficientes",
        description: "Preencha pelo menos o nome e a cidade do cliente antes de ativá-lo.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Create a new client from lead data
      addCliente({
        id: Math.floor(Math.random() * 1000000), // Use a proper ID generation in production
        nome: lead.nome,
        contato: lead.contato || "",
        telefone: lead.telefone || "",
        email: lead.email || "",
        endereco: lead.endereco || "",
        bairro: lead.bairro || "",
        cidade: lead.cidade || "",
        estado: lead.estado || "RS",
        cnpjCpf: lead.cnpjCpf || "",
        categoriaEstabelecimento: lead.categoriaEstabelecimento || "Café",
        responsavel: lead.responsavel || "",
        tipoLogistica: lead.tipoLogistica || "Entrega Própria",
        formaPagamento: lead.formaPagamento || "À Vista",
        rota: lead.rota || "",
        diasEntrega: lead.diasEntrega || ["Segunda"],
        status: "Ativo",
        statusAgendamento: "Não agendado",
        quantidadePadrao: 0,
        periodicidade: "Semanal",
        proximaDataReposicao: null,
        ultimaDataReposicao: null,
        fotoFachada: null,
        observacoes: lead.observacoes || "",
        dataCadastro: new Date(),
        giros: lead.valorGiroSemanal ? [{
          id: Math.floor(Math.random() * 1000000),
          clienteId: Math.floor(Math.random() * 1000000),
          valor: lead.valorGiroSemanal,
          semana: 1,
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          origem: lead.giroOrigem || "Convertido de Lead",
          dataCriacao: new Date()
        }] : []
      });

      toast({
        title: "Cliente criado com sucesso",
        description: `${lead.nome} foi adicionado à base de clientes.`
      });

      return true;
    } catch (error) {
      console.error("Erro ao converter lead para cliente:", error);
      toast({
        title: "Erro ao criar cliente",
        description: "Não foi possível adicionar o cliente. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
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

    // Find the lead that was dragged
    const draggedLead = leads.find(lead => lead.id === draggableId);
    if (!draggedLead) return;

    // Check if the lead is being moved to "ativo" stage
    if (destination.droppableId === "ativo" && source.droppableId !== "ativo") {
      // Try to convert the lead to a client
      const success = convertLeadToClient(draggedLead);
      
      // If conversion fails, return without moving the lead
      if (!success) return;
      
      // Show success toast
      toast({
        title: "Lead ativado",
        description: `${draggedLead.nome} foi convertido para cliente ativo.`,
      });
    }

    // Update the lead's stage to match the new column
    setLeads(prev => prev.map(lead => {
      if (lead.id === draggableId) {
        return {
          ...lead,
          etapa: destination.droppableId as LeadStage,
          dataAtualizacao: new Date()
        };
      }
      return lead;
    }));
  };

  // Render form fields for the lead dialog
  const renderFormFields = () => {
    return (
      <>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome da Empresa</Label>
            <Input
              id="nome"
              value={novoLead.nome || ""}
              onChange={e => setNovoLead({...novoLead, nome: e.target.value})}
              placeholder="Nome da empresa"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contato">Nome do Contato</Label>
              <Input
                id="contato"
                value={novoLead.contato || ""}
                onChange={e => setNovoLead({...novoLead, contato: e.target.value})}
                placeholder="Nome da pessoa de contato"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={novoLead.telefone || ""}
                onChange={e => setNovoLead({...novoLead, telefone: e.target.value})}
                placeholder="(xx) xxxxx-xxxx"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={novoLead.email || ""}
              onChange={e => setNovoLead({...novoLead, email: e.target.value})}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="responsavel">Responsável</Label>
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
              <Label htmlFor="etapa">Etapa</Label>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cidade">Cidade</Label>
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
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={novoLead.estado || "RS"}
                onChange={e => setNovoLead({...novoLead, estado: e.target.value})}
                placeholder="Estado (UF)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rota">Rota</Label>
              <Select
                value={novoLead.rota}
                onValueChange={(value) => setNovoLead({...novoLead, rota: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {rotas.map(rota => (
                    <SelectItem key={rota} value={rota}>{rota}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={novoLead.endereco || ""}
                onChange={e => setNovoLead({...novoLead, endereco: e.target.value})}
                placeholder="Rua, Número"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={novoLead.bairro || ""}
                onChange={e => setNovoLead({...novoLead, bairro: e.target.value})}
                placeholder="Bairro"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
              <Input
                id="cnpjCpf"
                value={novoLead.cnpjCpf || ""}
                onChange={e => setNovoLead({...novoLead, cnpjCpf: e.target.value})}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoriaEstabelecimento">Categoria</Label>
              <Select
                value={novoLead.categoriaEstabelecimento}
                onValueChange={(value) => setNovoLead({...novoLead, categoriaEstabelecimento: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasEstabelecimento.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tipoLogistica">Tipo de Logística</Label>
              <Select
                value={novoLead.tipoLogistica}
                onValueChange={(value) => setNovoLead({...novoLead, tipoLogistica: value})}
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
              <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
              <Select
                value={novoLead.formaPagamento}
                onValueChange={(value) => setNovoLead({...novoLead, formaPagamento: value})}
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
            <Label htmlFor="diasEntrega">Dias de Entrega</Label>
            <div className="flex flex-wrap gap-2">
              {diasSemana.map(dia => (
                <Button
                  key={dia}
                  type="button"
                  size="sm"
                  variant={selectedDiasSemana.includes(dia) ? "default" : "outline"}
                  onClick={() => handleDiasSemanaToggle(dia)}
                >
                  {dia.substring(0, 3)}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="valorGiroSemanal">Valor de Giro Semanal (R$)</Label>
              <Input
                id="valorGiroSemanal"
                type="number"
                value={novoLead.valorGiroSemanal || ""}
                onChange={e => setNovoLead({...novoLead, valorGiroSemanal: parseFloat(e.target.value)})}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="giroOrigem">Origem do Giro</Label>
              <Select
                value={novoLead.giroOrigem}
                onValueChange={(value) => setNovoLead({...novoLead, giroOrigem: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estimativa">Estimativa</SelectItem>
                  <SelectItem value="Informado pelo cliente">Informado pelo cliente</SelectItem>
                  <SelectItem value="Análise de mercado">Análise de mercado</SelectItem>
                </SelectContent>
              </Select>
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
      </>
    );
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
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Lead" : "Adicionar Novo Lead"}</DialogTitle>
              <DialogDescription>
                Preencha as informações do lead abaixo. Quanto mais completo, melhor será a conversão para cliente.
              </DialogDescription>
            </DialogHeader>
            
            {renderFormFields()}
            
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
                              onClick={() => editLead(lead)}
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
                                {lead.email && (
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{lead.cidade}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
                                  <BuildingIcon className="h-3 w-3" />
                                  <span>{lead.categoriaEstabelecimento || "Não definido"}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{lead.responsavel}</span>
                                </div>
                                {lead.valorGiroSemanal && (
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>R$ {lead.valorGiroSemanal.toFixed(2)}</span>
                                  </div>
                                )}
                                {lead.observacoes && (
                                  <div className="border-t mt-2 pt-1">
                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                      <FileText className="h-3 w-3" />
                                      <span className="line-clamp-2">{lead.observacoes}</span>
                                    </div>
                                  </div>
                                )}
                                <div className="text-xs flex items-center mt-2 text-muted-foreground">
                                  <CalendarClock className="h-3 w-3 mr-1" />
                                  <span>
                                    {new Date(lead.dataAtualizacao).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                {lead.etapa === "ativo" && (
                                  <div className="mt-2">
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium dark:bg-green-900 dark:text-green-100">
                                      Cliente Ativado
                                    </span>
                                  </div>
                                )}
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
