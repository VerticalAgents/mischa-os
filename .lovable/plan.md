
# Corrigir Scroll da Lista no Modal de Exportar CSV

## Problema
A lista de clientes no modal de exportação CSV não tem scroll funcional. O conteúdo ultrapassa os limites do modal, impedindo o acesso aos clientes que ficam mais abaixo.

**Causa raiz:** O `DialogContent` do Radix UI aplica `display: grid` por padrão. Ao adicionar `flex flex-col` na className, o Tailwind nao garante que `flex` sobrescreva `grid` (depende da ordem no CSS gerado). O resultado e que os containers filhos nao recebem restricao de altura, e o `ScrollArea` nunca ativa o scroll.

## Solucao

Aplicar uma altura maxima explicita no `ScrollArea` da lista de entregas, em vez de depender de flex constraints dentro do grid do Dialog. Isso garante que, independente do layout do dialog, a lista tenha um limite de altura e ative o scroll.

## Arquivo a Modificar

**`src/components/expedicao/components/ExportCSVDialog.tsx`**

Mudancas:
1. No `ScrollArea` (linha 137), adicionar `max-h-[40vh]` para limitar a altura da area de scroll e garantir que o scroll funcione
2. Remover as classes `flex-1 overflow-hidden min-h-0` dos containers pais que dependiam do flex layout (linhas 75, 101, 116), simplificando para `overflow-auto` onde necessario

Resultado: a lista de entregas tera no maximo 40% da altura da viewport, com scroll interno funcional para acessar todos os clientes.
