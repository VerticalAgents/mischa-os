
import { useEffect, useState } from 'react';
import { useConfiguracoesStore } from '@/hooks/useConfiguracoesStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function MigracaoDados() {
  const { salvarConfiguracao } = useConfiguracoesStore();
  const [dadosMigrados, setDadosMigrados] = useState(false);
  const [migrando, setMigrando] = useState(false);

  const verificarDadosLocalStorage = () => {
    const chaves = [
      'configEmpresa',
      'configSistema', 
      'configFinanceiro',
      'proporcoes-padrao'
    ];
    
    return chaves.some(chave => localStorage.getItem(chave) !== null);
  };

  const migrarDados = async () => {
    setMigrando(true);
    let sucessos = 0;
    
    try {
      // Migrar dados da empresa
      const configEmpresa = localStorage.getItem('configEmpresa');
      if (configEmpresa) {
        const dados = JSON.parse(configEmpresa);
        await salvarConfiguracao('empresa', dados);
        sucessos++;
      }

      // Migrar dados do sistema
      const configSistema = localStorage.getItem('configSistema');
      if (configSistema) {
        const dados = JSON.parse(configSistema);
        await salvarConfiguracao('sistema', dados);
        sucessos++;
      }

      // Migrar dados financeiros
      const configFinanceiro = localStorage.getItem('configFinanceiro');
      if (configFinanceiro) {
        const dados = JSON.parse(configFinanceiro);
        await salvarConfiguracao('financeiro', dados);
        sucessos++;
      }

      // Migrar proporções padrão
      const proporcoesPadrao = localStorage.getItem('proporcoes-padrao');
      if (proporcoesPadrao) {
        const dados = JSON.parse(proporcoesPadrao);
        await salvarConfiguracao('reposicao.proporcao_padrao', dados);
        sucessos++;
      }

      toast({
        title: "Migração concluída",
        description: `${sucessos} configurações foram migradas com sucesso`,
      });

      setDadosMigrados(true);
    } catch (error) {
      console.error('Erro na migração:', error);
      toast({
        title: "Erro na migração",
        description: "Ocorreu um erro ao migrar os dados",
        variant: "destructive"
      });
    } finally {
      setMigrando(false);
    }
  };

  useEffect(() => {
    // Verificar se já foi migrado
    const jaMigrado = localStorage.getItem('dados_migrados');
    if (jaMigrado) {
      setDadosMigrados(true);
    }
  }, []);

  const temDadosParaMigrar = verificarDadosLocalStorage();

  if (dadosMigrados || !temDadosParaMigrar) {
    return null; // Não exibir se já migrado ou não há dados
  }

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Migração de Dados Necessária
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Detectamos configurações salvas localmente. Para garantir que seus dados sejam preservados 
          e sincronizados, clique no botão abaixo para migrar para a nova base de dados do sistema.
        </p>
        <Button 
          onClick={migrarDados} 
          disabled={migrando}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {migrando ? "Migrando..." : "Migrar Dados"}
        </Button>
      </CardContent>
    </Card>
  );
}
