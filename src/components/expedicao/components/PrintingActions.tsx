import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface TrocaPendente {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome?: string;
  motivo?: string; // Fallback para dados antigos
}

interface PrintingActionsProps {
  activeSubTab: string;
  pedidosPadrao: any[];
  pedidosAlterados: any[];
  pedidosProximoDia: any[];
  todosPedidos: any[];
}

export const PrintingActions = ({ 
  activeSubTab, 
  pedidosPadrao, 
  pedidosAlterados, 
  pedidosProximoDia, 
  todosPedidos 
}: PrintingActionsProps) => {
  const printFrameRef = useRef<HTMLIFrameElement>(null);

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
    
    // Verificar se há observações ou trocas em algum pedido
    const temAlgumaObservacao = listaAtual.some(p => p.observacoes_gerais || p.observacoes_agendamento);
    const temAlgumaTroca = listaAtual.some(p => p.trocas_pendentes && p.trocas_pendentes.length > 0);
    
    // Calcular larguras das colunas dinamicamente
    let colWidths = {
      cliente: '22%',
      data: '12%',
      tipo: '10%',
      produtos: '40%',
      total: '8%',
      obs: '0%',
      trocas: '0%'
    };
    
    if (temAlgumaObservacao && temAlgumaTroca) {
      colWidths = { cliente: '18%', data: '10%', tipo: '7%', produtos: '30%', total: '6%', obs: '14%', trocas: '15%' };
    } else if (temAlgumaObservacao) {
      colWidths = { cliente: '20%', data: '10%', tipo: '8%', produtos: '32%', total: '8%', obs: '22%', trocas: '0%' };
    } else if (temAlgumaTroca) {
      colWidths = { cliente: '20%', data: '10%', tipo: '8%', produtos: '32%', total: '8%', obs: '0%', trocas: '22%' };
    }
    
    let printContent = `
      <html>
        <head>
          <title>Lista de Separação - ${tipoLista}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; font-weight: bold; font-size: 11px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .produtos-lista { font-size: 10px; line-height: 1.2; }
            .produto-item { margin-bottom: 1px; display: flex; justify-content: space-between; }
            .produto-nome { flex: 1; }
            .produto-qtd { font-weight: bold; margin-left: 8px; }
            .total-geral { border-top: 1px solid #ccc; padding-top: 2px; margin-top: 3px; font-weight: bold; }
            .observacoes { font-size: 9px; line-height: 1.3; }
            .obs-geral { font-weight: bold; margin-bottom: 3px; }
            .obs-temp { font-style: normal; color: #333; }
            .trocas-lista { font-size: 9px; line-height: 1.2; }
            .troca-item { margin-bottom: 3px; padding: 2px 4px; background-color: #fef3c7; border-left: 2px solid #d97706; }
            .troca-produto { font-weight: bold; }
            .troca-motivo { color: #92400e; font-style: italic; font-size: 8px; }
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
                <th style="width: ${colWidths.cliente};">Cliente</th>
                <th style="width: ${colWidths.data};">Data</th>
                <th style="width: ${colWidths.tipo};">Tipo</th>
                <th style="width: ${colWidths.produtos};">Produtos</th>
                <th style="width: ${colWidths.total};">Total</th>
                ${temAlgumaObservacao ? `<th style="width: ${colWidths.obs};">Observações</th>` : ''}
                ${temAlgumaTroca ? `<th style="width: ${colWidths.trocas};">Trocas</th>` : ''}
              </tr>
            </thead>
            <tbody>
    `;
    
    listaAtual.forEach(pedido => {
      const produtos = pedido.itens_personalizados || [];
      
      // Filtrar produtos com quantidade maior que 0
      const produtosFiltrados = produtos.filter((item: any) => {
        const quantidade = item.quantidade || item.quantidade_sabor || 0;
        return quantidade > 0;
      });
      
      const produtosParaExibir = produtosFiltrados.length > 0 ? produtosFiltrados : [
        { nome: "Distribuição Padrão", quantidade: pedido.quantidade_total }
      ];
      
      let produtosHtml = '<div class="produtos-lista">';
      produtosParaExibir.forEach((item: any) => {
        const quantidade = item.quantidade || item.quantidade_sabor || 0;
        produtosHtml += `
          <div class="produto-item">
            <span class="produto-nome">${item.nome || item.produto || item.sabor || 'Produto'}</span>
            <span class="produto-qtd">${quantidade}</span>
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
      
      // Montar HTML das observações (fixas em negrito, temporárias normal)
      let observacoesHtml = '';
      if (temAlgumaObservacao) {
        observacoesHtml = '<td><div class="observacoes">';
        if (pedido.observacoes_gerais) {
          observacoesHtml += `<div class="obs-geral">${pedido.observacoes_gerais}</div>`;
        }
        if (pedido.observacoes_agendamento) {
          observacoesHtml += `<div class="obs-temp">${pedido.observacoes_agendamento}</div>`;
        }
        if (!pedido.observacoes_gerais && !pedido.observacoes_agendamento) {
          observacoesHtml += '<span style="color: #999;">-</span>';
        }
        observacoesHtml += '</div></td>';
      }
      
      // Montar HTML das trocas pendentes
      let trocasHtml = '';
      if (temAlgumaTroca) {
        const trocasPendentes: TrocaPendente[] = pedido.trocas_pendentes || [];
        trocasHtml = '<td><div class="trocas-lista">';
        if (trocasPendentes.length > 0) {
          trocasPendentes.forEach((troca) => {
            trocasHtml += `
              <div class="troca-item">
                <span class="troca-produto">${troca.produto_nome}: ${troca.quantidade}</span>
                <br/><span class="troca-motivo">${troca.motivo_nome || troca.motivo}</span>
              </div>
            `;
          });
        } else {
          trocasHtml += '<span style="color: #999;">-</span>';
        }
        trocasHtml += '</div></td>';
      }
      
      // Montar HTML do cliente com razão social
      const razaoSocialDiferente = pedido.cliente_razao_social && 
        pedido.cliente_razao_social !== '-' && 
        pedido.cliente_razao_social.toLowerCase() !== pedido.cliente_nome.toLowerCase();
      
      printContent += `
        <tr>
          <td>
            <strong>${pedido.cliente_nome}</strong>
            ${razaoSocialDiferente ? `<br/><span style="font-size: 9px; color: #555;">${pedido.cliente_razao_social}</span>` : ''}
          </td>
          <td>${formatDate(new Date(pedido.data_prevista_entrega))}</td>
          <td>${pedido.tipo_pedido}</td>
          <td>${produtosHtml}</td>
          <td style="text-align: center; font-weight: bold;">${pedido.quantidade_total}</td>
          ${observacoesHtml}
          ${trocasHtml}
        </tr>
      `;
    });
    
    // Adicionar resumo total
    const totalGeral = listaAtual.reduce((sum, pedido) => sum + pedido.quantidade_total, 0);
    const colspanTotal = 4;
    const colspanVazio = (temAlgumaObservacao ? 1 : 0) + (temAlgumaTroca ? 1 : 0);
    
    printContent += `
            </tbody>
            <tfoot>
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="${colspanTotal}" style="text-align: right; padding-right: 10px;">TOTAL GERAL:</td>
                <td style="text-align: center; font-size: 14px;">${totalGeral}</td>
                ${colspanVazio > 0 ? `<td colspan="${colspanVazio}"></td>` : ''}
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
            .produtos { font-size: 10px; margin-bottom: 5px; max-height: 0.6in; overflow: hidden; }
            .produto-linha { display: flex; justify-content: space-between; margin-bottom: 1px; }
            .total-etiqueta { font-size: 12px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 2px; }
            .detalhes { font-size: 10px; color: #666; }
            .trocas-badge { 
              background-color: #fef3c7; 
              color: #92400e; 
              font-size: 9px; 
              padding: 2px 6px; 
              border-radius: 3px; 
              margin-top: 4px; 
              display: inline-block;
              border: 1px solid #d97706;
            }
            .obs-badge {
              background-color: #e0f2fe;
              color: #0369a1;
              font-size: 8px;
              padding: 2px 4px;
              border-radius: 2px;
              margin-top: 2px;
              display: block;
              max-height: 0.3in;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
    `;
    
    listaAtual.forEach(pedido => {
      const produtos = pedido.itens_personalizados || [];
      
      // Filtrar produtos com quantidade maior que 0
      const produtosFiltrados = produtos.filter((item: any) => {
        const quantidade = item.quantidade || item.quantidade_sabor || 0;
        return quantidade > 0;
      });
      
      const produtosParaExibir = produtosFiltrados.length > 0 ? produtosFiltrados : [
        { nome: "Distribuição Padrão", quantidade: pedido.quantidade_total }
      ];
      
      let produtosHtml = '';
      produtosParaExibir.forEach((item: any) => {
        const quantidade = item.quantidade || item.quantidade_sabor || 0;
        produtosHtml += `
          <div class="produto-linha">
            <span>${(item.nome || item.produto || item.sabor || 'Produto').substring(0, 25)}</span>
            <span>${quantidade}</span>
          </div>
        `;
      });
      
      // Indicador de trocas pendentes
      const trocasPendentes: TrocaPendente[] = pedido.trocas_pendentes || [];
      let trocasBadgeHtml = '';
      if (trocasPendentes.length > 0) {
        const totalTrocas = trocasPendentes.reduce((sum, t) => sum + t.quantidade, 0);
        trocasBadgeHtml = `<div class="trocas-badge">⚠️ ${trocasPendentes.length} troca(s) - ${totalTrocas} un.</div>`;
      }
      
      // Indicador de observações
      let obsBadgeHtml = '';
      const temObs = pedido.observacoes_gerais || pedido.observacoes_agendamento;
      if (temObs) {
        const obsTexto = (pedido.observacoes_agendamento || pedido.observacoes_gerais || '').substring(0, 50);
        obsBadgeHtml = `<div class="obs-badge">📝 ${obsTexto}${obsTexto.length >= 50 ? '...' : ''}</div>`;
      }
      
      // Verificar se razão social é diferente do nome
      const razaoSocialDiferente = pedido.cliente_razao_social && 
        pedido.cliente_razao_social !== '-' && 
        pedido.cliente_razao_social.toLowerCase() !== pedido.cliente_nome.toLowerCase();
      
      printContent += `
        <div class="etiqueta">
          <div class="cliente">${pedido.cliente_nome}</div>
          ${razaoSocialDiferente ? `<div style="font-size: 10px; color: #555; margin-bottom: 3px;">${pedido.cliente_razao_social}</div>` : ''}
          <div class="data">Entrega: ${formatDate(new Date(pedido.data_prevista_entrega))}</div>
          <div class="produtos">${produtosHtml}</div>
          <div class="total-etiqueta">Total: ${pedido.quantidade_total} unidades</div>
          <div class="detalhes">Pedido - ${pedido.tipo_pedido}</div>
          ${trocasBadgeHtml}
          ${obsBadgeHtml}
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

  return (
    <div className="flex items-center gap-2">
      <Button 
        onClick={imprimirListaSeparacao}
        size="sm"
        variant="outline"
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Lista de Separação
      </Button>

      <Button 
        onClick={imprimirEtiquetas}
        size="sm"
        variant="outline"
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Etiquetas
      </Button>
      
      {/* IFrame invisível para impressão */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} />
    </div>
  );
};
