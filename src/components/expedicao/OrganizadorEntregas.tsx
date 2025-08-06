
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Copy, GripVertical, MapPin, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface EntregaOrganizada {
  id: string;
  clienteNome: string;
  googleMapsLink?: string;
  observacao: string;
  ordem: number;
}

interface OrganizadorEntregasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entregas: Array<{
    id: string;
    cliente_nome: string;
    cliente_endereco?: string;
    link_google_maps?: string;
  }>;
}

export const OrganizadorEntregas = ({ open, onOpenChange, entregas }: OrganizadorEntregasProps) => {
  const [entregasOrganizadas, setEntregasOrganizadas] = useState<EntregaOrganizada[]>([]);
  const [textoGerado, setTextoGerado] = useState("");

  // Inicializar entregas organizadas quando o modal abrir
  useEffect(() => {
    if (open && entregas.length > 0) {
      const entregasIniciais = entregas.map((entrega, index) => ({
        id: entrega.id,
        clienteNome: entrega.cliente_nome,
        googleMapsLink: entrega.link_google_maps,
        observacao: "",
        ordem: index + 1
      }));
      setEntregasOrganizadas(entregasIniciais);
    }
  }, [open, entregas]);

  // Gerar texto automaticamente quando entregas mudarem
  useEffect(() => {
    const texto = entregasOrganizadas.map((entrega, index) => {
      let textoEntrega = `[Entrega ${String(index + 1).padStart(2, '0')}: ${entrega.clienteNome}`;
      
      if (entrega.observacao.trim()) {
        textoEntrega += `\n\nObs: ${entrega.observacao}`;
      }
      
      if (entrega.googleMapsLink) {
        textoEntrega += `\n\nGoogle Maps: ${entrega.googleMapsLink}]`;
      } else {
        textoEntrega += `\n\nGoogle Maps: [ENDEREÇO NÃO CADASTRADO]]`;
      }
      
      return textoEntrega;
    }).join('\n\n');
    
    setTextoGerado(texto);
  }, [entregasOrganizadas]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(entregasOrganizadas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEntregasOrganizadas(items);
  };

  const handleObservacaoChange = (id: string, observacao: string) => {
    if (observacao.length > 200) return; // Limitar a 200 caracteres
    
    setEntregasOrganizadas(prev => 
      prev.map(entrega => 
        entrega.id === id ? { ...entrega, observacao } : entrega
      )
    );
  };

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoGerado);
      toast.success("Texto copiado para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar texto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Organizar Entregas do Dia
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Painel Esquerdo - Lista de Entregas */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Lista de Entregas ({entregasOrganizadas.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="entregas">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {entregasOrganizadas.map((entrega, index) => (
                        <Draggable
                          key={entrega.id}
                          draggableId={entrega.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-4 ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-lg">
                                      {String(index + 1).padStart(2, '0')}. {entrega.clienteNome}
                                    </span>
                                    {!entrega.googleMapsLink && (
                                      <div className="flex items-center gap-1 text-red-600 text-sm">
                                        <AlertTriangle className="h-4 w-4" />
                                        Sem endereço
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Textarea
                                    placeholder="Observação (opcional, máx. 200 caracteres)"
                                    value={entrega.observacao}
                                    onChange={(e) => handleObservacaoChange(entrega.id, e.target.value)}
                                    className="min-h-[60px]"
                                    maxLength={200}
                                  />
                                  
                                  <div className="text-sm text-muted-foreground">
                                    {entrega.observacao.length}/200 caracteres
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>

          {/* Painel Direito - Texto Gerado */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Texto para WhatsApp
              </h3>
              <Button onClick={copiarTexto} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copiar Texto
              </Button>
            </div>
            
            <Card className="flex-1 p-4">
              <div className="h-full overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-md">
                  {textoGerado || "Configure as entregas à esquerda para gerar o texto..."}
                </pre>
              </div>
            </Card>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> O texto está formatado para ser colado diretamente no WhatsApp da entregadora.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
