import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, MapPin, User, AlertTriangle, ArrowUpDown, Filter, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EntregaOrganizada {
  id: string;
  clienteNome: string;
  googleMapsLink?: string;
  observacao: string;
  ordem: number;
  representante?: string;
  tipoCobranca?: string;
  formaPagamento?: string;
  emiteNotaFiscal?: boolean;
  precosCategorias?: Array<{categoria: string, preco: number}>;
}

interface Representante {
  id: number;
  nome: string;
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
  const [entregasFiltradas, setEntregasFiltradas] = useState<EntregaOrganizada[]>([]);
  const [textoGerado, setTextoGerado] = useState("");
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [representanteSelecionado, setRepresentanteSelecionado] = useState<string>("todos");
  const [copiado, setCopiado] = useState(false);

  // Carregar representantes
  useEffect(() => {
    const carregarRepresentantes = async () => {
      const { data } = await supabase
        .from('representantes')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (data) {
        setRepresentantes(data);
      }
    };

    if (open) {
      carregarRepresentantes();
    }
  }, [open]);

  // Inicializar entregas organizadas quando o modal abrir
  useEffect(() => {
    if (open && entregas.length > 0) {
      const carregarDadosCompletos = async () => {
        const entregasComDados: EntregaOrganizada[] = [];
        
        for (const entrega of entregas) {
          // Buscar dados completos do cliente
          const { data: cliente } = await supabase
            .from('clientes')
            .select(`
              representante_id,
              tipo_cobranca,
              forma_pagamento,
              emite_nota_fiscal,
              categorias_habilitadas,
              representantes(nome)
            `)
            .eq('id', entrega.id.replace('agendamento_', ''))
            .single();

          // Buscar preços por categoria se existirem categorias habilitadas
          let precosCategorias: Array<{categoria: string, preco: number}> = [];
          if (cliente?.categorias_habilitadas && Array.isArray(cliente.categorias_habilitadas)) {
            // Convert Json[] to number[] safely
            const categoriasIds = cliente.categorias_habilitadas
              .map(cat => typeof cat === 'number' ? cat : parseInt(String(cat)))
              .filter(id => !isNaN(id));

            if (categoriasIds.length > 0) {
              const { data: precos } = await supabase
                .from('precos_categoria_cliente')
                .select(`
                  categoria_id,
                  preco_unitario,
                  categorias_produto(nome)
                `)
                .eq('cliente_id', entrega.id.replace('agendamento_', ''))
                .in('categoria_id', categoriasIds);

              if (precos) {
                precosCategorias = precos.map(p => ({
                  categoria: (p as any).categorias_produto?.nome || `Categoria ${p.categoria_id}`,
                  preco: p.preco_unitario
                }));
              }
            }
          }

          entregasComDados.push({
            id: entrega.id,
            clienteNome: entrega.cliente_nome,
            googleMapsLink: entrega.link_google_maps,
            observacao: "",
            ordem: entregasComDados.length + 1,
            representante: (cliente as any)?.representantes?.nome || 'Sem representante',
            tipoCobranca: cliente?.tipo_cobranca || 'À vista',
            formaPagamento: cliente?.forma_pagamento || 'Boleto',
            emiteNotaFiscal: cliente?.emite_nota_fiscal ?? true,
            precosCategorias
          });
        }
        
        setEntregasOrganizadas(entregasComDados);
      };

      carregarDadosCompletos();
    }
  }, [open, entregas]);

  // Filtrar entregas por representante
  useEffect(() => {
    if (representanteSelecionado === "todos") {
      setEntregasFiltradas(entregasOrganizadas);
    } else {
      const filtradas = entregasOrganizadas.filter(entrega => 
        entrega.representante === representanteSelecionado
      );
      setEntregasFiltradas(filtradas);
    }
  }, [entregasOrganizadas, representanteSelecionado]);

  // Gerar texto automaticamente quando entregas mudarem
  useEffect(() => {
    const emojis = ['🍫', '✨', '😸'];
    const totalEntregas = entregasFiltradas.length;
    
    let titulo = `📦 ENTREGAS DO DIA - ${totalEntregas} ${totalEntregas === 1 ? 'ENTREGA' : 'ENTREGAS'}`;
    if (representanteSelecionado !== "todos") {
      titulo += ` - ${representanteSelecionado.toUpperCase()}`;
    }
    titulo += '\n' + '='.repeat(40) + '\n\n';

    const texto = entregasFiltradas.map((entrega, index) => {
      const emojiIndex = index % emojis.length;
      const emoji = emojis[emojiIndex];
      
      let textoEntrega = `${emoji} Entrega ${String(index + 1).padStart(2, '0')}: ${entrega.clienteNome}\n\n`;
      
      // Informações de cobrança e pagamento
      textoEntrega += `💰 Cobrança: ${entrega.tipoCobranca}\n`;
      textoEntrega += `💳 Pagamento: ${entrega.formaPagamento}\n`;
      textoEntrega += `🧾 Nota Fiscal: ${entrega.emiteNotaFiscal ? 'SIM' : 'NÃO'}\n`;
      
      // Preços por categoria
      if (entrega.precosCategorias && entrega.precosCategorias.length > 0) {
        textoEntrega += `💲 Preços:\n`;
        entrega.precosCategorias.forEach(preco => {
          textoEntrega += `   • ${preco.categoria}: R$ ${preco.preco.toFixed(2)}\n`;
        });
      }
      
      if (entrega.observacao.trim()) {
        textoEntrega += `\n📝 Obs: ${entrega.observacao}\n`;
      }
      
      if (entrega.googleMapsLink) {
        textoEntrega += `\n📍 Google Maps: ${entrega.googleMapsLink}`;
      } else {
        textoEntrega += `\n📍 Google Maps: ENDEREÇO NÃO CADASTRADO`;
      }
      
      return textoEntrega;
    }).join('\n\n' + '-'.repeat(40) + '\n\n');
    
    setTextoGerado(titulo + texto);
  }, [entregasFiltradas, representanteSelecionado]);

