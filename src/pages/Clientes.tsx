import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useGestaoClickConfig } from "@/hooks/useGestaoClickConfig";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/common/PageHeader";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";
import ClientesFilters, { ColumnOption } from "@/components/clientes/ClientesFilters";
import ClientesTable from "@/components/clientes/ClientesTable";
import ClienteDetailsView from "@/components/clientes/ClienteDetailsView";
import ClientesBulkActions from "@/components/clientes/ClientesBulkActions";
import DeleteClienteDialog from "@/components/clientes/DeleteClienteDialog";
import { RelatorioClientesRevisaoModal } from "@/components/clientes/RelatorioClientesRevisaoModal";
import { FileSpreadsheet, Link2, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function Clientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [processingUrlParam, setProcessingUrlParam] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [isSyncingGC, setIsSyncingGC] = useState(false);
  
  const {
    filtros,
    loading,
    carregarClientes,
    setFiltroTermo,
    setFiltroStatus,
    setFiltroRepresentante,
    setFiltroRotaEntrega,
    getClientesFiltrados,
    clienteAtual,
    selecionarCliente,
    removerCliente,
    getClientePorId,
    clientes: todosClientes
  } = useClienteStore();

  const { config, fetchClientesGestaoClick } = useGestaoClickConfig();

  // Normalizar nome para comparação
  const normalizeName = (name: string) => {
    return name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Download do formulário de cadastro de clientes
  const handleDownloadFormularioCadastro = () => {
    const headers = [
      'Nome Fantasia',
      'Razão Social', 
      'Tipo Pessoa (PF/PJ)',
      'CNPJ ou CPF',
      'Inscrição Estadual',
      'Endereço Completo',
      'Nome do Contato',
      'Telefone',
      'Email',
      'Observações'
    ];

    const exemploLinha = [
      'NOME DO CLIENTE',
      'RAZÃO SOCIAL COMPLETA LTDA',
      'PJ',
      '00.000.000/0001-00',
      '000/0000000',
      'Rua Exemplo, 123 - Bairro - Cidade/RS - CEP 00000-000',
      'Nome do Responsável',
      '(51) 99999-9999',
      'email@exemplo.com',
      ''
    ];

    const BOM = '\uFEFF';
    const csvContent = BOM + headers.join(';') + '\n' + exemploLinha.join(';');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'formulario_cadastro_clientes.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Formulário de cadastro baixado!');
  };

  // Sincronizar com GestaoClick (atualizar IDs existentes e criar novos clientes)
  const handleSyncGestaoClick = async () => {
    if (!config?.access_token || !config?.secret_token) {
      toast.error('Configure as credenciais do GestaoClick em Configurações → Integrações');
      return;
    }

    setIsSyncingGC(true);
    try {
      const clientesGC = await fetchClientesGestaoClick(config.access_token, config.secret_token);
      
      // Criar mapa de clientes GC por nome normalizado
      const gcMap = new Map<string, string>();
      clientesGC.forEach(c => {
        gcMap.set(normalizeName(c.nome), c.id);
      });

      // Mapeamentos especiais (nomes diferentes entre sistemas)
      const mercadoQuadradoId = gcMap.get(normalizeName("MERCADO QUADRADO"));
      if (mercadoQuadradoId) {
        gcMap.set(normalizeName("Quadrado Express"), mercadoQuadradoId);
      }

      // Clientes internos que não precisam de sincronização
      const clientesInternos = ['AMOSTRAS', 'Paulo Eduardo'];

      // Contadores de resultados
      let sincronizados = 0;
      let criados = 0;
      let erros = 0;
      const clientesSemCorrespondencia: { id: string; nome: string; cliente: typeof todosClientes[0] }[] = [];

      // Fase 1: Identificar clientes existentes e sem correspondência
      for (const cliente of todosClientes) {
        if (clientesInternos.includes(cliente.nome)) continue;
        
        const nomeNormalizado = normalizeName(cliente.nome);
        const gcId = gcMap.get(nomeNormalizado);
        
        if (gcId) {
          // Cliente existe no GC - atualizar ID se necessário
          if (cliente.gestaoClickClienteId !== gcId) {
            const { error } = await supabase
              .from('clientes')
              .update({ gestaoclick_cliente_id: gcId })
              .eq('id', cliente.id);
            
            if (!error) {
              sincronizados++;
            }
          }
        } else {
          // Cliente não existe no GC - adicionar à lista para criação
          clientesSemCorrespondencia.push({ id: cliente.id, nome: cliente.nome, cliente });
        }
      }

      // Fase 2: Criar clientes que não existem no GestaoClick
      if (clientesSemCorrespondencia.length > 0) {
        console.log(`[SyncGC] Criando ${clientesSemCorrespondencia.length} clientes no GestaoClick...`);
        
        for (const { id, nome, cliente } of clientesSemCorrespondencia) {
          try {
            console.log(`[SyncGC] Criando cliente: ${nome}`);
            
            const { data: gcResult, error: gcError } = await supabase.functions.invoke('gestaoclick-proxy', {
              body: {
                action: 'criar_cliente_gc',
                nome: cliente.nome,
                tipo_pessoa: cliente.tipoPessoa || 'PJ',
                cnpj_cpf: cliente.cnpjCpf,
                inscricao_estadual: cliente.tipoPessoa === 'PJ' ? cliente.inscricaoEstadual : undefined,
                endereco: cliente.enderecoEntrega,
                contato_nome: cliente.contatoNome,
                contato_telefone: cliente.contatoTelefone,
                contato_email: cliente.contatoEmail,
                observacoes: cliente.observacoes
              }
            });

            if (gcError) {
              console.error(`[SyncGC] Erro ao criar ${nome}:`, gcError);
              erros++;
              continue;
            }

            if (gcResult?.success && gcResult?.gestaoclick_cliente_id) {
              // Salvar ID retornado no Lovable
              const gcClienteId = gcResult.gestaoclick_cliente_id;
              console.log(`[SyncGC] Cliente ${nome} criado com ID: ${gcClienteId}`);

              const { error: updateError } = await supabase
                .from('clientes')
                .update({ gestaoclick_cliente_id: gcClienteId })
                .eq('id', id);

              if (!updateError) {
                criados++;
              } else {
                console.error(`[SyncGC] Erro ao salvar ID GC para ${nome}:`, updateError);
                erros++;
              }
            } else {
              console.error(`[SyncGC] Resposta inesperada ao criar ${nome}:`, gcResult);
              erros++;
            }
          } catch (createError) {
            console.error(`[SyncGC] Exceção ao criar ${nome}:`, createError);
            erros++;
          }
        }
      }

      await carregarClientes();
      
      // Exibir resumo
      const mensagens: string[] = [];
      if (sincronizados > 0) mensagens.push(`${sincronizados} sincronizado(s)`);
      if (criados > 0) mensagens.push(`${criados} criado(s) no GC`);
      
      if (mensagens.length > 0) {
        toast.success(mensagens.join(', '));
      } else if (erros === 0) {
        toast.info('Todos os clientes já estão sincronizados');
      }
      
      if (erros > 0) {
        toast.warning(`${erros} cliente(s) não puderam ser criados no GestaoClick`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar com GestaoClick:', error);
      toast.error('Erro ao sincronizar com GestaoClick');
    } finally {
      setIsSyncingGC(false);
    }
  };

  // Handle URL parameter for direct client selection
  const clienteIdFromUrl = searchParams.get('clienteId');

  // Sequential loading and URL processing
  useEffect(() => {
    const processInitialLoad = async () => {
      console.log('Clientes: Iniciando carregamento inicial');
      
      // Step 1: Load clients data first
      if (initialLoad) {
        await carregarClientes();
        setInitialLoad(false);
        console.log('Clientes: Dados carregados');
      }
      
      // Step 2: Process URL parameter only after data is loaded and not already processing
      if (!loading && !initialLoad && clienteIdFromUrl && !processingUrlParam && !clienteAtual) {
        console.log('Clientes: Processando parâmetro da URL:', clienteIdFromUrl);
        setProcessingUrlParam(true);
        
        const cliente = getClientePorId(clienteIdFromUrl);
        if (cliente) {
          console.log('Clientes: Cliente encontrado, selecionando:', cliente.nome);
          selecionarCliente(clienteIdFromUrl);
        } else {
          console.log('Clientes: Cliente não encontrado, tentando recarregar dados');
          // If client not found, try refreshing data once more
          setRefreshTrigger(prev => prev + 1);
        }
        
        setProcessingUrlParam(false);
      }
    };

    processInitialLoad();
  }, [
    carregarClientes,
    loading,
    initialLoad,
    clienteIdFromUrl,
    processingUrlParam,
    clienteAtual,
    getClientePorId,
    selecionarCliente,
    refreshTrigger
  ]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Clientes: Recarregando devido ao refreshTrigger');
      carregarClientes();
    }
  }, [carregarClientes, refreshTrigger]);

  // Available columns for the table
  const columnOptions: ColumnOption[] = [
    { id: "idGestaoClick", label: "ID GC", canToggle: true },
    { id: "razaoSocial", label: "Razão Social", canToggle: true },
    { id: "nome", label: "Nome", canToggle: false },
    { id: "giroSemanal", label: "Giro Semanal", canToggle: false },
    { id: "cnpjCpf", label: "CNPJ/CPF", canToggle: true },
    { id: "enderecoEntrega", label: "Endereço", canToggle: true },
    { id: "contato", label: "Contato", canToggle: true },
    { id: "quantidadePadrao", label: "Qtde. Padrão", canToggle: true },
    { id: "periodicidade", label: "Period.", canToggle: true },
    { id: "status", label: "Status", canToggle: true },
    { id: "statusAgendamento", label: "Status Agendamento", canToggle: true },
    { id: "proximaDataReposicao", label: "Próx. Reposição", canToggle: true },
    { id: "acoes", label: "Ações", canToggle: false }
  ];

  // Column visibility state with persistence
  const defaultColumns = [
    "idGestaoClick", "razaoSocial", "nome", "giroSemanal", "cnpjCpf", "enderecoEntrega", "contato", "quantidadePadrao", 
    "periodicidade", "status", "acoes"
  ];
  
  const { visibleColumns, setVisibleColumns } = useColumnVisibility(
    'clientes-visible-columns',
    defaultColumns
  );

  const clientes = getClientesFiltrados();
  
  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleSelectCliente = (id: string) => {
    console.log('Clientes: Selecionando cliente via tabela:', id);
    selecionarCliente(id);
    // Update URL to reflect the selection
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('clienteId', id);
      return newParams;
    });
  };
  
  const handleBackToList = () => {
    console.log('Clientes: Voltando para a lista');
    selecionarCliente(null);
    // Clear URL parameters when user voluntarily goes back to the list
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('clienteId');
      return newParams;
    });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteCliente = (id: string) => {
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCliente = async () => {
    if (clienteToDelete) {
      await removerCliente(clienteToDelete);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedClienteIds([]);
  };

  // Toggle client selection
  const toggleClienteSelection = (id: string) => {
    setSelectedClienteIds(prev => 
      prev.includes(id) 
        ? prev.filter(clienteId => clienteId !== id)
        : [...prev, id]
    );
  };

  // Select/deselect all clients
  const handleSelectAllClientes = () => {
    if (selectedClienteIds.length === clientes.length) {
      setSelectedClienteIds([]);
    } else {
      setSelectedClienteIds(clientes.map(cliente => cliente.id));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedClienteIds([]);
  };

  // Show loading state during initial load or URL processing
  if (loading && initialLoad) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Carregando clientes...</div>
      </div>
    );
  }

  // Render client details view when a client is selected
  if (clienteAtual) {
    console.log('Clientes: Renderizando detalhes do cliente:', clienteAtual.nome);
    return (
      <ClienteDetailsView 
        cliente={clienteAtual} 
        onBack={handleBackToList} 
      />
    );
  }
  
  return (
    <>
      <PageHeader 
        title="Clientes" 
        description="Gerencie os pontos de venda dos seus produtos" 
        action={{
          label: "Novo Cliente",
          onClick: handleOpenForm
        }} 
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncGestaoClick}
          disabled={isSyncingGC || !config?.access_token}
          title={!config?.access_token ? "Configure o GestaoClick em Configurações → Integrações" : "Sincronizar clientes com GestaoClick (criar e vincular)"}
        >
          <Link2 className={`h-4 w-4 mr-1 ${isSyncingGC ? 'animate-pulse' : ''}`} />
          {isSyncingGC ? 'Sincronizando...' : 'Sincronizar com Gestão Click'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadFormularioCadastro}
          title="Baixar formulário CSV para cadastro de novos clientes"
        >
          <FileDown className="h-4 w-4 mr-1" />
          Formulário Cadastro
        </Button>
        <Button variant="outline" size="sm" onClick={() => setRelatorioOpen(true)}>
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          Revisão Clientes
        </Button>
      </PageHeader>

      <ClientesBulkActions 
        selectedClienteIds={selectedClienteIds}
        onClearSelection={clearSelection}
        onToggleSelectionMode={toggleSelectionMode}
        isSelectionMode={isSelectionMode}
      />

      <ClientesFilters 
        filtros={filtros}
        setFiltroTermo={setFiltroTermo}
        setFiltroStatus={setFiltroStatus}
        setFiltroRepresentante={setFiltroRepresentante}
        setFiltroRotaEntrega={setFiltroRotaEntrega}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        columnOptions={columnOptions}
      />

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-muted-foreground">Carregando clientes...</div>
        </div>
      ) : (
        <ClientesTable 
          clientes={clientes}
          visibleColumns={visibleColumns}
          columnOptions={columnOptions}
          onSelectCliente={handleSelectCliente}
          onDeleteCliente={handleDeleteCliente}
          selectedClientes={selectedClienteIds}
          onToggleClienteSelection={toggleClienteSelection}
          onSelectAllClientes={handleSelectAllClientes}
          showSelectionControls={isSelectionMode}
        />
      )}

      <ClienteFormDialog 
        open={isFormOpen} 
        onOpenChange={handleFormClose}
        onClienteUpdate={() => setRefreshTrigger(prev => prev + 1)}
      />

      <DeleteClienteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        cliente={clienteToDelete ? getClientePorId(clienteToDelete) : null}
        onConfirm={confirmDeleteCliente}
      />

      <RelatorioClientesRevisaoModal 
        open={relatorioOpen} 
        onOpenChange={setRelatorioOpen} 
      />
    </>
  );
}
