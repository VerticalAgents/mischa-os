
import { Cliente } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  Calendar, 
  Target, 
  DollarSign, 
  Building,
  User,
  Clock,
  FileText,
  Truck,
  CreditCard,
  Shield,
  Settings
} from "lucide-react";

interface ClienteDetalhesInfoProps {
  cliente: Cliente;
}

export default function ClienteDetalhesInfo({ cliente }: ClienteDetalhesInfoProps) {
  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <Building className="h-5 w-5 text-blue-600" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Nome do Cliente</span>
                  <p className="text-base font-semibold text-left">{cliente.nome}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">CNPJ/CPF</span>
                  <p className="text-sm text-left">{cliente.cnpjCpf || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <div className="text-left">
                    <Badge variant={cliente.statusCliente === 'Ativo' ? 'default' : 'secondary'} className="text-xs">
                      {cliente.statusCliente}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Categoria do Estabelecimento</span>
                  <p className="text-sm text-left">Não informado</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Representante</span>
                  <p className="text-sm text-left">Não informado</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Truck className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Rota de Entrega</span>
                  <p className="text-sm text-left">Não informado</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato e Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <Phone className="h-5 w-5 text-green-600" />
            Contato e Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Nome do Contato</span>
                  <p className="text-sm text-left">{cliente.contatoNome || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Telefone</span>
                  <p className="text-sm text-left">{cliente.contatoTelefone || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">E-mail</span>
                  <p className="text-sm text-left">{cliente.contatoEmail || "Não informado"}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Endereço de Entrega</span>
                  <p className="text-sm text-left">{cliente.enderecoEntrega || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Instruções de Entrega</span>
                  <p className="text-sm text-left">{cliente.instrucoesEntrega || "Nenhuma instrução especial"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Operacionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <Settings className="h-5 w-5 text-orange-600" />
            Configurações Operacionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Quantidade Padrão por Reposição</span>
                  <p className="text-base font-semibold text-left">{cliente.quantidadePadrao} unidades</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Periodicidade de Entrega</span>
                  <p className="text-base font-semibold text-left">A cada {cliente.periodicidadePadrao} dias</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Truck className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Tipo de Logística</span>
                  <p className="text-sm text-left">{cliente.tipoLogistica}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Janelas de Entrega</span>
                  <div className="flex gap-1 flex-wrap text-left">
                    {cliente.janelasEntrega?.map((dia) => (
                      <Badge key={dia} variant="outline" className="text-xs">
                        {dia}
                      </Badge>
                    )) || <span className="text-sm text-muted-foreground">Não definidas</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Emite Nota Fiscal</span>
                  <div className="text-left">
                    <Badge variant={cliente.emiteNotaFiscal ? 'default' : 'secondary'} className="text-xs">
                      {cliente.emiteNotaFiscal ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Última Reposição</span>
                  <p className="text-sm text-left">
                    {cliente.ultimaDataReposicaoEfetiva 
                      ? new Date(cliente.ultimaDataReposicaoEfetiva).toLocaleDateString('pt-BR')
                      : "Nenhuma reposição registrada"
                    }
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
          <CardTitle className="flex items-center gap-2 text-left">
            <Target className="h-5 w-5 text-purple-600" />
            Performance e Metas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Giro Médio Semanal Atual</span>
                  <p className="text-lg font-bold text-left text-blue-600">{cliente.giroMedioSemanal || 0} unidades/semana</p>
                  <span className="text-xs text-muted-foreground">Baseado no histórico de entregas</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Meta de Giro Semanal</span>
                  <p className="text-lg font-bold text-left text-primary">{cliente.metaGiroSemanal || 0} unidades/semana</p>
                  <span className="text-xs text-muted-foreground">Meta definida para o cliente</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Giro Calculado (Teórico)</span>
                  <p className="text-lg font-bold text-left text-gray-600">
                    {cliente.periodicidadePadrao > 0 ? Math.round((cliente.quantidadePadrao / cliente.periodicidadePadrao) * 7) : 0} unidades/semana
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Baseado na quantidade padrão ({cliente.quantidadePadrao}) e periodicidade ({cliente.periodicidadePadrao} dias)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Financeiras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            Informações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Tipo de Cobrança</span>
                  <p className="text-sm text-left font-medium">{cliente.tipoCobranca}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">Forma de Pagamento</span>
                  <p className="text-sm text-left font-medium">{cliente.formaPagamento}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {cliente.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <FileText className="h-5 w-5 text-amber-600" />
              Observações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-left">{cliente.observacoes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
