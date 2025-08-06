import React from 'react';
import { Cliente } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, User, Phone, Mail, Building, Truck, CreditCard, FileText } from "lucide-react";

interface ClienteDetalhesInfoProps {
  cliente: Cliente;
}

export default function ClienteDetalhesInfo({ cliente }: ClienteDetalhesInfoProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800';
      case 'Inativo':
        return 'bg-red-100 text-red-800';
      case 'Em análise':
        return 'bg-yellow-100 text-yellow-800';
      case 'A ativar':
        return 'bg-blue-100 text-blue-800';
      case 'Standby':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Status do Cliente
            <Badge className={getStatusColor(cliente.statusCliente)}>
              {cliente.statusCliente}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nome</label>
              <p className="text-sm">{cliente.nome}</p>
            </div>
            {cliente.cnpjCpf && (
              <div>
                <label className="text-sm font-medium text-gray-500">CNPJ/CPF</label>
                <p className="text-sm">{cliente.cnpjCpf}</p>
              </div>
            )}
          </div>

          {cliente.enderecoEntrega && (
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Endereço de Entrega
              </label>
              <p className="text-sm">{cliente.enderecoEntrega}</p>
            </div>
          )}

          {cliente.linkGoogleMaps && (
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center">
                <ExternalLink className="h-4 w-4 mr-1" />
                Link Google Maps
              </label>
              <a 
                href={cliente.linkGoogleMaps} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center"
              >
                Abrir no Google Maps
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {cliente.contatoNome && (
              <div>
                <label className="text-sm font-medium text-gray-500">Contato</label>
                <p className="text-sm">{cliente.contatoNome}</p>
              </div>
            )}
            {cliente.contatoTelefone && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Telefone
                </label>
                <p className="text-sm">{cliente.contatoTelefone}</p>
              </div>
            )}
            {cliente.contatoEmail && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </label>
                <p className="text-sm">{cliente.contatoEmail}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Comerciais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Configurações Comerciais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Quantidade Padrão</label>
              <p className="text-sm">{cliente.quantidadePadrao} unidades</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Periodicidade</label>
              <p className="text-sm">{cliente.periodicidadePadrao} dias</p>
            </div>
            {cliente.metaGiroSemanal && (
              <div>
                <label className="text-sm font-medium text-gray-500">Meta Semanal</label>
                <p className="text-sm">{cliente.metaGiroSemanal} unidades</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Entrega e Logística
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Logística</label>
              <p className="text-sm">{cliente.tipoLogistica}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Contabilizar no Giro</label>
              <p className="text-sm">{cliente.contabilizarGiroMedio ? 'Sim' : 'Não'}</p>
            </div>
          </div>
          
          {cliente.janelasEntrega && cliente.janelasEntrega.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">Janelas de Entrega</label>
              <p className="text-sm">{cliente.janelasEntrega.join(', ')}</p>
            </div>
          )}

          {cliente.instrucoesEntrega && (
            <div>
              <label className="text-sm font-medium text-gray-500">Instruções de Entrega</label>
              <p className="text-sm">{cliente.instrucoesEntrega}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Financeiras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Configurações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Cobrança</label>
              <p className="text-sm">{cliente.tipoCobranca}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Forma de Pagamento</label>
              <p className="text-sm">{cliente.formaPagamento}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Emite NF
              </label>
              <p className="text-sm">{cliente.emiteNotaFiscal ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {cliente.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{cliente.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
