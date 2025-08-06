
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, MapPin, User, AlertTriangle, ArrowUpDown } from "lucide-react";
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
      let textoEntrega = `Entrega ${String(index + 1).padStart(2, '0')}: ${entrega.clienteNome}`;
      
      if (entrega.observacao.trim()) {
        textoEntrega += `\n\nObs: ${entrega.observacao}`;
      }
      
      if (entrega.googleMapsLink) {
        textoEntrega += `\n\nGoogle Maps: ${entrega.googleMapsLink}`;
      } else {
        textoEntrega += `\n\nGoogle Maps: ENDEREÇO NÃO CADASTRADO`;
      }
      
      return textoEntrega;
    }).join('\n\n');
    
    setTextoGerado(texto);
  }, [entregasOrganizadas]);

  const handleObservacaoChange = (id: string, observacao: string) => {
    if (observacao.length > 200) return; // Limitar a 200 caracteres
    
    setEntregasOrganizadas(prev => 
      prev.map(entrega => 
        entrega.id === id ? { ...entrega, observacao } : entrega
      )
    );
  };

  const handleReordenarEntrega = (entregaId: string, novaOrdem: number) => {
    const entregaAtual = entregasOrganizadas.find(e => e.id === entregaId);
    if (!entregaAtual) return;

    const ordemAtual = entregaAtual.ordem;
    if (ordemAtual === novaOrdem) return;

    const novasEntregas = [...entregasOrganizadas];
    
    // Remove a entrega da posição atual
    const entregaMovida = novasEntregas.splice(ordemAtual - 1, 1)[0];
    
    // Insere na nova posição
    novasEntregas.splice(novaOrdem - 1, 0, entregaMovida);
    
    // Atualiza as ordens de todas as entregas
    const entregasAtualizadas = novasEntregas.map((entrega, index) => ({
      ...entrega,
      ordem: index + 1
    }));

    setEntregasOrganizadas(entregasAtualizadas);
    toast.success(`${entregaAtual.clienteNome} movido para posição ${novaOrdem}`);
  };

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoGerado);
      toast.success("Texto copiado para a área de transferência!");
    } catch (error) {
      console.error('Erro ao copiar:', error);
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
              <div className="space-y-3">
                {entregasOrganizadas.map((entrega) => (
                  <Card key={entrega.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-lg text-gray-900">
                            {String(entrega.ordem).padStart(2, '0')}. {entrega.clienteNome}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {!entrega.googleMapsLink && (
                              <div className="flex items-center gap-1 text-red-600 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                Sem endereço
                              </div>
                            )}
                            
                            {/* Dropdown para reordenar */}
                            <Select 
                              value={entrega.ordem.toString()} 
                              onValueChange={(value) => handleReordenarEntrega(entrega.id, parseInt(value))}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <div className="flex items-center gap-1">
                                  <ArrowUpDown className="h-3 w-3" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-white border shadow-lg z-50">
                                {Array.from({ length: entregasOrganizadas.length }, (_, i) => i + 1).map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}º
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Textarea
                          placeholder="Observação (opcional, máx. 200 caracteres)"
                          value={entrega.observacao}
                          onChange={(e) => handleObservacaoChange(entrega.id, e.target.value)}
                          className="min-h-[60px] resize-none"
                          maxLength={200}
                        />
                        
                        <div className="text-sm text-gray-500">
                          {entrega.observacao.length}/200 caracteres
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Painel Direito - Texto Gerado */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Texto para WhatsApp
              </h3>
              <Button onClick={copiarTexto} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <Copy className="h-4 w-4" />
                Copiar Texto
              </Button>
            </div>
            
            <Card className="flex-1 p-4 bg-gray-50 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded-md border shadow-sm h-full">
                  {textoGerado || "Configure as entregas à esquerda para gerar o texto..."}
                </pre>
              </div>
            </Card>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> O texto está formatado para ser colado diretamente no WhatsApp da entregadora.
                Use o dropdown ao lado de cada entrega para alterar a ordem.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
