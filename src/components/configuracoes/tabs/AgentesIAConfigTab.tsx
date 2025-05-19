
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { agentesIA } from "@/components/agentes-ia/agentes-data";

const agentesConfigSchema = z.object({
  projecoesFinanceiras: z.object({
    habilitado: z.boolean().default(true),
    periodoAnalise: z.string().default("30"),
    nivelRecomendacao: z.string().default("moderado"),
    acessoGerentes: z.boolean().default(true),
    acessoOperadores: z.boolean().default(false),
  }),
  otimizacaoProducao: z.object({
    habilitado: z.boolean().default(true),
    periodoComparacao: z.string().default("7"),
    nivelRecomendacao: z.string().default("conservador"),
    acessoGerentes: z.boolean().default(true),
    acessoOperadores: z.boolean().default(true),
  }),
  logisticaRoteirizacao: z.object({
    habilitado: z.boolean().default(true),
    raioAnalise: z.string().default("20"),
    nivelRecomendacao: z.string().default("moderado"),
    acessoGerentes: z.boolean().default(true),
    acessoOperadores: z.boolean().default(true),
  }),
  reposicaoInteligente: z.object({
    habilitado: z.boolean().default(true),
    limiarAlerta: z.string().default("15"),
    nivelRecomendacao: z.string().default("agressivo"),
    acessoGerentes: z.boolean().default(true),
    acessoOperadores: z.boolean().default(true),
  }),
  comunicacaoClientes: z.object({
    habilitado: z.boolean().default(true),
    frequenciaAnalise: z.string().default("7"),
    nivelRecomendacao: z.string().default("moderado"),
    acessoGerentes: z.boolean().default(true),
    acessoOperadores: z.boolean().default(false),
  }),
  alertasEstrategicos: z.object({
    habilitado: z.boolean().default(true),
    sensibilidadeAlerta: z.string().default("media"),
    nivelRecomendacao: z.string().default("moderado"),
    acessoGerentes: z.boolean().default(true),
    acessoOperadores: z.boolean().default(false),
  }),
  diagnosticoGeral: z.object({
    habilitado: z.boolean().default(true),
    periodoAnalise: z.string().default("30"),
    nivelRecomendacao: z.string().default("moderado"),
    acessoGerentes: z.boolean().default(true),
    acessoOperadores: z.boolean().default(false),
  }),
});

type AgentesConfig = z.infer<typeof agentesConfigSchema>;

