import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import PedidoCard from "./PedidoCard";
import EditarAgendamentoDialog from "../agendamento/EditarAgendamentoDialog";
import { toast } from "sonner";
import { Printer, FileText, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const SeparacaoPedidos = () => {
  const [activeSubTab, setActiveSubTab] = useState<string>("todos");
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<any>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const mountedRef = useRef(false);
  
  const {
    pedidos,
    isLoading,
    confirmarSeparacao,
    desfazerSeparacao,
    marcarTodosSeparados,
    getPedidosParaSeparacao,
    getPedidosProximoDia,
    carregarPedidos
  } = useExpedicaoStore();

  const { produtos } = useProdutoStore();
  const { agendamentos, atualizarAgendamento, carregarAgendamentos } = useAgendamentoClienteStore();

  // Usar hook de sincronização
  useExpedicaoSync();

  // Carregar pedidos apenas uma vez ao montar
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      console.log('🔄 Carregando pedidos inicial da SeparacaoPedidos');
      carregarPedidos();
      carregarAgendamentos();
    }
  }, [carregarPedidos, carregarAgendamentos]);

  // Função para converter pedido da expedição para o formato esperado pelo PedidoCard
  const converterPedidoParaCard = (pedidoExpedicao: any) => {
    console.log('🔄 Convertendo pedido da expedição:', pedidoExpedicao);
    
    // Criar lista de itens do pedido com nomes corretos dos produtos
    let itensPedido: any[] = [];
    
    if (pedidoExpedicao.itens_personalizados && pedidoExpedicao.itens_personalizados.length > 0) {
      // Pedido alterado - usar itens personalizados
      itensPedido = pedidoExpedicao.itens_personalizados.map((item: any, index: number) => ({
        id: index,
        idPedido: Number(pedidoExpedicao.id),
        idSabor: index,
        nomeSabor: item.produto || item.nome || `Produto ${index}`, // Usar nome correto do produto
        quantidadeSabor: item.quantidade,
        sabor: { nome: item.produto || item.nome || `Produto ${index}` }
      }));
    } else {
      // Pedido padrão - usar distribuição baseada nos produtos cadastrados
      const quantidadePorProduto = Math.floor(pedidoExpedicao.quantidade_total / Math.max(1, produtos.length));
      const resto = pedidoExpedicao.quantidade_total % Math.max(1, produtos.length);
      
      itensPedido = produtos.slice(0, Math.min(produtos.length, 5)).map((produto, index) => ({
        id: index,
        idPedido: Number(pedidoExpedicao.id),
        idSabor: produto.id,
        nomeSabor: produto.nome, // Usar nome real do produto
        quantidadeSabor: quantidadePorProduto + (index < resto ? 1 : 0),
        sabor: { nome: produto.nome }
      }));
    }

    console.log('📦 Itens do pedido convertidos:', itensPedido);

    return {
      id: Number(pedidoExpedicao.id),
      idCliente: pedidoExpedicao.cliente_id,
      dataPedido: new Date(pedidoExpedicao.data_prevista_entrega),
      dataPrevistaEntrega: new Date(pedidoExpedicao.data_prevista_entrega),
      statusPedido: 'Agendado' as const,
      substatusPedido: (pedidoExpedicao.substatus_pedido || 'Agendado') as any,
      tipoPedido: pedidoExpedicao.tipo_pedido as any,
      itensPedido,
      totalPedidoUnidades: pedidoExpedicao.quantidade_total,
      cliente: {
        id: pedidoExpedicao.cliente_id,
        nome: pedidoExpedicao.cliente_nome,
        enderecoEntrega: pedidoExpedicao.cliente_endereco || '',
        quantidadePadrao: 0,
        periodicidadePadrao: 7,
        statusCliente: 'Ativo' as const,
        dataCadastro: new Date(),
        ultimaDataReposicaoEfetiva: null,
        proximaDataReposicao: null,
        observacoes: '',
        instrucoesEntrega: '',
        cnpjCpf: '',
        emiteNotaFiscal: true,
        ativo: true,
        contabilizarGiroMedio: true,
        tipoLogistica: 'Própria' as const,
        tipoCobranca: 'À vista' as const,
        formaPagamento: 'Boleto' as const,
        categoriaId: 1,
        subcategoriaId: 1
      }
    };
  };

  const handleEditarAgendamento = (pedidoId: string) => {
    console.log('🔧 Editando agendamento para pedido ID:', pedidoId);
    
    // Buscar o agendamento correspondente
    const agendamento = agendamentos.find(a => a.id === pedidoId);
    
    if (agendamento) {
      // Converter para o formato esperado pelo modal
      const agendamentoFormatado = {
        id: agendamento.id,
        cliente: {
          id: agendamento.cliente_id,
          nome: agendamento.cliente_nome,
          quantidadePadrao: agendamento.quantidade_total
        },
        dataReposicao: new Date(agendamento.data_proxima_reposicao),
        pedido: {
          totalPedidoUnidades: agendamento.quantidade_total
        }
      };
      
      setAgendamentoParaEditar(agendamentoFormatado);
      setModalEditarAberto(true);
    } else {
      toast.error("Agendamento não encontrado");
    }
  };

  const handleSalvarAgendamento = async (agendamentoAtualizado: any) => {
    try {
      console.log('💾 Salvando agendamento atualizado:', agendamentoAtualizado);
      
      await atualizarAgendamento(agendamentoAtualizado.id, {
        data_proxima_reposicao: agendamentoAtualizado.dataReposicao,
        quantidade_total: agendamentoAtualizado.pedido?.totalPedidoUnidades || agendamentoAtualizado.cliente.quantidadePadrao
      });
      
      // Recarregar dados após atualização
      await carregarPedidos();
      await carregarAgendamentos();
      
      toast.success("Agendamento atualizado com sucesso!");
      setModalEditarAberto(false);
      setAgendamentoParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error("Erro ao atualizar agendamento");
    }
  };
  
  // Obter pedidos filtrados
  const pedidosParaSeparacao = getPedidosParaSeparacao();
  const pedidosProximoDia = getPedidosProximoDia();
  
  // Separar por tipo
  const pedidosPadrao = pedidosParaSeparacao.filter(p => p.tipo_pedido === "Padrão");
  const pedidosAlterados = pedidosParaSeparacao.filter(p => p.tipo_pedido === "Alterado");
  
  // Lista combinada para "todos"
  const todosPedidos = [...pedidosPadrao, ...pedidosAlterados];

  const marcarTodosComoSeparados = async () => {
    let listaAtual: any[] = [];
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadrao;
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlterados;
    } else if (activeSubTab === "proximos") {
      listaAtual = pedidosProximoDia;
    } else {
      listaAtual = todosPedidos;
    }
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para separar nesta categoria.");
      return;
    }
    
    await marcarTodosSeparados(listaAtual);
  };

  const imprimirListaSeparacao = () => {
    let listaAtual: any[] = [];
    let tipoLista = "";
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadrao;
      tipoLista = "Pedidos Padrão";
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlterados;
      tipoLista = "Pedidos Alterados";
    } else if (activeSubTab === "proximos") {
      listaAtual = pedidosProximoDia;
      tipoLista = "Próximas Separações";
    } else {
      listaAtual = todosPedidos;
      tipoLista = "Todos os Pedidos";
    }
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para separar nesta categoria.");
      return;
    }
    
    let printContent = `
      <html>
        <head>
          <title>Lista de Separação - ${tipoLista}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { text-align: center; margin-bottom: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .produtos-lista { font-size: 11px; line-height: 1.3; }
            .produto-item { margin-bottom: 2px; display: flex; justify-content: space-between; }
            .produto-nome { flex: 1; }
            .produto-qtd { font-weight: bold; margin-left: 10px; }
            .total-geral { border-top: 1px solid #ccc; padding-top: 2px; margin-top: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lista de Separação - ${tipoLista}</h1>
            <p>Data de impressão: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</p>
            <p>Total de pedidos: ${listaAtual.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Cliente</th>
                <th style="width: 15%;">Data Entrega</th>
                <th style="width: 10%;">Tipo</th>
                <th style="width: 40%;">Produtos e Quantidades</th>
                <th style="width: 10%;">Total</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    listaAtual.forEach(pedido => {
      const produtos = pedido.itens_personalizados || [];
      const produtosParaExibir = produtos.length > 0 ? produtos : [
        { nome: "Distribuição Padrão", quantidade: pedido.quantidade_total }
      ];
      
      let produtosHtml = '<div class="produtos-lista">';
      produtosParaExibir.forEach((item: any) => {
        produtosHtml += `
          <div class="produto-item">
            <span class="produto-nome">${item.nome || item.produto || item.sabor || 'Produto'}</span>
            <span class="produto-qtd">${item.quantidade || item.quantidade_sabor || 0}</span>
          </div>
        `;
      });
      
      if (produtosParaExibir.length > 1) {
        produtosHtml += `
          <div class="produto-item total-geral">
            <span class="produto-nome">TOTAL</span>
            <span class="produto-qtd">${pedido.quantidade_total}</span>
          </div>
        `;
      }
      
      produtosHtml += '</div>';
      
      printContent += `
        <tr>
          <td><strong>${pedido.cliente_nome}</strong></td>
          <td>${formatDate(new Date(pedido.data_prevista_entrega))}</td>
          <td>${pedido.tipo_pedido}</td>
          <td>${produtosHtml}</td>
          <td style="text-align: center; font-weight: bold;">${pedido.quantidade_total}</td>
        </tr>
      `;
    });
    
    // Adicionar resumo total
    const totalGeral = listaAtual.reduce((sum, pedido) => sum + pedido.quantidade_total, 0);
    
    printContent += `
            </tbody>
            <tfoot>
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL GERAL:</td>
                <td style="text-align: center; font-size: 14px;">${totalGeral}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    
    if (printFrameRef.current) {
      const iframe = printFrameRef.current;
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframe.style.height = "0px";
        iframe.style.width = "0px";
        iframe.style.position = "absolute";
        
        iframeWindow.document.open();
        iframeWindow.document.write(printContent);
        iframeWindow.document.close();
        
        setTimeout(() => {
          iframeWindow.print();
          toast.success("A lista de separação foi enviada para impressão.");
        }, 500);
      }
    }
  };
  
  const imprimirEtiquetas = () => {
    let listaAtual: any[] = [];
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadrao;
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlterados;
    } else {
      listaAtual = todosPedidos;
    }
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para gerar etiquetas nesta categoria.");
      return;
    }
    
    let printContent = `
      <html>
        <head>
          <title>Etiquetas de Pedidos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .etiqueta {
              width: 4in;
              height: 2.5in;
              padding: 0.2in;
              margin: 0.1in;
              border: 1px dashed #aaa;
              page-break-inside: avoid;
              display: inline-block;
              box-sizing: border-box;
            }
            .cliente { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .data { margin-bottom: 5px; font-size: 12px; }
            .produtos { font-size: 10px; margin-bottom: 5px; max-height: 0.8in; overflow: hidden; }
            .produto-linha { display: flex; justify-content: space-between; margin-bottom: 1px; }
            .total-etiqueta { font-size: 12px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 2px; }
            .detalhes { font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
    `;
    
    listaAtual.forEach(pedido => {
      const produtos = pedido.itens_personalizados || [];
      const produtosParaExibir = produtos.length > 0 ? produtos : [
        { nome: "Distribuição Padrão", quantidade: pedido.quantidade_total }
      ];
      
      let produtosHtml = '';
      produtosParaExibir.forEach((item: any) => {
        produtosHtml += `
          <div class="produto-linha">
            <span>${(item.nome || item.produto || item.sabor || 'Produto').substring(0, 25)}</span>
            <span>${item.quantidade || item.quantidade_sabor || 0}</span>
          </div>
        `;
      });
      
      printContent += `
        <div class="etiqueta">
          <div class="cliente">${pedido.cliente_nome}</div>
          <div class="data">Entrega: ${formatDate(new Date(pedido.data_prevista_entrega))}</div>
          <div class="produtos">${produtosHtml}</div>
          <div class="total-etiqueta">Total: ${pedido.quantidade_total} unidades</div>
          <div class="detalhes">Pedido - ${pedido.tipo_pedido}</div>
        </div>
      `;
    });
    
    printContent += `
        </body>
      </html>
    `;
    
    if (printFrameRef.current) {
      const iframe = printFrameRef.current;
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframe.style.height = "0px";
        iframe.style.width = "0px";
        iframe.style.position = "absolute";
        
        iframeWindow.document.open();
        iframeWindow.document.write(printContent);
        iframeWindow.document.close();
        
        setTimeout(() => {
          iframeWindow.print();
          toast.success("As etiquetas foram enviadas para impressão.");
        }, 500);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando pedidos...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Separação de Pedidos</h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={marcarTodosComoSeparados} 
              size="sm" 
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" /> Marcar todos como separados
            </Button>
            <Button onClick={imprimirListaSeparacao} size="sm" variant="outline" className="flex items-center gap-1">
              <Printer className="h-4 w-4" /> Imprimir Lista
            </Button>
            <Button onClick={imprimirEtiquetas} size="sm" variant="outline" className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Imprimir Etiquetas
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="todos" 
          value={activeSubTab}
          onValueChange={setActiveSubTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="todos">Todos os Pedidos ({todosPedidos.length})</TabsTrigger>
            <TabsTrigger value="padrao" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span> Pedidos Padrão ({pedidosPadrao.length})
            </TabsTrigger>
            <TabsTrigger value="alterados" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> Pedidos Alterados ({pedidosAlterados.length})
            </TabsTrigger>
            <TabsTrigger value="proximos" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span> Próximas Separações ({pedidosProximoDia.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos">
            {todosPedidos.length > 0 ? (
              <div className="space-y-4">
                {todosPedidos.map((pedido) => (
                  <PedidoCard 
                    key={pedido.id}
                    pedido={converterPedidoParaCard(pedido)}
                    onMarcarSeparado={confirmarSeparacao}
                    onEditarAgendamento={handleEditarAgendamento}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos agendados para hoje.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="padrao">
            {pedidosPadrao.length > 0 ? (
              <div className="space-y-4">
                {pedidosPadrao.map((pedido) => (
                  <PedidoCard 
                    key={pedido.id}
                    pedido={converterPedidoParaCard(pedido)}
                    onMarcarSeparado={confirmarSeparacao}
                    onEditarAgendamento={handleEditarAgendamento}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos padrão agendados para hoje.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="alterados">
            {pedidosAlterados.length > 0 ? (
              <div className="space-y-4">
                {pedidosAlterados.map((pedido) => (
                  <PedidoCard 
                    key={pedido.id}
                    pedido={converterPedidoParaCard(pedido)}
                    onMarcarSeparado={confirmarSeparacao}
                    onEditarAgendamento={handleEditarAgendamento}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos alterados agendados para hoje.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="proximos">
            {pedidosProximoDia.length > 0 ? (
              <div className="space-y-4">
                {pedidosProximoDia.map((pedido) => (
                  <PedidoCard 
                    key={pedido.id}
                    pedido={converterPedidoParaCard(pedido)}
                    onMarcarSeparado={confirmarSeparacao}
                    onEditarAgendamento={handleEditarAgendamento}
                    showAntecipada={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos pendentes para separação antecipada.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Modal de edição de agendamento */}
      {agendamentoParaEditar && (
        <EditarAgendamentoDialog
          agendamento={agendamentoParaEditar}
          open={modalEditarAberto}
          onOpenChange={setModalEditarAberto}
          onSalvar={handleSalvarAgendamento}
        />
      )}

      {/* IFrame invisível para impressão */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} />
    </div>
  );
};
