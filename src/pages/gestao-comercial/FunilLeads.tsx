
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search } from "lucide-react";

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

export default function FunilLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEtapa, setFilterEtapa] = useState<LeadStage | "">("");

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
      }
    ];
    
    setLeads(mockData);
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.contato.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEtapa = filterEtapa === "" || lead.etapa === filterEtapa;
    
    return matchesSearch && matchesEtapa;
  });

  const stageColumns: {[key in LeadStage]: string} = {
    "identificado": "Identificado",
    "contato": "Contato Realizado",
    "proposta": "Proposta Enviada",
    "negociacao": "Em Negociação",
    "ativo": "Ativo",
    "perdido": "Perdido"
  };

  const moveCard = (leadId: string, newStage: LeadStage) => {
    setLeads(prev => 
      prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, etapa: newStage, dataAtualizacao: new Date() } 
          : lead
      )
    );
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div className="flex gap-3">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 rounded-md border"
            value={filterEtapa}
            onChange={(e) => setFilterEtapa(e.target.value as LeadStage | "")}
          >
            <option value="">Todas as etapas</option>
            {Object.entries(stageColumns).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stageColumns).map(([stage, label]) => (
          <div key={stage} className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-secondary p-2 rounded-md">
              <h3 className="font-medium">{label}</h3>
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                {filteredLeads.filter(lead => lead.etapa === stage).length}
              </div>
            </div>
            <div className="space-y-3">
              {filteredLeads
                .filter(lead => lead.etapa === stage)
                .map(lead => (
                  <Card key={lead.id} className="p-2">
                    <CardHeader className="p-2">
                      <CardTitle className="text-sm">{lead.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        {lead.contato} • {lead.telefone}
                      </p>
                      <p className="text-xs">
                        {lead.cidade} • {lead.responsavel}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <select 
                          className="text-xs p-1 border rounded"
                          value={lead.etapa}
                          onChange={(e) => moveCard(lead.id, e.target.value as LeadStage)}
                        >
                          {Object.entries(stageColumns).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
