
import { useState } from 'react';
import { Cliente, DiaSemana } from '@/types';
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

  const representante = representantes.find(r => r.id === cliente.representanteId);
  const rota = rotasEntrega.find(r => r.id === cliente.rotaEntregaId);
  const categoria = categoriasEstabelecimento.find(c => c.id === cliente.categoriaEstabelecimentoId);
  
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
  
  const giroSemanal = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);

  const formatarDiasSemana = (dias?: DiaSemana[]) => {
    if (!dias || dias.length === 0) return "Não definidos";
    if (dias.length === 7) return "Todos os dias";
    return dias.join(', ');
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
                <dd><StatusBadge status={cliente.statusCliente} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">CNPJ/CPF:</dt>
                <dd>{cliente.cnpjCpf || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Endereço:</dt>
                <dd className="text-right">{cliente.enderecoEntrega || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Data de cadastro:</dt>
                <dd>{cliente.dataCadastro.toLocaleDateString()}</dd>
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
                <dd>{cliente.contatoNome || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Telefone:</dt>
                <dd>{cliente.contatoTelefone || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email:</dt>
                <dd>{cliente.contatoEmail || "-"}</dd>
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
                <dd>{cliente.quantidadePadrao}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Periodicidade:</dt>
                <dd>{formatPeriodicidade(cliente.periodicidadePadrao)}</dd>
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
                <dd>{cliente.contabilizarGiroMedio ? "Sim" : "Não"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Janelas de entrega:</dt>
                <dd>{formatarDiasSemana(cliente.janelasEntrega)}</dd>
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
                <dd>{cliente.tipoLogistica}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nota fiscal:</dt>
                <dd>{cliente.emiteNotaFiscal ? "Sim" : "Não"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tipo de cobrança:</dt>
                <dd>{cliente.tipoCobranca}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Forma de pagamento:</dt>
                <dd>{cliente.formaPagamento}</dd>
              </div>
            </dl>
          </div>
          
          {cliente.instrucoesEntrega && (
            <div className="md:col-span-2">
              <h3 className="font-medium text-foreground mb-2">Instruções de Entrega</h3>
              <div className="p-3 bg-muted rounded-md text-sm">
                {cliente.instrucoesEntrega}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
