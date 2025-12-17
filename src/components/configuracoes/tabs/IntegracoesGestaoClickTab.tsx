import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, EyeOff, Save, Plug, CheckCircle2, XCircle, Loader2, ExternalLink, Users, Copy, Search, Package, UserCheck, RefreshCw, Store } from 'lucide-react';
import { useGestaoClickConfig, GestaoClickConfig, GestaoClickCliente, GestaoClickProduto, GestaoClickLoja } from '@/hooks/useGestaoClickConfig';
import { useSupabaseRepresentantes } from '@/hooks/useSupabaseRepresentantes';
import { toast } from 'sonner';

// Função para normalizar nomes para comparação
const normalizeString = (str: string) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export default function IntegracoesGestaoClickTab() {
  const {
    config,
    loading,
    saving,
    testing,
    connectionStatus,
    situacoes,
    formasPagamento,
    funcionarios,
    saveConfig,
    testConnection,
    fetchClientesGestaoClick,
    fetchProdutosGestaoClick,
    fetchFuncionariosGestaoClick,
    fetchLojasGestaoClick,
    fetchFornecedoresGestaoClick
  } = useGestaoClickConfig();

  const { representantes, carregarRepresentantes, atualizarRepresentante } = useSupabaseRepresentantes();

  const [accessToken, setAccessToken] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showSecretToken, setShowSecretToken] = useState(false);
  const [situacaoId, setSituacaoId] = useState('');
  const [situacaoEdicaoId, setSituacaoEdicaoId] = useState('');
  const [situacaoCanceladoId, setSituacaoCanceladoId] = useState('');
  const [formaPagamentoBoleto, setFormaPagamentoBoleto] = useState('');
  const [formaPagamentoPix, setFormaPagamentoPix] = useState('');
  const [formaPagamentoDinheiro, setFormaPagamentoDinheiro] = useState('');

  // Estado para vendedores/funcionários GC (para mapeamento de representantes)
  const [vendedoresGC, setVendedoresGC] = useState<{ id: string; nome: string }[]>([]);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  const [syncingVendedores, setSyncingVendedores] = useState(false);
  
  // Estado para clientes GestaoClick
  const [clientesGC, setClientesGC] = useState<GestaoClickCliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [searchClientes, setSearchClientes] = useState('');

  // Estado para produtos GestaoClick
  const [produtosGC, setProdutosGC] = useState<GestaoClickProduto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [searchProdutos, setSearchProdutos] = useState('');

  // Estado para lojas GestaoClick
  const [lojasGC, setLojasGC] = useState<GestaoClickLoja[]>([]);
  const [loadingLojas, setLoadingLojas] = useState(false);
  const [lojaId, setLojaId] = useState('');
  const [empresaId, setEmpresaId] = useState('');

  // Estado para fornecedores GestaoClick (emitente NF-e)
  const [fornecedoresGC, setFornecedoresGC] = useState<{ id: string; nome: string; cnpj_cpf?: string }[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [fornecedorId, setFornecedorId] = useState('');


  // Carregar valores salvos
  useEffect(() => {
    if (config) {
      setAccessToken(config.access_token || '');
      setSecretToken(config.secret_token || '');
      setSituacaoId(config.situacao_id || '');
      setSituacaoEdicaoId(config.situacao_edicao_id || '');
      setSituacaoCanceladoId(config.situacao_cancelado_id || '');
      setFormaPagamentoBoleto(config.forma_pagamento_ids?.BOLETO || '');
      setFormaPagamentoPix(config.forma_pagamento_ids?.PIX || '');
      setFormaPagamentoDinheiro(config.forma_pagamento_ids?.DINHEIRO || '');
      setLojaId(config.loja_id || '');
      setEmpresaId(config.empresa_id || '');
      setFornecedorId(config.fornecedor_id || '');
    }
  }, [config]);

  const handleTestConnection = async () => {
    if (!accessToken || !secretToken) {
      return;
    }
    await testConnection(accessToken, secretToken);
  };

  const handleSave = async () => {
    const newConfig: GestaoClickConfig = {
      access_token: accessToken,
      secret_token: secretToken,
      situacao_id: situacaoId || undefined,
      situacao_edicao_id: situacaoEdicaoId || undefined,
      situacao_cancelado_id: situacaoCanceladoId || undefined,
      loja_id: lojaId || undefined,
      empresa_id: empresaId || undefined,
      fornecedor_id: fornecedorId || undefined,
      forma_pagamento_ids: {
        BOLETO: formaPagamentoBoleto || undefined,
        PIX: formaPagamentoPix || undefined,
        DINHEIRO: formaPagamentoDinheiro || undefined
      }
    };
    await saveConfig(newConfig);
  };

  const handleFetchFornecedores = async () => {
    if (!accessToken || !secretToken) {
      toast.error('Configure os tokens primeiro');
      return;
    }
    setLoadingFornecedores(true);
    const fornecedores = await fetchFornecedoresGestaoClick(accessToken, secretToken);
    setFornecedoresGC(fornecedores);
    setLoadingFornecedores(false);
    if (fornecedores.length > 0) {
      toast.success(`${fornecedores.length} fornecedor(es) encontrado(s)`);
    }
  };
  const handleFetchLojas = async () => {
    if (!accessToken || !secretToken) {
      toast.error('Configure os tokens primeiro');
      return;
    }
    setLoadingLojas(true);
    const lojas = await fetchLojasGestaoClick(accessToken, secretToken);
    setLojasGC(lojas);
    setLoadingLojas(false);
    if (lojas.length > 0) {
      toast.success(`${lojas.length} loja(s) encontrada(s)`);
    }
  };

  const handleFetchClientes = async () => {
    if (!accessToken || !secretToken) {
      toast.error('Configure os tokens primeiro');
      return;
    }
    setLoadingClientes(true);
    const clientes = await fetchClientesGestaoClick(accessToken, secretToken);
    setClientesGC(clientes);
    setLoadingClientes(false);
    if (clientes.length > 0) {
      toast.success(`${clientes.length} clientes encontrados`);
    }
  };

  const handleFetchProdutos = async () => {
    if (!accessToken || !secretToken) {
      toast.error('Configure os tokens primeiro');
      return;
    }
    setLoadingProdutos(true);
    const produtos = await fetchProdutosGestaoClick(accessToken, secretToken);
    setProdutosGC(produtos);
    setLoadingProdutos(false);
    if (produtos.length > 0) {
      toast.success(`${produtos.length} produtos encontrados`);
    }
  };

  const handleFetchVendedores = async () => {
    if (!accessToken || !secretToken) {
      toast.error('Configure os tokens primeiro');
      return;
    }
    setLoadingVendedores(true);
    const vendedores = await fetchFuncionariosGestaoClick(accessToken, secretToken);
    setVendedoresGC(vendedores);
    setLoadingVendedores(false);
    if (vendedores.length > 0) {
      toast.success(`${vendedores.length} vendedores encontrados`);
    }
  };

  const handleVendedorChange = async (representanteId: number, gestaoClickFuncionarioId: string) => {
    const success = await atualizarRepresentante(representanteId, {
      gestaoclick_funcionario_id: gestaoClickFuncionarioId === 'none' ? null : gestaoClickFuncionarioId
    } as any);
    if (success) {
      await carregarRepresentantes();
    }
  };

  const handleSyncVendedores = async () => {
    if (vendedoresGC.length === 0) {
      toast.error('Carregue os vendedores do GestaoClick primeiro');
      return;
    }

    setSyncingVendedores(true);
    let updated = 0;
    let notFound = 0;

    for (const rep of representantes) {
      if (rep.gestaoclick_funcionario_id) continue; // Já mapeado

      const normalizedRepName = normalizeString(rep.nome);
      const matchingVendedor = vendedoresGC.find(v => 
        normalizeString(v.nome) === normalizedRepName
      );

      if (matchingVendedor) {
        const success = await atualizarRepresentante(rep.id, {
          gestaoclick_funcionario_id: matchingVendedor.id
        } as any);
        if (success) updated++;
      } else {
        notFound++;
      }
    }

    await carregarRepresentantes();
    setSyncingVendedores(false);

    if (updated > 0) {
      toast.success(`${updated} representante(s) mapeado(s) automaticamente`);
    }
    if (notFound > 0) {
      toast.info(`${notFound} representante(s) sem correspondência por nome`);
    }
    if (updated === 0 && notFound === 0) {
      toast.info('Todos os representantes já estão mapeados');
    }
  };

  const handleCopyId = (id: string, nome: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`ID ${id} copiado (${nome})`);
  };

  // Filtrar clientes
  const clientesFiltrados = clientesGC.filter(c => {
    const search = searchClientes.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(search) ||
      c.cnpj_cpf?.includes(search) ||
      c.id?.includes(search)
    );
  });

  // Filtrar produtos
  const produtosFiltrados = produtosGC.filter(p => {
    const search = searchProdutos.toLowerCase();
    return (
      p.nome?.toLowerCase().includes(search) ||
      p.codigo?.toLowerCase().includes(search) ||
      p.id?.includes(search)
    );
  });

  // Obter nome do vendedor GC pelo ID
  const getVendedorNome = (id: string | undefined | null) => {
    if (!id) return null;
    return vendedoresGC.find(v => v.id === id)?.nome || funcionarios.find(f => f.id === id)?.nome;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <ExternalLink className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Integração GestaoClick</CardTitle>
                <CardDescription>
                  Configure as credenciais de API para sincronização de vendas
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}
              className="gap-1"
            >
              {connectionStatus === 'connected' && <CheckCircle2 className="h-3 w-3" />}
              {connectionStatus === 'error' && <XCircle className="h-3 w-3" />}
              {connectionStatus === 'connected' ? 'Conectado' : connectionStatus === 'error' ? 'Erro' : 'Não configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credenciais */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Credenciais de API</h4>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <div className="relative">
                  <Input
                    id="access-token"
                    type={showAccessToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Insira o Access Token"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                  >
                    {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret-token">Secret Access Token</Label>
                <div className="relative">
                  <Input
                    id="secret-token"
                    type={showSecretToken ? 'text' : 'password'}
                    value={secretToken}
                    onChange={(e) => setSecretToken(e.target.value)}
                    placeholder="Insira o Secret Access Token"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowSecretToken(!showSecretToken)}
                  >
                    {showSecretToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={!accessToken || !secretToken || testing}
                variant="outline"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plug className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>
            </div>
          </div>

          {/* Configurações adicionais - só aparecem após conectar */}
          {connectionStatus === 'connected' && (situacoes.length > 0 || formasPagamento.length > 0) && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Configurações de Venda</h4>
                
                {situacoes.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="situacao">Situação de Venda (status inicial)</Label>
                      <Select value={situacaoId} onValueChange={setSituacaoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a situação" />
                        </SelectTrigger>
                        <SelectContent>
                          {situacoes.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Situação aplicada às vendas criadas
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="situacao-edicao">Situação "Edição"</Label>
                      <Select value={situacaoEdicaoId} onValueChange={setSituacaoEdicaoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {situacoes.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Status para permitir edições
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="situacao-cancelado">Situação "Cancelado"</Label>
                      <Select value={situacaoCanceladoId} onValueChange={setSituacaoCanceladoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {situacoes.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Status que permite exclusão da venda
                      </p>
                    </div>
                  </div>
                )}

                {formasPagamento.length > 0 && (
                  <div className="space-y-4">
                    <Label>Mapeamento de Formas de Pagamento</Label>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="fp-boleto" className="text-xs">BOLETO →</Label>
                        <Select value={formaPagamentoBoleto} onValueChange={setFormaPagamentoBoleto}>
                          <SelectTrigger id="fp-boleto">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {formasPagamento.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fp-pix" className="text-xs">PIX →</Label>
                        <Select value={formaPagamentoPix} onValueChange={setFormaPagamentoPix}>
                          <SelectTrigger id="fp-pix">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {formasPagamento.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fp-dinheiro" className="text-xs">DINHEIRO →</Label>
                        <Select value={formaPagamentoDinheiro} onValueChange={setFormaPagamentoDinheiro}>
                          <SelectTrigger id="fp-dinheiro">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {formasPagamento.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção de Lojas para NF-e */}
                <div className="space-y-4">
                  <Label>Loja para Nota Fiscal</Label>
                  <div className="flex gap-2 items-start">
                    <Button
                      onClick={handleFetchLojas}
                      disabled={!accessToken || !secretToken || loadingLojas}
                      variant="outline"
                      size="sm"
                    >
                      {loadingLojas ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Store className="h-4 w-4 mr-2" />
                      )}
                      Buscar Lojas
                    </Button>
                    {lojasGC.length > 0 && (
                      <Badge variant="secondary">
                        {lojasGC.length} loja(s)
                      </Badge>
                    )}
                  </div>
                  
                  {lojasGC.length > 0 && (
                    <div className="space-y-2">
                      <Select value={lojaId} onValueChange={setLojaId}>
                        <SelectTrigger className="w-full md:w-[400px]">
                          <SelectValue placeholder="Selecione a loja para emissão de NF" />
                        </SelectTrigger>
                        <SelectContent>
                          {lojasGC.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.nome} {l.cnpj && `(${l.cnpj})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Loja vinculada às Notas Fiscais geradas automaticamente
                      </p>
                    </div>
                  )}

                  {/* Emitente (Fornecedor) para NF-e */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label>Emitente (Fornecedor) para NF-e</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFetchFornecedores}
                        disabled={loadingFornecedores || !accessToken || !secretToken}
                      >
                        {loadingFornecedores ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Users className="h-3 w-3 mr-1" />
                        )}
                        Buscar Fornecedores
                      </Button>
                      {fornecedoresGC.length > 0 && (
                        <Badge variant="secondary">
                          {fornecedoresGC.length} fornecedor(es)
                        </Badge>
                      )}
                    </div>

                    {fornecedoresGC.length > 0 && (
                      <div className="space-y-2">
                        <Select value={fornecedorId} onValueChange={setFornecedorId}>
                          <SelectTrigger className="w-full md:w-[400px]">
                            <SelectValue placeholder="Selecione o emitente para emissão de NF" />
                          </SelectTrigger>
                          <SelectContent>
                            {fornecedoresGC.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.nome} {f.cnpj_cpf && `(${f.cnpj_cpf})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Este é o cadastro de fornecedor/emitente exigido pelo GestaoClick para NF-e (modelo 55).
                        </p>
                      </div>
                    )}
                  </div>


                  {/* Tabela de lojas disponíveis */}
                  {lojasGC.length > 0 && (
                    <ScrollArea className="h-[150px] border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>CNPJ</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lojasGC.map((loja) => (
                            <TableRow key={loja.id}>
                              <TableCell className="font-mono text-sm">{loja.id}</TableCell>
                              <TableCell>{loja.nome}</TableCell>
                              <TableCell className="font-mono text-sm text-muted-foreground">{loja.cnpj || '-'}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleCopyId(loja.id, loja.nome)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !accessToken || !secretToken}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mapeamento de Vendedores (Representantes ↔ Funcionários GC) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base">Vendedores no GestaoClick</CardTitle>
              <CardDescription>
                Vincule os representantes do Lovable aos vendedores do GestaoClick para atribuição automática nas vendas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleFetchVendedores}
              disabled={!accessToken || !secretToken || loadingVendedores}
              variant="outline"
            >
              {loadingVendedores ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Buscar Vendedores
            </Button>
            {vendedoresGC.length > 0 && (
              <>
                <Badge variant="secondary" className="self-center">
                  {vendedoresGC.length} vendedores
                </Badge>
                <Button
                  onClick={handleSyncVendedores}
                  disabled={syncingVendedores || vendedoresGC.length === 0}
                  variant="outline"
                  size="sm"
                >
                  {syncingVendedores ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar IDs GC
                </Button>
              </>
            )}
          </div>

          {representantes.length > 0 && (
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Representante (Lovable)</TableHead>
                    <TableHead className="w-24">ID GC</TableHead>
                    <TableHead className="w-64">Vendedor (GestaoClick)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {representantes.filter(r => r.ativo).map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-medium">{rep.nome}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {rep.gestaoclick_funcionario_id || '-'}
                      </TableCell>
                      <TableCell>
                        {vendedoresGC.length > 0 ? (
                          <Select
                            value={rep.gestaoclick_funcionario_id || 'none'}
                            onValueChange={(val) => handleVendedorChange(rep.id, val)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o vendedor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não vinculado</SelectItem>
                              {vendedoresGC.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {rep.gestaoclick_funcionario_id 
                              ? getVendedorNome(rep.gestaoclick_funcionario_id) || `ID: ${rep.gestaoclick_funcionario_id}`
                              : 'Carregue os vendedores'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {representantes.filter(r => r.ativo).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Nenhum representante ativo cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {representantes.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border rounded-md">
              Nenhum representante cadastrado. Cadastre representantes em Configurações → Clientes → Representantes.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consulta de Clientes GestaoClick */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">Clientes no GestaoClick</CardTitle>
              <CardDescription>
                Consulte os IDs dos clientes cadastrados no GestaoClick para mapeamento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleFetchClientes}
              disabled={!accessToken || !secretToken || loadingClientes}
              variant="outline"
            >
              {loadingClientes ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Buscar Clientes
            </Button>
            {clientesGC.length > 0 && (
              <Badge variant="secondary" className="self-center">
                {clientesGC.length} clientes
              </Badge>
            )}
          </div>

          {clientesGC.length > 0 && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ/CPF ou ID..."
                  value={searchClientes}
                  onChange={(e) => setSearchClientes(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">ID GC</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-40">CNPJ/CPF</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesFiltrados.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-mono text-sm">{cliente.id}</TableCell>
                        <TableCell>{cliente.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {cliente.cnpj_cpf || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyId(cliente.id, cliente.nome)}
                            title="Copiar ID"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {clientesFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {searchClientes ? 'Nenhum cliente encontrado' : 'Clique em "Buscar Clientes" para carregar'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>

      {/* Consulta de Produtos GestaoClick */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-base">Produtos no GestaoClick</CardTitle>
              <CardDescription>
                Consulte os IDs dos produtos cadastrados no GestaoClick para mapeamento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleFetchProdutos}
              disabled={!accessToken || !secretToken || loadingProdutos}
              variant="outline"
            >
              {loadingProdutos ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Buscar Produtos
            </Button>
            {produtosGC.length > 0 && (
              <Badge variant="secondary" className="self-center">
                {produtosGC.length} produtos
              </Badge>
            )}
          </div>

          {produtosGC.length > 0 && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou ID..."
                  value={searchProdutos}
                  onChange={(e) => setSearchProdutos(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">ID GC</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-32">Código</TableHead>
                      <TableHead className="w-24">Preço</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosFiltrados.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-mono text-sm">{produto.id}</TableCell>
                        <TableCell>{produto.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {produto.codigo || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {produto.preco ? `R$ ${produto.preco}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyId(produto.id, produto.nome)}
                            title="Copiar ID"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {produtosFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {searchProdutos ? 'Nenhum produto encontrado' : 'Clique em "Buscar Produtos" para carregar'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
