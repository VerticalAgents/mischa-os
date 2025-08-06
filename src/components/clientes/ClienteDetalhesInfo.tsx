import React from "react";
import { Cliente } from "@/types";

interface ClienteDetalhesInfoProps {
  cliente: Cliente;
}

export default function ClienteDetalhesInfo({ cliente }: ClienteDetalhesInfoProps) {
  return (
    <div className="space-y-6">
      {/* Dados Básicos */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Dados Básicos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Nome:</span>
            <p className="text-foreground">{cliente.nome}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">CNPJ/CPF:</span>
            <p className="text-foreground">{cliente.cnpjCpf || "Não informado"}</p>
          </div>
          
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-muted-foreground">Endereço de Entrega:</span>
            <p className="text-foreground">{cliente.enderecoEntrega || "Não informado"}</p>
          </div>

          {cliente.linkGoogleMaps && (
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-muted-foreground">Link Google Maps:</span>
              <div className="mt-1">
                <a 
                  href={cliente.linkGoogleMaps} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                >
                  Ver no Google Maps
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações de Contato */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Informações de Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Nome do Contato:</span>
            <p className="text-foreground">{cliente.contatoNome || "Não informado"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Telefone:</span>
            <p className="text-foreground">{cliente.contatoTelefone || "Não informado"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Email:</span>
            <p className="text-foreground">{cliente.contatoEmail || "Não informado"}</p>
          </div>
        </div>
      </div>

      {/* Configurações Comerciais */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Configurações Comerciais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Quantidade Padrão:</span>
            <p className="text-foreground">{cliente.quantidadePadrao}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Periodicidade (dias):</span>
            <p className="text-foreground">{cliente.periodicidadePadrao}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <p className="text-foreground">{cliente.statusCliente}</p>
          </div>
          
           <div>
            <span className="text-sm font-medium text-muted-foreground">Giro Semanal:</span>
            <p className="text-foreground">{cliente.giroMedioSemanal}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Meta de Giro Semanal:</span>
            <p className="text-foreground">{cliente.metaGiroSemanal}</p>
          </div>
        </div>
      </div>
      
      {/* Agendamento */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Agendamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Status Agendamento:</span>
            <p className="text-foreground">{cliente.statusAgendamento || "Não agendado"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Próxima Reposição:</span>
            <p className="text-foreground">
              {cliente.proximaDataReposicao
                ? cliente.proximaDataReposicao.toLocaleDateString()
                : "Não agendada"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Entrega e Logística */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Entrega e Logística</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Tipo de Logística:</span>
            <p className="text-foreground">{cliente.tipoLogistica || "Não especificado"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Rota de Entrega:</span>
            <p className="text-foreground">{cliente.rotaEntregaId || "Não especificado"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Representante:</span>
            <p className="text-foreground">{cliente.representanteId || "Não especificado"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Categoria Estabelecimento:</span>
            <p className="text-foreground">{cliente.categoriaEstabelecimentoId || "Não especificado"}</p>
          </div>
          
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-muted-foreground">Instruções de Entrega:</span>
            <p className="text-foreground">{cliente.instrucoesEntrega || "Nenhuma"}</p>
          </div>
        </div>
      </div>
      
      {/* Financeiro e Fiscal */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Financeiro e Fiscal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Tipo de Cobrança:</span>
            <p className="text-foreground">{cliente.tipoCobranca || "Não especificado"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Forma de Pagamento:</span>
            <p className="text-foreground">{cliente.formaPagamento || "Não especificado"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Emite Nota Fiscal:</span>
            <p className="text-foreground">{cliente.emiteNotaFiscal ? "Sim" : "Não"}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-muted-foreground">Contabilizar Giro Médio:</span>
            <p className="text-foreground">{cliente.contabilizarGiroMedio ? "Sim" : "Não"}</p>
          </div>
        </div>
      </div>

      {/* Observações */}
      {cliente.observacoes && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Observações</h3>
          <p className="text-foreground">{cliente.observacoes}</p>
        </div>
      )}
    </div>
  );
}
