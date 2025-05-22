
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Phone, MapPin, User, CalendarClock } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
}

// Stage configuration
const leadStages: {id: LeadStage, title: string}[] = [
  { id: "identificado", title: "Identificado" },
  { id: "contato", title: "Contato Realizado" },
  { id: "proposta", title: "Proposta Enviada" },
  { id: "negociacao", title: "Em Negociação" },
  { id: "ativo", title: "Ativo" },
  { id: "perdido", title: "Perdido" }
];

// Mock data for responsible and cities
const responsaveis = ["Ana", "Carlos", "Rafael", "Juliana", "Todos"];
const cidades = ["Porto Alegre", "Canoas", "São Leopoldo", "Novo Hamburgo", "Todas"];

export default function FunilLeads() {
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.contato.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResponsavel = responsavelFilter === "Todos" || lead.responsavel === responsavelFilter;
    const matchesCidade = cidadeFilter === "Todas" || lead.cidade === cidadeFilter;
    
    return matchesSearch && matchesResponsavel && matchesCidade;
  });

  const handleSalvarLead = () => {
    if (editingId) {
      setLeads(prev => 
        prev.map(lead => 
          lead.id === editingId 
            ? { ...novoLead, id: editingId, dataAtualizacao: new Date() } as Lead
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
      rota: "Zona Sul"
    });
    setEditingId(null);
  };

  const editLead = (lead: Lead) => {
    setNovoLead({...lead});
    setEditingId(lead.id);
    setDialogOpen(true);
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

    // If the lead was dropped in a different column
    if (destination.droppableId !== source.droppableId) {
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
    }
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