export default function AgentesIAConfigTab() {
  const [selectedAgente, setSelectedAgente] = useState("projecoesFinanceiras");
  
  // Load saved configurations from localStorage or use defaults
  const savedConfig = localStorage.getItem("configAgentesIA") 
    ? JSON.parse(localStorage.getItem("configAgentesIA")!)
    : {
        projecoesFinanceiras: {
          habilitado: true,
          periodoAnalise: "30",
          nivelRecomendacao: "moderado",
          acessoGerentes: true,
          acessoOperadores: false,
        },
        otimizacaoProducao: {
          habilitado: true,
          periodoComparacao: "7",
          nivelRecomendacao: "conservador",
          acessoGerentes: true,
          acessoOperadores: true,
        },
        logisticaRoteirizacao: {
          habilitado: true,
          raioAnalise: "20",
          nivelRecomendacao: "moderado",
          acessoGerentes: true,
          acessoOperadores: true,
        },
        reposicaoInteligente: {
          habilitado: true,
          limiarAlerta: "15",
          nivelRecomendacao: "agressivo",
          acessoGerentes: true,
          acessoOperadores: true,
        },
        comunicacaoClientes: {
          habilitado: true,
          frequenciaAnalise: "7",
          nivelRecomendacao: "moderado",
          acessoGerentes: true,
          acessoOperadores: false,
        },
        alertasEstrategicos: {
          habilitado: true,
          sensibilidadeAlerta: "media",
          nivelRecomendacao: "moderado",
          acessoGerentes: true,
          acessoOperadores: false,
        },
        diagnosticoGeral: {
          habilitado: true,
          periodoAnalise: "30",
          nivelRecomendacao: "moderado",
          acessoGerentes: true,
          acessoOperadores: false,
        },
      };
  
  const agentesForm = useForm<AgentesConfig>({
    resolver: zodResolver(agentesConfigSchema),
    defaultValues: savedConfig,
  });
  
  const onSubmit = (data: AgentesConfig) => {
    localStorage.setItem("configAgentesIA", JSON.stringify(data));
    toast({
      title: "Configurações salvas",
      description: "As configurações dos Agentes de IA foram atualizadas com sucesso"
    });
  };
  
  // Get the current agente config field name based on ID conversion
  const getConfigField = (id: string) => {
    const fieldMap: Record<string, keyof AgentesConfig> = {
      "projecoes-financeiras": "projecoesFinanceiras",
      "otimizacao-producao": "otimizacaoProducao",
      "logistica-roteirizacao": "logisticaRoteirizacao",
      "reposicao-inteligente": "reposicaoInteligente",
      "comunicacao-clientes": "comunicacaoClientes",
      "alertas-estrategicos": "alertasEstrategicos",
      "diagnostico-geral": "diagnosticoGeral",
    };
    
    // Convert kebab-case to camelCase if it's in kebab-case format
    if (id.includes('-')) {
      return fieldMap[id] || "projecoesFinanceiras";
    }
    
    // If it's already in camelCase, return it directly
    return id as keyof AgentesConfig;
  };
  
  // Convert from kebab-case to camelCase for the form field
  const convertedAgente = getConfigField(selectedAgente);
  
  // Map agentes IDs to display names
  const agenteDisplayMap: Record<string, string> = {
    "projecoesFinanceiras": "Projeções Financeiras",
    "otimizacaoProducao": "Otimização da Produção",
    "logisticaRoteirizacao": "Logística e Roteirização",
    "reposicaoInteligente": "Reposição Inteligente",
    "comunicacaoClientes": "Comunicação com Clientes",
    "alertasEstrategicos": "Alertas Estratégicos",
    "diagnosticoGeral": "Diagnóstico Geral",
  };
  
  // Check which fields to render based on the selected agent
  const renderAgentFields = () => {
    switch (convertedAgente) {
      case "projecoesFinanceiras":
        return (
          <>
            <FormField
              control={agentesForm.control}
              name={`projecoesFinanceiras.periodoAnalise`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de análise</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 3 meses</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define o período histórico usado para projeções financeiras
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        );
      
      case "otimizacaoProducao":
        return (
          <>
            <FormField
              control={agentesForm.control}
              name={`otimizacaoProducao.periodoComparacao`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de comparação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define o período para análise comparativa de eficiência produtiva
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        );
      
      case "logisticaRoteirizacao":
        return (
          <>
            <FormField
              control={agentesForm.control}
              name={`logisticaRoteirizacao.raioAnalise`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raio de análise (km)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o raio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="20">20 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define o raio geográfico para otimização de rotas
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        );
        
      case "reposicaoInteligente":
        return (
          <>
            <FormField
              control={agentesForm.control}
              name={`reposicaoInteligente.limiarAlerta`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limiar de alerta (%)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o limiar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">5% de desvio</SelectItem>
                      <SelectItem value="10">10% de desvio</SelectItem>
                      <SelectItem value="15">15% de desvio</SelectItem>
                      <SelectItem value="20">20% de desvio</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Percentual de desvio para gerar alertas de reposição
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        );
      
      case "comunicacaoClientes":
        return (
          <>
            <FormField
              control={agentesForm.control}
              name={`comunicacaoClientes.frequenciaAnalise`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência de análise (dias)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Diária</SelectItem>
                      <SelectItem value="7">Semanal</SelectItem>
                      <SelectItem value="15">Quinzenal</SelectItem>
                      <SelectItem value="30">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Frequência de análise dos padrões de comunicação
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        );
        
      case "alertasEstrategicos":
        return (
          <>
            <FormField
              control={agentesForm.control}
              name={`alertasEstrategicos.sensibilidadeAlerta`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sensibilidade dos alertas</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a sensibilidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define a sensibilidade para geração de alertas estratégicos
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        );
        
      case "diagnosticoGeral":
        return (
          <>
            <FormField
              control={agentesForm.control}
              name={`diagnosticoGeral.periodoAnalise`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de análise</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 3 meses</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define o período para diagnóstico geral do negócio
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Form {...agentesForm}>
      <form id="agentes-config-form" onSubmit={agentesForm.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configuração de Agentes de IA</h3>
            
            <FormItem>
              <FormLabel>Selecione o agente para configurar</FormLabel>
              <Select value={selectedAgente} onValueChange={setSelectedAgente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(agenteDisplayMap).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-md font-medium">{agenteDisplayMap[convertedAgente] || "Agente"}</h3>
              
              <FormField
                control={agentesForm.control}
                name={`${convertedAgente}.habilitado` as any}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel>Habilitar agente</FormLabel>
                      <FormDescription>
                        Ativa ou desativa o acesso ao agente no sistema
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {renderAgentFields()}
              
              <FormField
                control={agentesForm.control}
                name={`${convertedAgente}.nivelRecomendacao` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de recomendação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="conservador">Conservador</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="agressivo">Agressivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define a intensidade das recomendações feitas pelo agente
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <h4 className="text-md font-medium">Permissões de acesso</h4>
              
              <FormField
                control={agentesForm.control}
                name={`${convertedAgente}.acessoGerentes` as any}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel>Acesso para gerentes</FormLabel>
                      <FormDescription>
                        Permite que usuários com perfil de gerente acessem este agente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={agentesForm.control}
                name={`${convertedAgente}.acessoOperadores` as any}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div>
                      <FormLabel>Acesso para operadores</FormLabel>
                      <FormDescription>
                        Permite que usuários com perfil de operador acessem este agente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit">Salvar Configurações</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
