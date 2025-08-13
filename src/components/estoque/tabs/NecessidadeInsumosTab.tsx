import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calculator, Download, ShoppingCart, Package, TrendingUp, ChevronDown, ChevronRight, Calendar, Archive, ChefHat, List, BarChart3, CheckCircle2, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNecessidadeInsumos } from "@/hooks/useNecessidadeInsumos";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import jsPDF from 'jspdf';
import { toast } from 'sonner';
export default function NecessidadeInsumosTab() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [filtroInsumo, setFiltroInsumo] = useState("");
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [etapasAbertas, setEtapasAbertas] = useState<Record<number, boolean>>({});
  const {
    necessidadeInsumos,
    resumoCalculo,
    loading,
    calcularNecessidadeInsumos,
    dadosAuditoria
  } = useNecessidadeInsumos();
  const {
    produtos
  } = useSupabaseProdutos();
  const {
    receitas
  } = useSupabaseReceitas();
  const {
    insumos
  } = useSupabaseInsumos();
  const handleCalcular = async () => {
    calcularNecessidadeInsumos(dataInicio, dataFim);
    setMostrarDetalhes(false); // Manter oculto por padrão
  };
  const toggleEtapa = (etapa: number) => {
    setEtapasAbertas(prev => ({
      ...prev,
      [etapa]: !prev[etapa]
    }));
  };
  const exportarCSV = () => {
    if (necessidadeInsumos.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }
    const headers = ['Insumo', 'Unidade', 'Quantidade Necessária (g)', 'Estoque Atual (g)', 'Quantidade a Comprar (g)', 'Volume Bruto por Pacote (g)', 'Pacotes a Comprar', 'Custo Médio por Pacote (R$)', 'Custo Total (R$)'];
    const linhas = necessidadeInsumos.filter(item => !filtroInsumo || item.nomeInsumo.toLowerCase().includes(filtroInsumo.toLowerCase())).map(item => {
      const insumo = insumos.find(i => i.id === item.insumoId);
      const volumeBruto = Number(insumo?.volume_bruto) || 1;
      const pacotesComprar = Math.ceil(item.quantidadeComprar / volumeBruto);
      const custoTotalCorreto = pacotesComprar * item.custoMedio;
      return [`"${item.nomeInsumo}"`, item.unidadeMedida, item.quantidadeNecessaria.toFixed(2), item.estoqueAtual.toFixed(2), item.quantidadeComprar.toFixed(2), volumeBruto.toFixed(0), pacotesComprar.toString(), item.custoMedio.toFixed(2), custoTotalCorreto.toFixed(2)];
    });
    const csvContent = [headers.join(','), ...linhas.map(linha => linha.join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `necessidade-insumos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const exportarPDF = () => {
    const insumosParaComprar = necessidadeInsumos.filter(item => item.quantidadeComprar > 0);
    if (insumosParaComprar.length === 0) {
      toast.error('Nenhum insumo precisa ser comprado');
      return;
    }
    try {
      const doc = new jsPDF();

      // Configurar fonte
      doc.setFont('helvetica');

      // Título
      doc.setFontSize(16);
      doc.text('Lista de Compras - Insumos', 20, 20);

      // Data de geração e período
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', {
        locale: ptBR
      })}`, 20, 30);
      doc.text(`Período: ${format(new Date(dataInicio), 'dd/MM/yyyy')} a ${format(new Date(dataFim), 'dd/MM/yyyy')}`, 20, 35);

      // Resumo
      let yPosition = 50;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPosition += 8;
      doc.text(`Total de insumos a comprar: ${insumosParaComprar.length}`, 25, yPosition);
      const valorTotal = insumosParaComprar.reduce((total, item) => {
        const insumo = insumos.find(i => i.id === item.insumoId);
        const volumeBruto = Number(insumo?.volume_bruto) || 1;
        const pacotesComprar = Math.ceil(item.quantidadeComprar / volumeBruto);
        return total + pacotesComprar * item.custoMedio;
      }, 0);
      yPosition += 6;
      doc.text(`Valor total estimado: R$ ${valorTotal.toFixed(2)}`, 25, yPosition);

      // Cabeçalhos da tabela
      yPosition += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Insumo', 20, yPosition);
      doc.text('Qtd (g)', 80, yPosition);
      doc.text('Pacotes', 110, yPosition);
      doc.text('Custo/Pac', 140, yPosition);
      doc.text('Total', 170, yPosition);

      // Linha separadora
      doc.line(20, yPosition + 2, 190, yPosition + 2);
      yPosition += 8;

      // Dados dos insumos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      insumosParaComprar.forEach((item, index) => {
        if (yPosition > 270) {
          // Nova página se necessário
          doc.addPage();
          yPosition = 20;
        }
        const insumo = insumos.find(i => i.id === item.insumoId);
        const volumeBruto = Number(insumo?.volume_bruto) || 1;
        const pacotesComprar = Math.ceil(item.quantidadeComprar / volumeBruto);
        const custoTotal = pacotesComprar * item.custoMedio;

        // Nome do insumo (truncado se muito longo)
        const nomeInsumo = item.nomeInsumo.length > 25 ? item.nomeInsumo.substring(0, 25) + '...' : item.nomeInsumo;
        doc.text(nomeInsumo, 20, yPosition);

        // Quantidade a comprar
        doc.text(item.quantidadeComprar.toFixed(0), 80, yPosition);

        // Pacotes a comprar
        doc.text(pacotesComprar.toString(), 110, yPosition);

        // Custo por pacote
        doc.text(`R$ ${item.custoMedio.toFixed(2)}`, 140, yPosition);

        // Custo total
        doc.text(`R$ ${custoTotal.toFixed(2)}`, 170, yPosition);
        yPosition += 6;

        // Linha separadora a cada 5 registros
        if ((index + 1) % 5 === 0) {
          doc.line(20, yPosition, 190, yPosition);
          yPosition += 3;
        }
      });

      // Rodapé
      const totalPaginas = doc.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${totalPaginas}`, 20, 285);
        doc.text(`Total de itens: ${insumosParaComprar.length}`, 150, 285);
      }

      // Salvar arquivo
      doc.save(`lista-compras-insumos-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Lista de compras exportada para PDF!');
    } catch (error) {
      console.error('Erro na exportação PDF:', error);
      toast.error('Erro ao exportar para PDF');
    }
  };

  // Calcular dados para as etapas
  const calcularDadosEtapas = () => {
    if (!dadosAuditoria || dadosAuditoria.length === 0) return null;

    // Consolidação por produto
    const quantidadesPorProduto = new Map<string, number>();
    dadosAuditoria.forEach(agendamento => {
      Object.entries(agendamento.quantidadesPorProduto).forEach(([nomeProduto, quantidade]) => {
        const quantidadeNum = Number(quantidade) || 0;
        if (quantidadeNum > 0) {
          const atual = quantidadesPorProduto.get(nomeProduto) || 0;
          quantidadesPorProduto.set(nomeProduto, atual + quantidadeNum);
        }
      });
    });

    // Processar agendamentos
    const agendamentosDetalhados = dadosAuditoria.map(agendamento => ({
      clienteNome: agendamento.clienteNome,
      dataReposicao: agendamento.dataReposicao,
      statusAgendamento: agendamento.statusAgendamento,
      statusCliente: agendamento.statusCliente,
      produtos: Object.entries(agendamento.quantidadesPorProduto).filter(([, quantidade]) => Number(quantidade) > 0).map(([nomeProduto, quantidade]) => ({
        nomeProduto,
        quantidade: Number(quantidade)
      }))
    })).filter(agendamento => agendamento.produtos.length > 0);
    const necessidadeProducao = new Map<string, {
      necessaria: number;
      estoque: number;
      producao: number;
    }>();
    quantidadesPorProduto.forEach((quantidadeNecessaria, nomeProduto) => {
      const produto = produtos.find(p => p.nome === nomeProduto);
      const estoqueAtual = Number(produto?.estoque_atual) || 0;
      const necessidade = Math.max(0, quantidadeNecessaria - estoqueAtual);
      necessidadeProducao.set(nomeProduto, {
        necessaria: quantidadeNecessaria,
        estoque: estoqueAtual,
        producao: necessidade
      });
    });

    // CÁLCULO CORRIGIDO DAS RECEITAS - BROWNIE TRADICIONAL + MINI BROWNIE
    const receitasNecessarias = new Map<string, {
      producao: number;
      receitas: number;
      receita?: any;
      detalhesCalculo?: string;
    }>();
    const brownieTradicionalData = necessidadeProducao.get("Brownie Tradicional");
    const miniBrownieData = necessidadeProducao.get("Mini Brownie Tradicional");

    // Processar Brownie Tradicional (combinado com Mini Brownie)
    if (brownieTradicionalData?.producao > 0 || miniBrownieData?.producao > 0) {
      const receita = receitas.find(r => r.nome === "Brownie Tradicional");
      if (receita) {
        const receitasBrownieTradicional = brownieTradicionalData?.producao > 0 ? Math.ceil(brownieTradicionalData.producao / 40) : 0;
        const receitasMiniBrownie = miniBrownieData?.producao > 0 ? Math.ceil(miniBrownieData.producao * 0.74) : 0;
        const totalReceitas = receitasBrownieTradicional + receitasMiniBrownie;
        let detalhesCalculo = '';
        if (brownieTradicionalData?.producao > 0 && miniBrownieData?.producao > 0) {
          detalhesCalculo = `${brownieTradicionalData.producao} unidades ÷ 40 = ${receitasBrownieTradicional} receitas (brownie tradicional) + ${miniBrownieData.producao} unidades × 0.74 = ${receitasMiniBrownie} receitas (mini brownie) = ${totalReceitas} receitas total`;
        } else if (brownieTradicionalData?.producao > 0) {
          detalhesCalculo = `${brownieTradicionalData.producao} unidades ÷ 40 = ${totalReceitas} receitas`;
        } else if (miniBrownieData?.producao > 0) {
          detalhesCalculo = `${miniBrownieData.producao} unidades × 0.74 = ${totalReceitas} receitas (mini brownie)`;
        }
        receitasNecessarias.set("Brownie Tradicional", {
          producao: (brownieTradicionalData?.producao || 0) + (miniBrownieData?.producao || 0),
          receitas: totalReceitas,
          receita,
          detalhesCalculo
        });
      }
    }

    // Processar outros produtos (exceto Mini Brownie que já foi processado)
    necessidadeProducao.forEach((data, nomeProduto) => {
      if (nomeProduto === "Brownie Tradicional" || nomeProduto === "Mini Brownie Tradicional") {
        return; // Já processados acima
      }
      if (data.producao > 0) {
        const receita = receitas.find(r => r.nome === nomeProduto);
        if (receita) {
          const numeroReceitas = Math.ceil(data.producao / 40);
          receitasNecessarias.set(nomeProduto, {
            producao: data.producao,
            receitas: numeroReceitas,
            receita,
            detalhesCalculo: `${data.producao} unidades ÷ 40 = ${numeroReceitas} receitas`
          });
        }
      }
    });
    const insumosPorReceita = new Map<string, Map<string, {
      quantidade: number;
      unidade: string;
    }>>();
    receitasNecessarias.forEach((data, nomeProduto) => {
      if (data.receita) {
        const insumosReceita = new Map<string, {
          quantidade: number;
          unidade: string;
        }>();
        data.receita.itens.forEach((item: any) => {
          const quantidadeItem = Number(item.quantidade) * data.receitas;
          const insumo = insumos.find(i => i.id === item.insumo_id);
          if (insumo) {
            insumosReceita.set(item.insumo_id, {
              quantidade: quantidadeItem,
              unidade: insumo.unidade_medida
            });
          }
        });
        insumosPorReceita.set(nomeProduto, insumosReceita);
      }
    });
    const consolidacaoInsumos = new Map<string, {
      nome: string;
      quantidade: number;
      unidade: string;
    }>();
    insumosPorReceita.forEach(insumosReceita => {
      insumosReceita.forEach((data, insumoId) => {
        const atual = consolidacaoInsumos.get(insumoId) || {
          nome: '',
          quantidade: 0,
          unidade: ''
        };
        const insumo = insumos.find(i => i.id === insumoId);
        if (insumo) {
          atual.nome = insumo.nome;
          atual.unidade = insumo.unidade_medida;
          atual.quantidade += data.quantidade;
          consolidacaoInsumos.set(insumoId, atual);
        }
      });
    });
    return {
      agendamentosDetalhados,
      agendamentos: Object.fromEntries(quantidadesPorProduto),
      necessidadeProducao: Object.fromEntries(necessidadeProducao),
      receitasNecessarias: Object.fromEntries(receitasNecessarias),
      insumosPorReceita: Object.fromEntries(Array.from(insumosPorReceita.entries()).map(([produto, insumos]) => [produto, Object.fromEntries(insumos)])),
      consolidacaoInsumos: Object.fromEntries(consolidacaoInsumos)
    };
  };
  const dadosEtapas = calcularDadosEtapas();
  const insumosFiltrados = necessidadeInsumos.filter(item => !filtroInsumo || item.nomeInsumo.toLowerCase().includes(filtroInsumo.toLowerCase()));
  const insumosParaComprar = insumosFiltrados.filter(item => item.quantidadeComprar > 0);

  // Calcular valor total corrigido baseado em pacotes
  const valorTotalCorrigido = insumosFiltrados.reduce((total, item) => {
    const insumo = insumos.find(i => i.id === item.insumoId);
    const volumeBruto = Number(insumo?.volume_bruto) || 1;
    const pacotesComprar = Math.ceil(item.quantidadeComprar / volumeBruto);
    return total + pacotesComprar * item.custoMedio;
  }, 0);
  const etapas = [{
    numero: 1,
    titulo: "Leitura dos Agendamentos",
    origem: "Filtro local do período",
    icone: Calendar,
    concluida: !!dadosEtapas?.agendamentos
  }, {
    numero: 2,
    titulo: "Subtração do Estoque de Produtos",
    origem: "Estoque > Produtos",
    icone: Archive,
    concluida: !!dadosEtapas?.necessidadeProducao
  }, {
    numero: 3,
    titulo: "Cálculo das Receitas Necessárias",
    origem: "40 unidades por receita",
    icone: ChefHat,
    concluida: !!dadosEtapas?.receitasNecessarias
  }, {
    numero: 4,
    titulo: "Insumos por Receita",
    origem: "Receitas x Insumos",
    icone: List,
    concluida: !!dadosEtapas?.insumosPorReceita
  }, {
    numero: 5,
    titulo: "Consolidação Total de Insumos",
    origem: "Soma de todos os insumos",
    icone: BarChart3,
    concluida: !!dadosEtapas?.consolidacaoInsumos
  }, {
    numero: 6,
    titulo: "Subtração do Estoque de Insumos",
    origem: "Estoque > Insumos",
    icone: Package,
    concluida: necessidadeInsumos.length > 0
  }];
  return <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Necessidade de Insumos
          </CardTitle>
          <CardDescription>
            Calcule a necessidade de compra de insumos com base nos agendamentos e estoques atuais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[150px]">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input id="data-inicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} disabled={loading} />
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input id="data-fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} disabled={loading} />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtro-insumo">Filtrar Insumo</Label>
              <Input id="filtro-insumo" placeholder="Nome do insumo..." value={filtroInsumo} onChange={e => setFiltroInsumo(e.target.value)} />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCalcular} disabled={loading} className="flex items-center gap-2">
                <Calculator className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Calculando...' : 'Calcular'}
              </Button>
              
              <Button variant="outline" onClick={exportarCSV} disabled={loading || necessidadeInsumos.length === 0} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                CSV
              </Button>

              <Button variant="outline" onClick={exportarPDF} disabled={loading || insumosParaComprar.length === 0} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDF
              </Button>

              {necessidadeInsumos.length > 0 && <Button variant="outline" onClick={() => setMostrarDetalhes(!mostrarDetalhes)} className="flex items-center gap-2">
                  {mostrarDetalhes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {mostrarDetalhes ? 'Ocultar Etapas' : 'Ver Etapas'}
                </Button>}
            </div>
          </div>

          {/* Resumo - Somente 2 blocos visuais */}
          {resumoCalculo && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <ShoppingCart className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-orange-600">{insumosParaComprar.length}</div>
                <div className="text-sm text-muted-foreground">Insumos a Comprar</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  R$ {valorTotalCorrigido.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Valor Total (Pacotes)</div>
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Painel de Etapas Detalhadas */}
      {mostrarDetalhes && necessidadeInsumos.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Etapas do Cálculo
            </CardTitle>
            <CardDescription>
              Acompanhe o passo a passo do cálculo de necessidade de insumos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {etapas.map(etapa => {
          const IconeEtapa = etapa.icone;
          return <Collapsible key={etapa.numero} open={etapasAbertas[etapa.numero]} onOpenChange={() => toggleEtapa(etapa.numero)}>
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapa.concluida ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {etapa.concluida ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-medium">{etapa.numero}</span>}
                            </div>
                            <div>
                              <h4 className="font-medium">{etapa.titulo}</h4>
                              <p className="text-sm text-muted-foreground">Origem: {etapa.origem}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconeEtapa className="h-4 w-4 text-muted-foreground" />
                            {etapasAbertas[etapa.numero] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <Card className="ml-11 mt-2">
                      <CardContent className="pt-4">
                        {etapa.numero === 1 && dadosEtapas?.agendamentos && <div className="space-y-6">
                            {/* Totais Consolidados */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <h5 className="font-medium">Total por Sabor</h5>
                                <Badge variant="secondary">
                                  {Object.keys(dadosEtapas.agendamentos).length} sabores
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(dadosEtapas.agendamentos).map(([produto, quantidade]) => <div key={produto} className="flex justify-between p-3 bg-blue-50 rounded border">
                                    <span className="text-sm font-medium">{produto}</span>
                                    <Badge variant="default">{Number(quantidade)} unidades</Badge>
                                  </div>)}
                              </div>
                            </div>

                            {/* Lista Detalhada de Agendamentos */}
                            {dadosEtapas.agendamentosDetalhados && <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <h5 className="font-medium">Agendamentos Incluídos no Cálculo</h5>
                                  <Badge variant="outline">
                                    {dadosEtapas.agendamentosDetalhados.length} agendamentos
                                  </Badge>
                                </div>
                                <div className="max-h-80 overflow-y-auto border rounded-lg">
                                  <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                      <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Status Agendamento</TableHead>
                                        <TableHead>Status Cliente</TableHead>
                                        <TableHead>Produtos</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {dadosEtapas.agendamentosDetalhados.map((agendamento, index) => <TableRow key={index}>
                                          <TableCell className="font-medium text-sm">
                                            {agendamento.clienteNome}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {format(new Date(agendamento.dataReposicao), "dd/MM/yyyy", {
                                  locale: ptBR
                                })}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={agendamento.statusAgendamento === 'Agendado' ? 'default' : 'secondary'} className="text-xs">
                                              {agendamento.statusAgendamento}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={agendamento.statusCliente === 'Ativo' ? 'default' : 'outline'} className="text-xs">
                                              {agendamento.statusCliente}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              {agendamento.produtos.map((produto, prodIndex) => <div key={prodIndex} className="flex justify-between text-xs bg-gray-50 p-1 rounded">
                                                  <span>{produto.nomeProduto}</span>
                                                  <span className="font-medium">{produto.quantidade}</span>
                                                </div>)}
                                            </div>
                                          </TableCell>
                                        </TableRow>)}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>}
                          </div>}

                        {etapa.numero === 2 && dadosEtapas?.necessidadeProducao && <div>
                            <h5 className="font-medium mb-3">Necessidade de Produção</h5>
                            <div className="space-y-2">
                              {Object.entries(dadosEtapas.necessidadeProducao).map(([produto, dados]) => <div key={produto} className="p-3 border rounded-lg">
                                  <div className="font-medium">{produto}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Necessário: {dados.necessaria} - Estoque: {dados.estoque} = 
                                    <span className="font-medium text-foreground"> {dados.producao} a produzir</span>
                                  </div>
                                </div>)}
                            </div>
                          </div>}

                        {etapa.numero === 3 && dadosEtapas?.receitasNecessarias && <div>
                            <h5 className="font-medium mb-3">Receitas Necessárias (40 unidades/receita)</h5>
                            <div className="space-y-2">
                              {Object.entries(dadosEtapas.receitasNecessarias).map(([produto, dados]) => <div key={produto} className="p-3 border rounded-lg">
                                  <div className="font-medium">{produto}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {dados.detalhesCalculo || `${dados.producao} unidades ÷ 40 = ${dados.receitas} receitas`}
                                  </div>
                                  {produto === "Brownie Tradicional" && dados.detalhesCalculo?.includes('mini brownie') && <div className="text-xs text-blue-600 mt-1 font-medium">
                                      ✓ Cálculo combinado: Brownie Tradicional + Mini Brownie Tradicional
                                    </div>}
                                </div>)}
                            </div>
                          </div>}

                        {etapa.numero === 4 && dadosEtapas?.insumosPorReceita && <div>
                            <h5 className="font-medium mb-3">Insumos por Receita</h5>
                            <div className="space-y-3">
                              {Object.entries(dadosEtapas.insumosPorReceita).map(([produto, insumosData]) => <div key={produto} className="p-3 border rounded-lg">
                                  <div className="font-medium mb-2">{produto}</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(insumosData as Record<string, {
                            quantidade: number;
                            unidade: string;
                          }>).map(([insumoId, dados]) => {
                            const insumo = insumos.find(i => i.id === insumoId);
                            return <div key={insumoId} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                                          <span>{insumo?.nome || 'Insumo não encontrado'}</span>
                                          <span>{dados.quantidade.toFixed(2)} {dados.unidade}</span>
                                        </div>;
                          })}
                                  </div>
                                </div>)}
                            </div>
                          </div>}

                        {etapa.numero === 5 && dadosEtapas?.consolidacaoInsumos && <div>
                            <h5 className="font-medium mb-3">Consolidação Total</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {Object.entries(dadosEtapas.consolidacaoInsumos as Record<string, {
                        nome: string;
                        quantidade: number;
                        unidade: string;
                      }>).map(([insumoId, dados]) => <div key={insumoId} className="flex justify-between p-2 bg-green-50 rounded">
                                  <span className="text-sm">{dados.nome}</span>
                                  <Badge variant="outline">{dados.quantidade.toFixed(2)} {dados.unidade}</Badge>
                                </div>)}
                            </div>
                          </div>}

                        {etapa.numero === 6 && necessidadeInsumos.length > 0 && <div>
                            <h5 className="font-medium mb-3">Resultado Final (Necessário - Estoque)</h5>
                            <div className="space-y-2">
                              {necessidadeInsumos.slice(0, 5).map(item => <div key={item.insumoId} className="p-3 border rounded-lg">
                                  <div className="font-medium">{item.nomeInsumo}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Necessário: {item.quantidadeNecessaria.toFixed(2)} - 
                                    Estoque: {item.estoqueAtual.toFixed(2)} = 
                                    <span className={`font-medium ${item.quantidadeComprar > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {item.quantidadeComprar > 0 ? ` ${item.quantidadeComprar.toFixed(2)} a comprar` : ' OK'}
                                    </span>
                                  </div>
                                </div>)}
                              {necessidadeInsumos.length > 5 && <div className="text-center text-sm text-muted-foreground">
                                  ... e mais {necessidadeInsumos.length - 5} insumos
                                </div>}
                            </div>
                          </div>}
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>;
        })}
          </CardContent>
        </Card>}

      {/* Tabela de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Necessidade de Compra</CardTitle>
          <CardDescription className="text-left">
            Lista de insumos que precisam ser comprados para atender a demanda (cálculo baseado em pacotes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-lg">Calculando necessidades...</p>
              </div>
            </div> : necessidadeInsumos.length === 0 ? <Alert>
              <AlertDescription>
                Nenhum resultado encontrado. Clique em "Calcular" para processar os dados do período selecionado.
              </AlertDescription>
            </Alert> : <>
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="secondary">
                  {insumosFiltrados.length} insumos encontrados
                </Badge>
                <Badge variant="outline">
                  {insumosParaComprar.length} precisam ser comprados
                </Badge>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Necessário (g)</TableHead>
                      <TableHead className="text-right">Estoque (g)</TableHead>
                      <TableHead className="text-right">A Comprar (g)</TableHead>
                      <TableHead className="text-right">Vol. Bruto Pacote (g)</TableHead>
                      <TableHead className="text-right">Pacotes a Comprar</TableHead>
                      <TableHead className="text-right">Custo/Pacote</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insumosFiltrados.map(item => {
                  const insumo = insumos.find(i => i.id === item.insumoId);
                  const volumeBruto = Number(insumo?.volume_bruto) || 1;
                  const pacotesComprar = item.quantidadeComprar > 0 ? Math.ceil(item.quantidadeComprar / volumeBruto) : 0;
                  const custoTotalCorreto = pacotesComprar * item.custoMedio;
                  return <TableRow key={item.insumoId}>
                          <TableCell className="font-medium">{item.nomeInsumo}</TableCell>
                          <TableCell>{item.unidadeMedida}</TableCell>
                          <TableCell className="text-right">
                            {item.quantidadeNecessaria.toFixed(0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={item.estoqueAtual > 0 ? 'text-green-600' : 'text-red-600'}>
                              {item.estoqueAtual.toFixed(0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantidadeComprar > 0 ? <span className="font-medium text-orange-600">
                                {item.quantidadeComprar.toFixed(0)}
                              </span> : <span className="text-muted-foreground">0</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{volumeBruto.toFixed(0)}g</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {pacotesComprar > 0 ? <Badge variant="destructive">
                                {pacotesComprar} pacotes
                              </Badge> : <Badge variant="secondary">0</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {item.custoMedio.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {custoTotalCorreto > 0 ? <span className="font-semibold text-red-600">
                                R$ {custoTotalCorreto.toFixed(2)}
                              </span> : <span className="text-muted-foreground">R$ 0,00</span>}
                          </TableCell>
                        </TableRow>;
                })}
                  </TableBody>
                </Table>
              </div>
            </>}
        </CardContent>
      </Card>
    </div>;
}