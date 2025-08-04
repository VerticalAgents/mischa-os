
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
  CreditCard
} from "lucide-react";

interface ClienteDetalhesInfoProps {
  cliente: Cliente;
}

export default function ClienteDetalhesInfo({ cliente }: ClienteDetalhesInfoProps) {
  return (
    <div className="space-y-8">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <Building className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Nome do Cliente</span>
                <p className="text-base font-medium">{cliente.nome}</p>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">CNPJ/CPF</span>
                <p className="text-sm">{cliente.cnpjCpf || "Não informado"}</p>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Status</span>
                <div>
                  <Badge variant={cliente.statusCliente === 'Ativo' ? 'default' : 'secondary'} className="text-xs">
                    {cliente.statusCliente}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Categoria</span>
                <p className="text-sm">{cliente.categoriaEstabelecimento || "Não informada"}</p>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Representante</span>
                <p className="text-sm">{cliente.representante || "Não atribuído"}</p>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Rota de Entrega</span>
                <p className="text-sm">{cliente.rotaEntrega || "Não definida"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <User className="h-5 w-5" />
            Contato e Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Nome do Contato</span>
                <p className="text-sm">{cliente.contatoNome || "Não informado"}</p>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Telefone</span>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{cliente.contatoTelefone || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">E-mail</span>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{cliente.contatoEmail || "Não informado"}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Endereço de Entrega</span>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{cliente.enderecoEntrega || "Não informado"}</p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Instruções de Entrega</span>
                <p className="text-sm">{cliente.instrucoesEntrega || "Nenhuma instrução especial"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Operacionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <Package className="h-5 w-5" />
            Configurações Operacionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Quantidade Padrão</span>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{cliente.quantidadePadrao} unidades</p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Periodicidade de Entrega</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">A cada {cliente.periodicidadePadrao} dias</p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Tipo de Logística</span>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{cliente.tipoLogistica}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Janelas de Entrega</span>
                <div className="flex gap-1 flex-wrap">
                  {cliente.janelasEntrega?.map((dia) => (
                    <Badge key={dia} variant="outline" className="text-xs">
                      {dia}
                    </Badge>
                  )) || <span className="text-sm text-muted-foreground">Não definidas</span>}
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Emite Nota Fiscal</span>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={cliente.emiteNotaFiscal ? 'default' : 'secondary'} className="text-xs">
                    {cliente.emiteNotaFiscal ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Última Reposição</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
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
            <Target className="h-5 w-5" />
            Performance e Metas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Giro Médio Semanal</span>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base font-medium">{cliente.giroMedioSemanal} unidades/semana</p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Meta de Giro Semanal</span>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <p className="text-base font-medium text-primary">{cliente.metaGiroSemanal} unidades/semana</p>
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
            <CreditCard className="h-5 w-5" />
            Informações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Tipo de Cobrança</span>
                <p className="text-sm">{cliente.tipoCobranca}</p>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Forma de Pagamento</span>
                <p className="text-sm">{cliente.formaPagamento}</p>
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
              <FileText className="h-5 w-5" />
              Observações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{cliente.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
