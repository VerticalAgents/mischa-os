
import { useState } from 'react';
import { Cliente } from "@/hooks/useClientesSupabase";
import { useConfigStore } from '@/hooks/useConfigStore';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/common/StatusBadge";

interface ClienteDetalhesInfoProps {
  cliente: Cliente;
}

export default function ClienteDetalhesInfo({ cliente }: ClienteDetalhesInfoProps) {
  const { 
    representantes,
    rotasEntrega,
    categoriasEstabelecimento 
  } = useConfigStore();

  const representante = representantes.find(r => r.id === cliente.representante_id);
  const rota = rotasEntrega.find(r => r.id === cliente.rota_entrega_id);
  const categoria = categoriasEstabelecimento.find(c => c.id === cliente.categoria_estabelecimento_id);
  
  // Helper para formatar a periodicidade em texto
  const formatPeriodicidade = (dias: number): string => {
    if (dias % 7 === 0) {
      const semanas = dias / 7;
      return semanas === 1 ? "1 semana" : `${semanas} semanas`;
    } else if (dias === 3) {
      return "3x semana";
    } else {
      return `${dias} dias`;
    }
  };
  
  // Calcular o giro semanal com base na quantidade padrão e periodicidade
  const calcularGiroSemanal = (qtdPadrao: number, periodicidadeDias: number): number => {
    // Para periodicidade em dias, converter para semanas
    if (periodicidadeDias === 3) {
      // Caso especial: 3x por semana
      return qtdPadrao * 3;
    }
    
    // Para outros casos, calcular giro semanal
    const periodicidadeSemanas = periodicidadeDias / 7;
    return Math.round(qtdPadrao / periodicidadeSemanas);
  };
  
  const giroSemanal = calcularGiroSemanal(
    cliente.quantidade_padrao || 0, 
    cliente.periodicidade_padrao || 7
  );

  const formatarDiasSemana = (dias?: any) => {
    if (!dias || (Array.isArray(dias) && dias.length === 0)) return "Não definidos";
    if (Array.isArray(dias) && dias.length === 7) return "Todos os dias";
    if (Array.isArray(dias)) return dias.join(', ');
    return "Não definidos";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-foreground mb-2">Dados do Cliente</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status:</dt>
                <dd><StatusBadge status={cliente.status_cliente as any} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">CNPJ/CPF:</dt>
                <dd>{cliente.cnpj_cpf || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Endereço:</dt>
                <dd className="text-right">{cliente.endereco_entrega || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Data de cadastro:</dt>
                <dd>{cliente.created_at ? new Date(cliente.created_at).toLocaleDateString() : "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Categoria:</dt>
                <dd>{categoria?.nome || "-"}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Dados de Contato</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nome:</dt>
                <dd>{cliente.contato_nome || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Telefone:</dt>
                <dd>{cliente.contato_telefone || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email:</dt>
                <dd>{cliente.contato_email || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Representante:</dt>
                <dd>{representante?.nome || "-"}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-2">Dados de Reposição</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Quantidade padrão:</dt>
                <dd>{cliente.quantidade_padrao || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Periodicidade:</dt>
                <dd>{formatPeriodicidade(cliente.periodicidade_padrao || 7)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Giro semanal estimado:</dt>
                <dd>
                  <Badge variant="outline" className="font-semibold bg-blue-50">
                    {giroSemanal}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Contabiliza no giro médio:</dt>
                <dd>{cliente.contabilizar_giro_medio ? "Sim" : "Não"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Janelas de entrega:</dt>
                <dd>{formatarDiasSemana(cliente.janelas_entrega)}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-2">Dados de Entrega</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Rota:</dt>
                <dd>{rota?.nome || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Logística:</dt>
                <dd>{cliente.tipo_logistica || "Própria"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nota fiscal:</dt>
                <dd>{cliente.emite_nota_fiscal ? "Sim" : "Não"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tipo de cobrança:</dt>
                <dd>{cliente.tipo_cobranca || "À vista"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Forma de pagamento:</dt>
                <dd>{cliente.forma_pagamento || "Boleto"}</dd>
              </div>
            </dl>
          </div>
          
          {cliente.instrucoes_entrega && (
            <div className="md:col-span-2">
              <h3 className="font-medium text-foreground mb-2">Instruções de Entrega</h3>
              <div className="p-3 bg-muted rounded-md text-sm">
                {cliente.instrucoes_entrega}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
