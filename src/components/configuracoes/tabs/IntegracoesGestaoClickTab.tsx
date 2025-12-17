import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Save, Plug, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useGestaoClickConfig, GestaoClickConfig } from '@/hooks/useGestaoClickConfig';

export default function IntegracoesGestaoClickTab() {
  const {
    config,
    loading,
    saving,
    testing,
    connectionStatus,
    situacoes,
    formasPagamento,
    saveConfig,
    testConnection
  } = useGestaoClickConfig();

  const [accessToken, setAccessToken] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showSecretToken, setShowSecretToken] = useState(false);
  const [situacaoId, setSituacaoId] = useState('');
  const [formaPagamentoBoleto, setFormaPagamentoBoleto] = useState('');
  const [formaPagamentoPix, setFormaPagamentoPix] = useState('');
  const [formaPagamentoDinheiro, setFormaPagamentoDinheiro] = useState('');

  // Carregar valores salvos
  useEffect(() => {
    if (config) {
      setAccessToken(config.access_token || '');
      setSecretToken(config.secret_token || '');
      setSituacaoId(config.situacao_id || '');
      setFormaPagamentoBoleto(config.forma_pagamento_ids?.BOLETO || '');
      setFormaPagamentoPix(config.forma_pagamento_ids?.PIX || '');
      setFormaPagamentoDinheiro(config.forma_pagamento_ids?.DINHEIRO || '');
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
      forma_pagamento_ids: {
        BOLETO: formaPagamentoBoleto || undefined,
        PIX: formaPagamentoPix || undefined,
        DINHEIRO: formaPagamentoDinheiro || undefined
      }
    };
    await saveConfig(newConfig);
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
                      Situação aplicada às vendas criadas automaticamente
                    </p>
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
    </div>
  );
}