  const handleObservacaoChange = (id: string, observacao: string) => {
    if (observacao.length > 200) return;
    
    setEntregasOrganizadas(prev => 
      prev.map(entrega => 
        entrega.id === id ? { ...entrega, observacao } : entrega
      )
    );
  };

  const handleReordenarEntrega = (entregaId: string, novaOrdem: number) => {
    const entregaAtual = entregasFiltradas.find(e => e.id === entregaId);
    if (!entregaAtual) return;

    const ordemAtual = entregaAtual.ordem;
    if (ordemAtual === novaOrdem) return;

    // Reordenar apenas dentro das entregas filtradas
    const novasEntregasFiltradas = [...entregasFiltradas];
    const entregaMovida = novasEntregasFiltradas.find(e => e.id === entregaId);
    if (!entregaMovida) return;

    // Remove a entrega da posição atual e insere na nova posição
    const entregasReordenadas = novasEntregasFiltradas.filter(e => e.id !== entregaId);
    entregasReordenadas.splice(novaOrdem - 1, 0, entregaMovida);

    // Atualiza as ordens
    const entregasAtualizadas = entregasReordenadas.map((entrega, index) => ({
      ...entrega,
      ordem: index + 1
    }));

    // Atualiza o estado principal mantendo as não filtradas
    setEntregasOrganizadas(prev => {
      const novoEstado = [...prev];
      entregasAtualizadas.forEach(entregaAtualizada => {
        const index = novoEstado.findIndex(e => e.id === entregaAtualizada.id);
        if (index !== -1) {
          novoEstado[index] = entregaAtualizada;
        }
      });
      return novoEstado;
    });

    toast.success(`${entregaAtual.clienteNome} movido para posição ${novaOrdem}`);
  };

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoGerado);
      setCopiado(true);
      toast.success("Texto copiado para a área de transferência!");
      
      // Reset visual feedback after 2 seconds
      setTimeout(() => {
        setCopiado(false);
      }, 2000);
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Lista de Entregas ({entregasFiltradas.length})
              </h3>
              
              {/* Filtro por Representante */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={representanteSelecionado} onValueChange={setRepresentanteSelecionado}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por representante" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    <SelectItem value="todos">Todos os representantes</SelectItem>
                    {representantes.map((rep) => (
                      <SelectItem key={rep.id} value={rep.nome}>
                        {rep.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {entregasFiltradas.map((entrega) => (
                  <Card key={entrega.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <span className="font-medium text-lg text-gray-900">
                              {String(entrega.ordem).padStart(2, '0')}. {entrega.clienteNome}
                            </span>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Rep:</span> {entrega.representante}
                            </div>
                          </div>
                          
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
                                {Array.from({ length: entregasFiltradas.length }, (_, i) => i + 1).map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}º
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Informações adicionais */}
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <div><span className="font-medium">Cobrança:</span> {entrega.tipoCobranca}</div>
                          <div><span className="font-medium">Pagamento:</span> {entrega.formaPagamento}</div>
                          <div><span className="font-medium">Nota Fiscal:</span> {entrega.emiteNotaFiscal ? 'Sim' : 'Não'}</div>
                          {entrega.precosCategorias && entrega.precosCategorias.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium">Preços:</span> {entrega.precosCategorias.map(p => `${p.categoria}: R$ ${p.preco.toFixed(2)}`).join(', ')}
                            </div>
                          )}
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
              <Button 
                onClick={copiarTexto} 
                className={`flex items-center gap-2 transition-colors ${
                  copiado 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {copiado ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Texto
                  </>
                )}
              </Button>
            </div>
            
            <Card className="flex-1 p-4 bg-gray-50 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded-md border shadow-sm h-full min-h-[400px] overflow-y-auto">
                  {textoGerado || "Configure as entregas à esquerda para gerar o texto..."}
                </pre>
              </div>
            </Card>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> O texto está formatado para ser colado diretamente no WhatsApp da entregadora.
                Use o dropdown ao lado de cada entrega para alterar a ordem e o filtro de representante para visualizar entregas específicas.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
