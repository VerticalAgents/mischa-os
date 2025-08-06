
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, MapPin, User, AlertTriangle, ArrowUpDown, Check, Bug } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DebugEntregasModal } from "./DebugEntregasModal";

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
  selecionada: boolean;
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
  const [entregasSelecionadas, setEntregasSelecionadas] = useState<EntregaOrganizada[]>([]);
  const [textoGerado, setTextoGerado] = useState("");
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);

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
        console.log('🔍 Carregando dados completos das entregas:', entregas.length);
        const entregasComDados: EntregaOrganizada[] = [];
        
        for (const entrega of entregas) {
          console.log(`📋 Processando entrega ID: ${entrega.id} - Cliente: ${entrega.cliente_nome}`);
          
          // CORREÇÃO: Buscar dados do cliente separadamente
          const { data: cliente, error: clienteError } = await supabase
            .from('clientes')
            .select(`
              representante_id,
              tipo_cobranca,
              forma_pagamento,
              emite_nota_fiscal,
              categorias_habilitadas
            `)
            .eq('id', entrega.id)
            .maybeSingle();

          if (clienteError) {
            console.error(`❌ Erro ao buscar cliente ${entrega.cliente_nome}:`, clienteError);
          }

          // Buscar nome do representante separadamente se existir representante_id
          let nomeRepresentante = 'Sem representante';
          if (cliente?.representante_id) {
            console.log(`🔍 Buscando representante ID: ${cliente.representante_id} para cliente ${entrega.cliente_nome}`);
            
            const { data: representante, error: repError } = await supabase
              .from('representantes')
              .select('nome')
              .eq('id', cliente.representante_id)
              .maybeSingle();

            if (repError) {
              console.error(`❌ Erro ao buscar representante:`, repError);
            } else if (representante) {
              nomeRepresentante = representante.nome;
              console.log(`✅ Representante encontrado: ${nomeRepresentante}`);
            } else {
              console.warn(`⚠️ Representante não encontrado para ID: ${cliente.representante_id}`);
            }
          }

          console.log(`📊 Dados completos do cliente ${entrega.cliente_nome}:`, {
            representante_id: cliente?.representante_id,
            representante: nomeRepresentante,
            tipo_cobranca: cliente?.tipo_cobranca || 'À vista',
            forma_pagamento: cliente?.forma_pagamento || 'Boleto',
            emite_nota_fiscal: cliente?.emite_nota_fiscal ?? true,
            categorias_habilitadas: cliente?.categorias_habilitadas
          });

          // Buscar preços por categoria se existirem categorias habilitadas
          let precosCategorias: Array<{categoria: string, preco: number}> = [];
          if (cliente?.categorias_habilitadas && Array.isArray(cliente.categorias_habilitadas)) {
            // Convert Json[] to number[] safely
            const categoriasIds = cliente.categorias_habilitadas
              .map(cat => typeof cat === 'number' ? cat : parseInt(String(cat)))
              .filter(id => !isNaN(id));

            console.log(`💰 Buscando preços para categorias [${categoriasIds.join(', ')}] do cliente ${entrega.cliente_nome}`);

            if (categoriasIds.length > 0) {
              const { data: precos, error: precosError } = await supabase
                .from('precos_categoria_cliente')
                .select(`
                  categoria_id,
                  preco_unitario,
                  categorias_produto(nome)
                `)
                .eq('cliente_id', entrega.id)
                .in('categoria_id', categoriasIds);

              if (precosError) {
                console.error(`❌ Erro ao buscar preços do cliente ${entrega.cliente_nome}:`, precosError);
              }

              if (precos) {
                precosCategorias = precos.map(p => ({
                  categoria: (p as any).categorias_produto?.nome || `Categoria ${p.categoria_id}`,
                  preco: p.preco_unitario
                }));
                console.log(`💲 Preços encontrados para ${entrega.cliente_nome}:`, precosCategorias);
              }
            }
          }

          entregasComDados.push({
            id: entrega.id,
            clienteNome: entrega.cliente_nome,
            googleMapsLink: entrega.link_google_maps,
            observacao: "",
            ordem: entregasComDados.length + 1,
            representante: nomeRepresentante,
            tipoCobranca: cliente?.tipo_cobranca || 'À vista',
            formaPagamento: cliente?.forma_pagamento || 'Boleto',
            emiteNotaFiscal: cliente?.emite_nota_fiscal ?? true,
            precosCategorias,
            selecionada: true // Todas as entregas começam selecionadas
          });
        }
        
        console.log('✅ Entregas processadas:', entregasComDados.length);
        setEntregasOrganizadas(entregasComDados);
      };

      carregarDadosCompletos();
    }
  }, [open, entregas]);

  // Filtrar entregas selecionadas
  useEffect(() => {
    const selecionadas = entregasOrganizadas.filter(entrega => entrega.selecionada);
    setEntregasSelecionadas(selecionadas);
  }, [entregasOrganizadas]);

  // Gerar texto automaticamente quando entregas mudarem
  useEffect(() => {
    const emojis = ['🍫', '✨', '😸'];
    const totalEntregas = entregasSelecionadas.length;
    
    let titulo = `📦 ENTREGAS DO DIA - ${totalEntregas} ${totalEntregas === 1 ? 'ENTREGA' : 'ENTREGAS'}`;
    titulo += '\n' + '='.repeat(40) + '\n\n';

    const texto = entregasSelecionadas.map((entrega, index) => {
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
  }, [entregasSelecionadas]);

  const handleObservacaoChange = (id: string, observacao: string) => {
    if (observacao.length > 200) return;
    
    setEntregasOrganizadas(prev => 
      prev.map(entrega => 
        entrega.id === id ? { ...entrega, observacao } : entrega
      )
    );
  };

  const handleSelecionarEntrega = (id: string, selecionada: boolean) => {
    setEntregasOrganizadas(prev => 
      prev.map(entrega => 
        entrega.id === id ? { ...entrega, selecionada } : entrega
      )
    );
  };

  const handleReordenarEntrega = (entregaId: string, novaOrdem: number) => {
    const entregaAtual = entregasSelecionadas.find(e => e.id === entregaId);
    if (!entregaAtual) return;

    const ordemAtual = entregaAtual.ordem;
    if (ordemAtual === novaOrdem) return;

    // Reordenar apenas dentro das entregas selecionadas
    const novasEntregasSelecionadas = [...entregasSelecionadas];
    const entregaMovida = novasEntregasSelecionadas.find(e => e.id === entregaId);
    if (!entregaMovida) return;

    // Remove a entrega da posição atual e insere na nova posição
    const entregasReordenadas = novasEntregasSelecionadas.filter(e => e.id !== entregaId);
    entregasReordenadas.splice(novaOrdem - 1, 0, entregaMovida);

    // Atualiza as ordens
    const entregasAtualizadas = entregasReordenadas.map((entrega, index) => ({
      ...entrega,
      ordem: index + 1
    }));

    // Atualiza o estado principal mantendo as não selecionadas
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

  const debugData = entregasOrganizadas.map(entrega => ({
    id: entrega.id,
    clienteNome: entrega.clienteNome,
    representante: entrega.representante || 'Sem representante',
    tipoCobranca: entrega.tipoCobranca || 'À vista',
    formaPagamento: entrega.formaPagamento || 'Boleto',
    emiteNotaFiscal: entrega.emiteNotaFiscal ?? true
  }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Organizar Entregas do Dia
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDebugModalOpen(true)}
                className="ml-auto"
              >
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Painel Esquerdo - Lista de Entregas */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Lista de Entregas ({entregasOrganizadas.length} total | {entregasSelecionadas.length} selecionadas)
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {entregasOrganizadas.map((entrega) => (
                    <Card key={entrega.id} className={`p-4 ${!entrega.selecionada ? 'opacity-50 bg-gray-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center mt-1">
                          <Checkbox
                            checked={entrega.selecionada}
                            onCheckedChange={(checked) => handleSelecionarEntrega(entrega.id, !!checked)}
                          />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <span className="font-medium text-lg text-gray-900">
                                {entrega.selecionada ? String(entregasSelecionadas.findIndex(e => e.id === entrega.id) + 1).padStart(2, '0') : '--'}. {entrega.clienteNome}
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
                              
                              {/* Dropdown para reordenar - só habilitado se selecionada */}
                              <Select 
                                value={entrega.selecionada ? (entregasSelecionadas.findIndex(e => e.id === entrega.id) + 1).toString() : ''}
                                onValueChange={(value) => handleReordenarEntrega(entrega.id, parseInt(value))}
                                disabled={!entrega.selecionada}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <div className="flex items-center gap-1">
                                    <ArrowUpDown className="h-3 w-3" />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="bg-white border shadow-lg z-50">
                                  {Array.from({ length: entregasSelecionadas.length }, (_, i) => i + 1).map((num) => (
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
                            disabled={!entrega.selecionada}
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
                    {textoGerado || "Selecione as entregas à esquerda para gerar o texto..."}
                  </pre>
                </div>
              </Card>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 <strong>Dica:</strong> Use os checkboxes para selecionar quais entregas incluir no texto.
                  Apenas entregas selecionadas aparecerão no texto do WhatsApp e poderão ter sua ordem alterada.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DebugEntregasModal
        open={debugModalOpen}
        onOpenChange={setDebugModalOpen}
        debugData={debugData}
      />
    </>
  );
};
