
import { Cliente } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Package, Calendar, Target, DollarSign } from "lucide-react";

interface ClienteDetalhesInfoProps {
  cliente: Cliente;
}

export default function ClienteDetalhesInfo({ cliente }: ClienteDetalhesInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium text-muted-foreground">CNPJ/CPF:</span>
            <p className="text-sm">{cliente.cnpjCpf || "Não informado"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Endereço de Entrega:</span>
            <p className="text-sm">{cliente.enderecoEntrega || "Não informado"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Contato:</span>
            <p className="text-sm">{cliente.contatoNome || "Não informado"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{cliente.contatoTelefone || "Não informado"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{cliente.contatoEmail || "Não informado"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Configurações de Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Quantidade Padrão:</span>
            <p className="text-sm">{cliente.quantidadePadrao} unidades</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Periodicidade:</span>
            <p className="text-sm">A cada {cliente.periodicidadePadrao} dias</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Badge variant={cliente.statusCliente === 'Ativo' ? 'default' : 'secondary'}>
              {cliente.statusCliente}
            </Badge>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Janelas de Entrega:</span>
            <div className="flex gap-1 flex-wrap mt-1">
              {cliente.janelasEntrega?.map((dia) => (
                <Badge key={dia} variant="outline" className="text-xs">
                  {dia}
                </Badge>
              )) || <span className="text-sm">Não definidas</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas e Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Giro Médio Semanal:</span>
            <p className="text-sm">{cliente.giroMedioSemanal} unidades</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Meta Giro Semanal:</span>
            <p className="text-sm">{cliente.metaGiroSemanal} unidades</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Última Reposição:</span>
            <p className="text-sm">
              {cliente.ultimaDataReposicaoEfetiva 
                ? new Date(cliente.ultimaDataReposicaoEfetiva).toLocaleDateString('pt-BR')
                : "Nenhuma reposição registrada"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações Comerciais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Tipo de Logística:</span>
            <p className="text-sm">{cliente.tipoLogistica}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Emite Nota Fiscal:</span>
            <Badge variant={cliente.emiteNotaFiscal ? 'default' : 'secondary'}>
              {cliente.emiteNotaFiscal ? 'Sim' : 'Não'}
            </Badge>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Tipo de Cobrança:</span>
            <p className="text-sm">{cliente.tipoCobranca}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Forma de Pagamento:</span>
            <p className="text-sm">{cliente.formaPagamento}</p>
          </div>
          {cliente.instrucoesEntrega && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Instruções de Entrega:</span>
              <p className="text-sm">{cliente.instrucoesEntrega}</p>
            </div>
          )}
          {cliente.observacoes && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Observações:</span>
              <p className="text-sm">{cliente.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
