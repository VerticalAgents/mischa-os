## Ajuste de tamanho dos blocos no editor de produtos

Hoje, em `ProdutoQuantidadeSelector.tsx`, cada linha de produto usa `grid-cols-3` com colunas iguais, fazendo com que **Produto**, **Quantidade** e o botão da **lixeira** ocupem o mesmo espaço (como na imagem). Vou ajustar para uma proporção mais natural:

### Mudanças (apenas visuais, no arquivo `src/components/agendamento/ProdutoQuantidadeSelector.tsx`)

1. Trocar o grid `grid-cols-1 sm:grid-cols-3` por um layout flex no desktop:
   - **Produto**: ocupa o espaço restante (`flex-1`)
   - **Quantidade**: largura fixa pequena (`w-24`)
   - **Lixeira**: botão `size="icon"` (quadrado ~h-9 w-9), sem ocupar coluna inteira
2. No mobile (`< sm`): manter empilhado em coluna única, mas com a lixeira alinhada à direita em sua própria linha compacta.
3. Manter labels e acessibilidade (`htmlFor`) intactos.

### Resultado esperado
Linha mais equilibrada: Produto dominante, Quantidade enxuta, ícone de lixeira compacto ao lado — sem alterar nenhuma lógica de adicionar/remover/atualizar produto.