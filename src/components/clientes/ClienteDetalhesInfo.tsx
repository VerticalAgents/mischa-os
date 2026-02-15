
import React from 'react';
import { Cliente } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, User, Phone, Mail, Building, Truck, CreditCard, FileText, Clock, Target } from "lucide-react";
import { calcularMetaGiroSemanal } from '@/utils/giroCalculations';

interface ClienteDetalhesInfoProps {
  cliente: Cliente;
}

export default function ClienteDetalhesInfo({ cliente }: ClienteDetalhesInfoProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Inativo':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Em análise':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'A ativar':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Standby':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Calcular meta de giro semanal dinamicamente
  const metaGiroCalculada = cliente.metaGiroSemanal && cliente.metaGiroSemanal > 0 
    ? cliente.metaGiroSemanal 
    : calcularMetaGiroSemanal(cliente.quantidadePadrao || 0, cliente.periodicidadePadrao || 7);

  const InfoItem = ({ label, value, icon: Icon }: { label: string; value: string | number | undefined; icon?: any }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
        {Icon && <Icon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm font-medium text-gray-900 mt-0.5 break-words">{value}</p>
        </div>
      </div>
    );
  };

  const LinkItem = ({ label, value, href, icon: Icon }: { label: string; value: string; href: string; icon?: any }) => {
    if (!value || !href) return null;
    
    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
        {Icon && <Icon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{label}</p>
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-700 hover:text-blue-800 underline inline-flex items-center mt-0.5"
          >
            {value}
            <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Status Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{cliente.nome}</h2>
            <p className="text-sm text-gray-600 mt-1">Informações detalhadas do cliente</p>
          </div>
          <Badge className={`${getStatusColor(cliente.statusCliente)} border px-4 py-2 text-sm font-medium`}>
            {cliente.statusCliente}
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Informações Básicas */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200">
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-3 text-blue-600" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <InfoItem label="Nome do Cliente" value={cliente.nome} icon={User} />
            <InfoItem label="CNPJ/CPF" value={cliente.cnpjCpf} icon={FileText} />
            <InfoItem label="Contato" value={cliente.contatoNome} icon={User} />
            <InfoItem label="Telefone" value={cliente.contatoTelefone} icon={Phone} />
            <InfoItem label="Email" value={cliente.contatoEmail} icon={Mail} />
          </CardContent>
        </Card>

        {/* Localização */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200">
            <CardTitle className="flex items-center text-lg">
              <MapPin className="h-5 w-5 mr-3 text-green-600" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <InfoItem label="Endereço de Entrega" value={cliente.enderecoEntrega} icon={MapPin} />
            <LinkItem 
              label="Google Maps" 
              value="Abrir localização no Google Maps"
              href={cliente.linkGoogleMaps} 
              icon={ExternalLink} 
            />
          </CardContent>
        </Card>

        {/* Configurações Comerciais */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200">
            <CardTitle className="flex items-center text-lg">
              <Building className="h-5 w-5 mr-3 text-purple-600" />
              Configurações Comerciais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <InfoItem 
              label="Quantidade Padrão" 
              value={`${cliente.quantidadePadrao} unidades`} 
              icon={Target} 
            />
            <InfoItem 
              label="Periodicidade" 
              value={`${cliente.periodicidadePadrao} dias`} 
              icon={Clock} 
            />
            {metaGiroCalculada > 0 && (
              <InfoItem 
                label="Meta Giro Semanal" 
                value={`${metaGiroCalculada} unidades`} 
                icon={Target} 
              />
            )}
          </CardContent>
        </Card>

        {/* Entrega e Logística */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200">
            <CardTitle className="flex items-center text-lg">
              <Truck className="h-5 w-5 mr-3 text-orange-600" />
              Entrega e Logística
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <InfoItem label="Tipo de Logística" value={cliente.tipoLogistica} icon={Truck} />
            {cliente.janelasEntrega && cliente.janelasEntrega.length > 0 && (
              <InfoItem 
                label="Janelas de Entrega" 
                value={cliente.janelasEntrega.join(', ')} 
                icon={Clock} 
              />
            )}
            {cliente.instrucoesEntrega && (
              <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Instruções de Entrega</p>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{cliente.instrucoesEntrega}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Configurações Financeiras - Full Width */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200">
          <CardTitle className="flex items-center text-lg">
            <CreditCard className="h-5 w-5 mr-3 text-emerald-600" />
            Configurações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoItem label="Tipo de Cobrança" value={cliente.tipoCobranca} icon={CreditCard} />
            <InfoItem label="Forma de Pagamento" value={cliente.formaPagamento} icon={CreditCard} />
            <InfoItem 
              label="Emite Nota Fiscal" 
              value={cliente.emiteNotaFiscal ? 'Sim' : 'Não'} 
              icon={FileText} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Observações - Full Width */}
      {cliente.observacoes && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200">
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-5 w-5 mr-3 text-gray-600" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{cliente.observacoes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
