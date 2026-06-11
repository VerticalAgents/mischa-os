import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ExpedicaoListasModal } from "./ExpedicaoListasModal";
import { SelecaoPedidosImpressaoDialog } from "./SelecaoPedidosImpressaoDialog";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { calcularQuantidadesPadrao, ordenarItensPorOrdemCategoria } from "@/utils/proporcoesPadrao";

interface TrocaPendente {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome?: string;
  motivo?: string; // Fallback para dados antigos
}

interface BonificacaoPendente {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome?: string;
  motivo?: string;
}

interface PrintingActionsProps {
  activeSubTab: string;
  pedidosPadrao: any[];
  pedidosAlterados: any[];
  pedidosProximoDia: any[];
  todosPedidos: any[];
  representantes?: { id: number; nome: string }[];
  /** Quando passado, habilita o toggle de "Gerar vendas no GestãoClick" no modal de seleção */
  onGerarVendasGC?: (pedidoIds: string[]) => Promise<void>;
}

export const PrintingActions = ({ 
  activeSubTab, 
  pedidosPadrao, 
  pedidosAlterados, 
  pedidosProximoDia, 
  todosPedidos,
  representantes = [],
  onGerarVendasGC,
}: PrintingActionsProps) => {
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [modalListasAberto, setModalListasAberto] = useState(false);
  const [modalSelecaoSeparacaoAberto, setModalSelecaoSeparacaoAberto] = useState(false);
  const { proporcoes } = useSupabaseProporoesPadrao();

  const buildProdutosParaExibir = (pedido: any): any[] => {
    const produtos = pedido.itens_personalizados || [];
    const produtosFiltrados = produtos.filter((item: any) => {
      const quantidade = item.quantidade || item.quantidade_sabor || 0;
      return quantidade > 0;
    });
    if (produtosFiltrados.length > 0) {
      return ordenarItensPorOrdemCategoria(produtosFiltrados, proporcoes);
    }

    // Fallback: usar proporção padrão calculada
    const calculados = calcularQuantidadesPadrao(pedido.quantidade_total, proporcoes);
    if (calculados.length > 0) {
      return calculados.map(c => ({
        nome: c.produto_nome,
        quantidade: c.quantidade,
      }));
    }
    return [{ nome: "Distribuição Padrão", quantidade: pedido.quantidade_total }];
  };

  const getListaAtual = () => {
    if (activeSubTab === "padrao") {
      return { lista: pedidosPadrao, tipo: "Pedidos Padrão" };
    } else if (activeSubTab === "alterados") {
      return { lista: pedidosAlterados, tipo: "Pedidos Alterados" };
    } else if (activeSubTab === "proximos") {
      return { lista: pedidosProximoDia, tipo: "Próximas Separações" };
    } else {
      return { lista: todosPedidos, tipo: "Todos os Pedidos" };
    }
  };

  const imprimirListaSeparacao = (pedidosCustom?: any[]) => {
    const { lista: listaPadrao, tipo: tipoLista } = getListaAtual();
    const listaAtual = pedidosCustom ?? listaPadrao;
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para separar nesta categoria.");
      return;
    }
    
    // Verificar se há observações ou trocas em algum pedido
    const temAlgumaObservacao = listaAtual.some(p => p.observacoes_gerais || p.observacoes_agendamento);
    const temAlgumaTroca = listaAtual.some(p => p.trocas_pendentes && p.trocas_pendentes.length > 0);
    const temAlgumaBonificacao = listaAtual.some(p => p.bonificacoes_pendentes && p.bonificacoes_pendentes.length > 0);

    // Calcular larguras das colunas dinamicamente
    const extras = (temAlgumaObservacao ? 1 : 0) + (temAlgumaTroca ? 1 : 0) + (temAlgumaBonificacao ? 1 : 0);
    const extraPct = extras > 0 ? Math.floor(44 / extras) : 0;
    const produtosPct = 50 - (extras * (extraPct - 6));
    const colWidths = {
      cliente: extras > 1 ? '18%' : '20%',
      data: '10%',
      produtos: `${Math.max(28, produtosPct)}%`,
      total: '10%',
      obs: temAlgumaObservacao ? `${extraPct}%` : '0%',
      trocas: temAlgumaTroca ? `${extraPct}%` : '0%',
      bonif: temAlgumaBonificacao ? `${extraPct}%` : '0%',
    };
    
    // Identificar grupos de clientes com mesma razão social
    const razoesSociaisMap = new Map<string, { clientes: string[], nomes: string[] }>();
    listaAtual.forEach(pedido => {
      const razaoSocial = pedido.cliente_razao_social;
      if (razaoSocial && razaoSocial !== '-' && razaoSocial.trim() !== '') {
        const razaoNormalizada = razaoSocial.trim().toLowerCase();
        if (!razoesSociaisMap.has(razaoNormalizada)) {
          razoesSociaisMap.set(razaoNormalizada, { clientes: [], nomes: [] });
        }
        const grupo = razoesSociaisMap.get(razaoNormalizada)!;
        if (!grupo.nomes.includes(pedido.cliente_nome)) {
          grupo.clientes.push(pedido.cliente_nome);
          grupo.nomes.push(pedido.cliente_nome);
        }
      }
    });
    
    // Filtrar apenas grupos com mais de 1 cliente (razão social duplicada)
    const gruposDuplicados: { razaoSocial: string, clientes: string[] }[] = [];
    razoesSociaisMap.forEach((grupo, razaoNormalizada) => {
      if (grupo.clientes.length > 1) {
        // Buscar a razão social original (não normalizada) do primeiro pedido
        const pedidoOriginal = listaAtual.find(p => 
          p.cliente_razao_social?.trim().toLowerCase() === razaoNormalizada
        );
        gruposDuplicados.push({
          razaoSocial: pedidoOriginal?.cliente_razao_social || razaoNormalizada,
          clientes: grupo.clientes
        });
      }
    });
    
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
            .check-cell { width: 28px; text-align: center; vertical-align: middle; }
            .check-box { display: inline-block; width: 14px; height: 14px; border: 1.5px solid #333; border-radius: 2px; }
            .bonif-lista { font-size: 9px; line-height: 1.2; }
            .bonif-item { margin-bottom: 3px; padding: 2px 4px; background-color: #dcfce7; border-left: 2px solid #16a34a; }
            .bonif-produto { font-weight: bold; }
            .bonif-motivo { color: #166534; font-style: italic; font-size: 8px; }
            .grupo-representante-header {
              background-color: #e5e7eb;
              font-weight: bold;
              font-size: 12px;
              padding: 8px 10px;
              border: 1px solid #ddd;
            }
            .aviso-duplicados {
              background-color: #fef3c7;
              border: 2px solid #d97706;
              border-radius: 8px;
              padding: 12px 16px;
              margin-bottom: 20px;
            }
            .aviso-duplicados-titulo {
              font-weight: bold;
              color: #92400e;
              font-size: 13px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .aviso-duplicados-instrucao {
              font-size: 11px;
              color: #78350f;
              margin-bottom: 10px;
              font-style: italic;
            }
            .grupo-duplicado {
              background-color: #fff;
              border: 1px solid #d97706;
              border-radius: 4px;
              padding: 8px 10px;
              margin-bottom: 6px;
            }
            .grupo-razao {
              font-weight: bold;
              font-size: 11px;
              color: #92400e;
              margin-bottom: 4px;
            }
            .grupo-clientes {
              font-size: 10px;
              color: #1f2937;
            }
            .grupo-clientes span {
              display: inline-block;
              background-color: #fef3c7;
              padding: 2px 6px;
              border-radius: 3px;
              margin-right: 6px;
              margin-bottom: 3px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lista de Separação - ${tipoLista}</h1>
            <p>Data de impressão: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</p>
            <p>Total de pedidos: ${listaAtual.length}</p>
          </div>
          
          ${gruposDuplicados.length > 0 ? `
            <div class="aviso-duplicados">
              <div class="aviso-duplicados-titulo">
                ⚠️ ATENÇÃO: Clientes com mesma Razão Social
              </div>
              <div class="aviso-duplicados-instrucao">
                Os clientes abaixo possuem a mesma razão social. Confira o CNPJ nas NFs e boletos antes de grampeá-los nos pacotes.
              </div>
              ${gruposDuplicados.map(grupo => `
                <div class="grupo-duplicado">
                  <div class="grupo-razao">${grupo.razaoSocial}</div>
                  <div class="grupo-clientes">
                    ${grupo.clientes.map(c => `<span>${c}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <table>
            <thead>
              <tr>
                <th style="width: 28px; text-align: center;">✓</th>
                <th style="width: ${colWidths.cliente};">Cliente</th>
                <th style="width: ${colWidths.data};">Data</th>
                <th style="width: ${colWidths.produtos};">Produtos</th>
                <th style="width: ${colWidths.total};">Total</th>
                ${temAlgumaObservacao ? `<th style="width: ${colWidths.obs};">Observações</th>` : ''}
                ${temAlgumaTroca ? `<th style="width: ${colWidths.trocas};">Trocas</th>` : ''}
                ${temAlgumaBonificacao ? `<th style="width: ${colWidths.bonif};">Bonificações</th>` : ''}
              </tr>
            </thead>
            <tbody>
    `;
    
    // Agrupar pedidos por representante
    const gruposRepresentante = new Map<string, any[]>();
    listaAtual.forEach(pedido => {
      const repNome = pedido.representante_id
        ? representantes.find(r => r.id === pedido.representante_id)?.nome || `Representante #${pedido.representante_id}`
        : 'Sem representante';
      if (!gruposRepresentante.has(repNome)) gruposRepresentante.set(repNome, []);
      gruposRepresentante.get(repNome)!.push(pedido);
    });

    // Ordenar: nomes alfabéticos, "Sem representante" por último
    const gruposOrdenados = Array.from(gruposRepresentante.entries()).sort(([a], [b]) => {
      if (a === 'Sem representante') return 1;
      if (b === 'Sem representante') return -1;
      return a.localeCompare(b);
    });

    const totalColunas = 5 + (temAlgumaObservacao ? 1 : 0) + (temAlgumaTroca ? 1 : 0) + (temAlgumaBonificacao ? 1 : 0);

    const renderPedidoRow = (pedido: any) => {
      const produtosParaExibir = buildProdutosParaExibir(pedido);
      
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
      
      let trocasHtml = '';
      if (temAlgumaTroca) {
        const trocasRaw: TrocaPendente[] = pedido.trocas_pendentes || [];
        // Ordenar trocas usando a mesma regra de ordenação dos produtos (ordem das categorias da aba Produtos)
        const trocasParaExibir = trocasRaw.length > 0
          ? (ordenarItensPorOrdemCategoria(
              trocasRaw.map(t => ({ ...t, nome: t.produto_nome })),
              proporcoes
            ) as unknown as TrocaPendente[])
          : trocasRaw;
        trocasHtml = '<td><div class="trocas-lista">';
        if (trocasParaExibir.length > 0) {
          trocasParaExibir.forEach((troca) => {
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

      let bonificacoesHtml = '';
      if (temAlgumaBonificacao) {
        const bonifRaw: BonificacaoPendente[] = pedido.bonificacoes_pendentes || [];
        const bonifParaExibir = bonifRaw.length > 0
          ? (ordenarItensPorOrdemCategoria(
              bonifRaw.map(b => ({ ...b, nome: b.produto_nome })),
              proporcoes
            ) as unknown as BonificacaoPendente[])
          : bonifRaw;
        bonificacoesHtml = '<td><div class="bonif-lista">';
        if (bonifParaExibir.length > 0) {
          bonifParaExibir.forEach((b) => {
            bonificacoesHtml += `
              <div class="bonif-item">
                <span class="bonif-produto">${b.produto_nome}: ${b.quantidade}</span>
                <br/><span class="bonif-motivo">${b.motivo_nome || b.motivo || ''}</span>
              </div>
            `;
          });
        } else {
          bonificacoesHtml += '<span style="color: #999;">-</span>';
        }
        bonificacoesHtml += '</div></td>';
      }

      const razaoSocialDiferente = pedido.cliente_razao_social && 
        pedido.cliente_razao_social !== '-' && 
        pedido.cliente_razao_social.toLowerCase() !== pedido.cliente_nome.toLowerCase();
      
      return `
        <tr>
          <td class="check-cell"><span class="check-box"></span></td>
          <td>
            <strong>${pedido.cliente_nome}</strong>
            ${razaoSocialDiferente ? `<br/><span style="font-size: 9px; color: #555;">${pedido.cliente_razao_social}</span>` : ''}
          </td>
          <td>${formatDate(new Date(pedido.data_prevista_entrega))}</td>
          <td>${produtosHtml}</td>
          <td style="text-align: center; font-weight: bold;">
            ${pedido.quantidade_total}
            ${pedido.tipo_pedido ? `<div style="font-size: 9px; font-weight: normal; color: #555; margin-top: 2px;">${pedido.tipo_pedido}</div>` : ''}
          </td>
          ${observacoesHtml}
          ${trocasHtml}
          ${bonificacoesHtml}
        </tr>
      `;
    };

    gruposOrdenados.forEach(([nomeRep, pedidosGrupo]) => {
      const totalGrupo = pedidosGrupo.reduce((s, p) => s + p.quantidade_total, 0);
      printContent += `
        <tr>
          <td colspan="${totalColunas}" class="grupo-representante-header">
            ${nomeRep} (${pedidosGrupo.length} pedido${pedidosGrupo.length > 1 ? 's' : ''} — ${totalGrupo} un.)
          </td>
        </tr>
      `;
      pedidosGrupo.forEach(pedido => {
        printContent += renderPedidoRow(pedido);
      });
    });
    
    // Adicionar resumo total
    const totalGeral = listaAtual.reduce((sum, pedido) => sum + pedido.quantidade_total, 0);
    const colspanTotal = 4;
    const colspanVazio = (temAlgumaObservacao ? 1 : 0) + (temAlgumaTroca ? 1 : 0) + (temAlgumaBonificacao ? 1 : 0);
    
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

  const imprimirListaDocumentos = () => {
    const { lista: listaAtual, tipo: tipoLista } = getListaAtual();
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para gerar lista de documentos nesta categoria.");
      return;
    }

    // Calcular totais
    let totalNF = 0;
    let totalBoleto = 0;
    let totalFichaA4 = 0;

    listaAtual.forEach(pedido => {
      const precisaNF = pedido.emite_nota_fiscal === true;
      const precisaBoleto = pedido.forma_pagamento?.toUpperCase() === 'BOLETO';
      const precisaFichaA4 = !precisaNF && !precisaBoleto;
      
      if (precisaNF) totalNF++;
      if (precisaBoleto) totalBoleto++;
      if (precisaFichaA4) totalFichaA4++;
    });

    let printContent = `
      <html>
        <head>
          <title>Lista de Documentos - ${tipoLista}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: middle; }
            th { background-color: #f2f2f2; font-weight: bold; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .check { text-align: center; font-size: 16px; color: #16a34a; font-weight: bold; }
            .dash { text-align: center; color: #9ca3af; }
            .instrucoes {
              background-color: #dbeafe;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 12px 16px;
              margin-bottom: 20px;
            }
            .instrucoes-titulo {
              font-weight: bold;
              color: #1e40af;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .instrucoes-texto {
              font-size: 11px;
              color: #1e3a8a;
            }
            .totais {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .razao-social {
              font-size: 10px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lista de Documentos - ${tipoLista}</h1>
            <p>Data de impressão: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</p>
            <p>Total de pedidos: ${listaAtual.length}</p>
          </div>
          
          <div class="instrucoes">
            <div class="instrucoes-titulo">
              📋 INSTRUÇÕES DE IMPRESSÃO
            </div>
            <div class="instrucoes-texto">
              Esta lista indica quais documentos devem ser impressos para cada cliente no GestãoClick.<br/>
              <strong>• NF:</strong> Imprimir Nota Fiscal se marcado com ✓<br/>
              <strong>• Boleto:</strong> Imprimir Boleto se marcado com ✓<br/>
              <strong>• Ficha A4:</strong> Imprimir a Ficha da Venda (A4) somente quando não há NF nem Boleto, para ter um documento no pacote.
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 35%;">Cliente</th>
                <th style="width: 35%;">Razão Social</th>
                <th style="width: 10%; text-align: center;">NF</th>
                <th style="width: 10%; text-align: center;">Boleto</th>
                <th style="width: 10%; text-align: center;">Ficha A4</th>
              </tr>
            </thead>
            <tbody>
    `;

    listaAtual.forEach(pedido => {
      const precisaNF = pedido.emite_nota_fiscal === true;
      const precisaBoleto = pedido.forma_pagamento?.toUpperCase() === 'BOLETO';
      const precisaFichaA4 = !precisaNF && !precisaBoleto;
      
      printContent += `
        <tr>
          <td><strong>${pedido.cliente_nome}</strong></td>
          <td class="razao-social">${pedido.cliente_razao_social || '-'}</td>
          <td class="${precisaNF ? 'check' : 'dash'}">${precisaNF ? '✓' : '-'}</td>
          <td class="${precisaBoleto ? 'check' : 'dash'}">${precisaBoleto ? '✓' : '-'}</td>
          <td class="${precisaFichaA4 ? 'check' : 'dash'}">${precisaFichaA4 ? '✓' : '-'}</td>
        </tr>
      `;
    });

    printContent += `
            </tbody>
            <tfoot>
              <tr class="totais">
                <td colspan="2" style="text-align: right; padding-right: 10px;">TOTAIS:</td>
                <td style="text-align: center;">${totalNF}</td>
                <td style="text-align: center;">${totalBoleto}</td>
                <td style="text-align: center;">${totalFichaA4}</td>
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
          toast.success("A lista de documentos foi enviada para impressão.");
        }, 500);
      }
    }
  };

  const handleSelectLista = (tipo: 'separacao' | 'documentos') => {
    if (tipo === 'separacao') {
      setModalSelecaoSeparacaoAberto(true);
    } else {
      imprimirListaDocumentos();
    }
  };
  
  const imprimirEtiquetas = () => {
    const { lista: listaAtual } = getListaAtual();
    
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
      const produtosParaExibir = buildProdutosParaExibir(pedido);
      
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

  const { lista: listaParaModal } = getListaAtual();
  const { tipo: tipoListaAtual } = getListaAtual();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setModalListasAberto(true)}
        className="group flex flex-1 items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg text-foreground/70 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all text-left"
      >
        <Printer className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-amber-500 transition-colors" strokeWidth={1.5} />
        Listas de Expedição
      </button>

      <button
        type="button"
        onClick={imprimirEtiquetas}
        className="group flex flex-1 items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg text-foreground/70 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all text-left"
      >
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-amber-500 transition-colors" strokeWidth={1.5} />
        Etiquetas
      </button>
      
      {/* IFrame invisível para impressão */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} />

      {/* Modal de seleção de listas */}
      <ExpedicaoListasModal
        open={modalListasAberto}
        onOpenChange={setModalListasAberto}
        onSelectLista={handleSelectLista}
        totalPedidos={listaParaModal.length}
      />

      {/* Modal de seleção de pedidos para imprimir Lista de Separação */}
      <SelecaoPedidosImpressaoDialog
        open={modalSelecaoSeparacaoAberto}
        onOpenChange={setModalSelecaoSeparacaoAberto}
        pedidos={listaParaModal}
        tipoLista={tipoListaAtual}
        podeGerarVendasGC={!!onGerarVendasGC}
        onConfirm={async (pedidosSelecionados, gerarVendasGC) => {
          if (gerarVendasGC && onGerarVendasGC) {
            const semVenda = pedidosSelecionados
              .filter((p: any) => !p.gestaoclick_venda_id)
              .map((p: any) => String(p.id));
            if (semVenda.length > 0) {
              try {
                await onGerarVendasGC(semVenda);
              } catch (e) {
                toast.error("Erro ao gerar vendas no GestãoClick. A impressão foi cancelada.");
                return;
              }
            }
          }
          imprimirListaSeparacao(pedidosSelecionados);
        }}
      />
    </div>
  );
};
