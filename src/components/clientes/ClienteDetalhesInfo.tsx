import { Cliente } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Package, Calendar, Target, DollarSign, Building, User, Clock, FileText, Truck, CreditCard, Shield, Settings } from "lucide-react";
interface ClienteDetalhesInfoProps {
  cliente: Cliente;
}
export default function ClienteDetalhesInfo({
  cliente
}: ClienteDetalhesInfoProps) {
  return <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Nome do Cliente</p>
                  <p className="text-sm font-semibold text-foreground text-left">{cliente.nome}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">CNPJ/CPF</p>
                  <p className="text-sm text-foreground text-left">{cliente.cnpjCpf || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Status</p>
                  <Badge variant={cliente.statusCliente === 'Ativo' ? 'default' : 'secondary'} className="text-xs">
                    {cliente.statusCliente}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Categoria do Estabelecimento</p>
                  <p className="text-sm text-foreground text-left">Não informado</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Representante</p>
                  <p className="text-sm text-foreground text-left">Não informado</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Truck className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Rota de Entrega</p>
                  <p className="text-sm text-foreground text-left">Não informado</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato e Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Contato e Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Nome do Contato</p>
                  <p className="text-sm text-foreground text-left">{cliente.contatoNome || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Telefone</p>
                  <p className="text-sm text-foreground text-left">{cliente.contatoTelefone || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">E-mail</p>
                  <p className="text-sm text-foreground text-left">{cliente.contatoEmail || "Não informado"}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Endereço de Entrega</p>
                  <p className="text-sm text-foreground text-left">{cliente.enderecoEntrega || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Instruções de Entrega</p>
                  <p className="text-sm text-foreground text-left">{cliente.instrucoesEntrega || "Nenhuma instrução especial"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Operacionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            Configurações Operacionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Quantidade Padrão por Reposição</p>
                  <p className="text-sm font-semibold text-foreground text-left">{cliente.quantidadePadrao} unidades</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Periodicidade de Entrega</p>
                  <p className="text-sm font-semibold text-foreground text-left">A cada {cliente.periodicidadePadrao} dias</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Truck className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Tipo de Logística</p>
                  <p className="text-sm text-foreground text-left">{cliente.tipoLogistica}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Janelas de Entrega</p>
                  <div className="flex gap-1 flex-wrap">
                    {cliente.janelasEntrega?.map(dia => <Badge key={dia} variant="outline" className="text-xs">
                        {dia}
                      </Badge>) || <span className="text-sm text-muted-foreground">Não definidas</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Emite Nota Fiscal</p>
                  <Badge variant={cliente.emiteNotaFiscal ? 'default' : 'secondary'} className="text-xs">
                    {cliente.emiteNotaFiscal ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Última Reposição</p>
                  <p className="text-sm text-foreground text-left">
                    {cliente.ultimaDataReposicaoEfetiva ? new Date(cliente.ultimaDataReposicaoEfetiva).toLocaleDateString('pt-BR') : "Nenhuma reposição registrada"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance e Metas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Performance e Metas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Giro Médio Semanal Atual</p>
                  <p className="text-lg font-bold text-blue-600 text-left">{cliente.giroMedioSemanal || 0} unidades/semana</p>
                  <p className="text-xs text-muted-foreground text-left">Baseado no histórico de entregas</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Meta de Giro Semanal</p>
                  <p className="text-lg font-bold text-primary text-left">{cliente.metaGiroSemanal || 0} unidades/semana</p>
                  <p className="text-xs text-muted-foreground text-left">Meta definida para o cliente</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Giro Calculado (Teórico)</p>
                  <p className="text-lg font-bold text-gray-600 text-left">
                    {cliente.periodicidadePadrao > 0 ? Math.round(cliente.quantidadePadrao / cliente.periodicidadePadrao * 7) : 0} unidades/semana
                  </p>
                  <p className="text-xs text-muted-foreground text-left">
                    Baseado na quantidade padrão ({cliente.quantidadePadrao}) e periodicidade ({cliente.periodicidadePadrao} dias)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Financeiras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            Informações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Tipo de Cobrança</p>
                  <p className="text-sm font-medium text-foreground text-left">{cliente.tipoCobranca}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 text-left">Forma de Pagamento</p>
                  <p className="text-sm font-medium text-foreground text-left">{cliente.formaPagamento}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {cliente.observacoes && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              Observações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed text-foreground">{cliente.observacoes}</p>
              </div>
            </div>
          </CardContent>
        </Card>}
    </div>;
}