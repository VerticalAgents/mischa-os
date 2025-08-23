import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cliente } from "@/types";
import { useClienteStore } from "@/hooks/useClienteStore";
import { CheckSquare, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClientesBulkActionsProps {
  selectedClienteIds: string[];
  onClearSelection: () => void;
  onToggleSelectionMode: () => void;
  isSelectionMode: boolean;
}

export default function ClientesBulkActions({
  selectedClienteIds,
  onClearSelection,
  onToggleSelectionMode,
  isSelectionMode
}: ClientesBulkActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<string>("");
  const [bulkEditValue, setBulkEditValue] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  
  const { removerCliente, clientes, atualizarCliente } = useClienteStore();

  // Função para normalizar telefone para E164
  const normalizarTelefone = (telefone: string): { e164: string; original: string } => {
    if (!telefone) return { e164: '', original: '' };
    
    const original = telefone.trim();
    let limpo = telefone.replace(/\D/g, '');
    
    // Se começar com 55 (Brasil) e tem 13 dígitos, já está no formato correto
    if (limpo.startsWith('55') && limpo.length === 13) {
      return { e164: `+${limpo}`, original };
    }
    
    // Se tem 11 dígitos (celular brasileiro sem código país)
    if (limpo.length === 11 && limpo.startsWith('9')) {
      return { e164: `+55${limpo}`, original };
    }
    
    // Se tem 10 dígitos (fixo brasileiro sem código país)
    if (limpo.length === 10) {
      return { e164: `+55${limpo}`, original };
    }
    
    // Se não conseguir normalizar, deixa E164 vazio
    return { e164: '', original };
  };

  // Função para inferir tipo de documento
  const inferirTipoDocumento = (doc: string): string => {
    if (!doc) return '';
    const limpo = doc.replace(/\D/g, '');
    if (limpo.length === 11) return 'CPF';
    if (limpo.length === 14) return 'CNPJ';
    return 'Outro';
  };

  // Função para formatar documento
  const formatarDocumento = (doc: string): string => {
    if (!doc) return '';
    const limpo = doc.replace(/\D/g, '');
    
    if (limpo.length === 11) {
      // CPF: 000.000.000-00
      return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    if (limpo.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return doc;
  };

  // Função para quebrar endereço em componentes
  const quebrarEndereco = (endereco: string) => {
    if (!endereco) {
      return {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: ''
      };
    }

    // Parsing básico do endereço - pode ser melhorado com regex mais sofisticada
    const partes = endereco.split(',').map(p => p.trim());
    
    return {
      logradouro: partes[0] || '',
      numero: '',
      complemento: '',
      bairro: partes[1] || '',
      cidade: partes[2] || '',
      uf: '',
      cep: ''
    };
  };

  // Função para serializar janelas de entrega
  const serializarJanelasEntrega = (janelas: any): string => {
    if (!janelas || typeof janelas !== 'object') return '';
    
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const janelasAtivas = [];
    
    for (let i = 0; i < diasSemana.length; i++) {
      const dia = diasSemana[i].toLowerCase();
      if (janelas[dia] === true) {
        janelasAtivas.push(diasSemana[i]);
      }
    }
    
    return janelasAtivas.join('|');
  };

  // Função para serializar categorias habilitadas
  const serializarCategorias = (categorias: any): string => {
    if (!categorias || !Array.isArray(categorias)) return '';
    
    // Assumindo que categorias é um array de IDs ou objetos
    // Precisa mapear IDs para nomes reais das categorias
    return categorias.map(cat => 
      typeof cat === 'object' ? cat.nome || cat.id : cat
    ).join('|');
  };

  // Função para serializar precificação
  const serializarPrecificacao = (cliente: Cliente): string => {
    // Esta função precisaria acessar dados de precificação por categoria
    // Por enquanto retorna vazio, mas deveria consultar precos_categoria_cliente
    return '';
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    setIsConfirmDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    selectedClienteIds.forEach(id => {
      removerCliente(id);
    });
    
    toast.success(`${selectedClienteIds.length} clientes excluídos com sucesso.`);
    setIsConfirmDeleteDialogOpen(false);
    onClearSelection();
    onToggleSelectionMode();
  };
  
  const handleBulkEdit = () => {
    if (!bulkEditField || !bulkEditValue) {
      toast.error("Selecione um campo e valor para editar.");
      return;
    }
    
    selectedClienteIds.forEach(id => {
      let updateData: Partial<Cliente> = {};
      
      switch (bulkEditField) {
        case "statusCliente":
          updateData = { statusCliente: bulkEditValue as any };
          break;
        case "tipoLogistica":
          updateData = { tipoLogistica: bulkEditValue as any };
          break;
        case "tipoCobranca":
          updateData = { tipoCobranca: bulkEditValue as any };
          break;
        case "formaPagamento":
          updateData = { formaPagamento: bulkEditValue as any };
          break;
        case "quantidadePadrao":
          updateData = { quantidadePadrao: parseInt(bulkEditValue) };
          break;
        case "periodicidadePadrao":
          updateData = { periodicidadePadrao: parseInt(bulkEditValue) };
          break;
      }
      
      atualizarCliente(id, updateData);
    });
    
    toast.success(`${selectedClienteIds.length} clientes atualizados com sucesso.`);
    setIsBulkEditDialogOpen(false);
    setBulkEditField("");
    setBulkEditValue("");
    onClearSelection();
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    
    try {
      const clientesSelecionados = clientes.filter(cliente => 
        selectedClienteIds.includes(cliente.id)
      );

      // Cabeçalho exato conforme especificação
      const headers = [
        'Cliente_ID',
        'Nome',
        'Documento_Tipo',
        'Documento_Numero',
        'Documento_Formatado',
        'Endereco_Logradouro',
        'Endereco_Numero',
        'Endereco_Complemento',
        'Endereco_Bairro',
        'Endereco_Cidade',
        'Endereco_UF',
        'Endereco_CEP',
        'Link_Google_Maps',
        'Representante',
        'Rota_Entrega',
        'Categoria_Principal',
        'Tipo_Logistica',
        'Quantidade_Padrao',
        'Periodicidade_Dias',
        'Status_Cliente',
        'Tipo_Cobranca',
        'Forma_Pagamento',
        'Emite_Nota_Fiscal',
        'Contabilizar_Giro_Medio',
        'Janelas_Entrega',
        'Instrucao_Entrega',
        'Categorias_Habilitadas',
        'Precificacao',
        'Contato_Principal_Nome',
        'Contato_Principal_Telefone_E164',
        'Contato_Principal_Telefone_Original',
        'Contato_Principal_Email',
        'Contatos_Extras_JSON',
        'Observacoes',
        'Data_Criacao',
        'Data_Atualizacao'
      ];

      const linhas = clientesSelecionados.map(cliente => {
        const endereco = quebrarEndereco(cliente.enderecoEntrega || '');
        const telefoneNormalizado = normalizarTelefone(cliente.contatoTelefone || '');
        const docLimpo = cliente.cnpjCpf ? cliente.cnpjCpf.replace(/\D/g, '') : '';
        
        return [
          `"${cliente.id}"`,
          `"${cliente.nome || ''}"`,
          `"${inferirTipoDocumento(cliente.cnpjCpf || '')}"`,
          `"${docLimpo}"`,
          `"${formatarDocumento(cliente.cnpjCpf || '')}"`,
          `"${endereco.logradouro}"`,
          `"${endereco.numero}"`,
          `"${endereco.complemento}"`,
          `"${endereco.bairro}"`,
          `"${endereco.cidade}"`,
          `"${endereco.uf}"`,
          `"${endereco.cep}"`,
          `"${cliente.linkGoogleMaps || ''}"`,
          `"${cliente.representanteId || ''}"`,
          `"${cliente.rotaEntregaId || ''}"`,
          `"${cliente.categoriaEstabelecimentoId || ''}"`,
          `"${cliente.tipoLogistica || ''}"`,
          `"${cliente.quantidadePadrao || 0}"`,
          `"${cliente.periodicidadePadrao || 0}"`,
          `"${cliente.statusCliente || ''}"`,
          `"${cliente.tipoCobranca || ''}"`,
          `"${cliente.formaPagamento || ''}"`,
          `"${cliente.emiteNotaFiscal ? 'true' : 'false'}"`,
          `"${cliente.contabilizarGiroMedio ? 'true' : 'false'}"`,
          `"${serializarJanelasEntrega(cliente.janelasEntrega)}"`,
          `"${cliente.instrucoesEntrega || ''}"`,
          `"${serializarCategorias(cliente.categoriasHabilitadas)}"`,
          `"${serializarPrecificacao(cliente)}"`,
          `"${cliente.contatoNome || ''}"`,
          `"${telefoneNormalizado.e164}"`,
          `"${telefoneNormalizado.original}"`,
          `"${cliente.contatoEmail || ''}"`,
          `""`, // Contatos_Extras_JSON - vazio por enquanto
          `"${cliente.observacoes || ''}"`,
          `"${cliente.dataCadastro || ''}"`,
          `"${new Date().toISOString()}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...linhas].join('\n');
      
      // Criar arquivo com nome padronizado
      const hoje = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const nomeArquivo = `clientes_export_unico_${hoje}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', nomeArquivo);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Opcional: gerar arquivo de validação
      const validacao = {
        totalClientes: clientesSelecionados.length,
        clientesComTelefoneNormalizado: clientesSelecionados.filter(c => 
          normalizarTelefone(c.contatoTelefone || '').e164
        ).length,
        clientesComDocumento: clientesSelecionados.filter(c => c.cnpjCpf).length,
        dataExportacao: new Date().toISOString()
      };
      
      console.log('Validação da exportação:', validacao);
      
      toast.success(`${selectedClienteIds.length} clientes exportados com sucesso em ${nomeArquivo}!`);
    } catch (error) {
      console.error('Erro ao exportar clientes:', error);
      toast.error('Erro ao exportar clientes. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <>
      <div className="flex space-x-2 mb-4">
        <Button
          variant={isSelectionMode ? "default" : "outline"}
          onClick={onToggleSelectionMode}
          className="flex items-center gap-1"
        >
          <CheckSquare className="h-4 w-4" />
          {isSelectionMode ? "Sair do modo seleção" : "Selecionar clientes"}
        </Button>
        
        {isSelectionMode && selectedClienteIds.length > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => setIsBulkEditDialogOpen(true)}
            >
              Editar {selectedClienteIds.length} clientes
            </Button>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exportando..." : `Exportar ${selectedClienteIds.length} clientes`}
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Excluir {selectedClienteIds.length} clientes
            </Button>
          </>
        )}
      </div>
      
      {/* First delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir clientes</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedClienteIds.length} clientes. 
              Esta operação exige confirmação adicional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Prosseguir com exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação final</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-destructive">Atenção:</strong> Você tem certeza que deseja excluir {selectedClienteIds.length} clientes?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Sim, excluir {selectedClienteIds.length} clientes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {selectedClienteIds.length} clientes</DialogTitle>
            <DialogDescription>
              Selecione o campo e o valor a serem aplicados a todos os clientes selecionados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field">Campo</Label>
              <Select
                value={bulkEditField}
                onValueChange={(value) => setBulkEditField(value)}
              >
                <SelectTrigger id="field">
                  <SelectValue placeholder="Selecione um campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="statusCliente">Status</SelectItem>
                  <SelectItem value="tipoLogistica">Tipo de Logística</SelectItem>
                  <SelectItem value="tipoCobranca">Tipo de Cobrança</SelectItem>
                  <SelectItem value="formaPagamento">Forma de Pagamento</SelectItem>
                  <SelectItem value="quantidadePadrao">Quantidade Padrão</SelectItem>
                  <SelectItem value="periodicidadePadrao">Periodicidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              {bulkEditField === "statusCliente" && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={bulkEditValue}
                    onValueChange={(value) => setBulkEditValue(value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Em análise">Em análise</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="A ativar">A ativar</SelectItem>
                      <SelectItem value="Standby">Standby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {bulkEditField === "tipoLogistica" && (
                <div>
                  <Label htmlFor="logistica">Tipo de Logística</Label>
                  <Select
                    value={bulkEditValue}
                    onValueChange={(value) => setBulkEditValue(value)}
                  >
                    <SelectTrigger id="logistica">
                      <SelectValue placeholder="Selecione um tipo de logística" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Própria">Própria</SelectItem>
                      <SelectItem value="Distribuição">Distribuição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {bulkEditField === "tipoCobranca" && (
                <div>
                  <Label htmlFor="cobranca">Tipo de Cobrança</Label>
                  <Select
                    value={bulkEditValue}
                    onValueChange={(value) => setBulkEditValue(value)}
                  >
                    <SelectTrigger id="cobranca">
                      <SelectValue placeholder="Selecione um tipo de cobrança" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À vista">À vista</SelectItem>
                      <SelectItem value="Consignado">Consignado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {bulkEditField === "formaPagamento" && (
                <div>
                  <Label htmlFor="pagamento">Forma de Pagamento</Label>
                  <Select
                    value={bulkEditValue}
                    onValueChange={(value) => setBulkEditValue(value)}
                  >
                    <SelectTrigger id="pagamento">
                      <SelectValue placeholder="Selecione uma forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {["quantidadePadrao", "periodicidadePadrao"].includes(bulkEditField) && (
                <div>
                  <Label htmlFor="value">
                    {bulkEditField === "quantidadePadrao" ? "Quantidade Padrão" : "Periodicidade (dias)"}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    value={bulkEditValue}
                    onChange={(e) => setBulkEditValue(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkEdit}>
              Aplicar a {selectedClienteIds.length} clientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
