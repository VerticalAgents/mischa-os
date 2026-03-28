

## Correção: Filtro de Tipo de Logística não filtra corretamente

### Problema
Os valores no banco de dados são armazenados em formato canônico maiúsculo (`PROPRIA`, `TERCEIRIZADA`, `RETIRADA`), mas o filtro compara com valores em formato UI (`Própria`, `Terceirizada`, `Retirada`). Por isso nenhum pedido corresponde.

### Correção

**`src/components/expedicao/components/TipoLogisticaFilter.tsx`**
- Alterar os valores das opções para os valores canônicos do banco:
  - `"Própria"` → `"PROPRIA"`
  - `"Terceirizada"` → `"TERCEIRIZADA"`
  - `"Retirada"` → `"RETIRADA"`
- Os labels continuam iguais para o usuário

Apenas uma linha precisa mudar (o array `OPCOES_LOGISTICA`). A lógica de filtragem em `Despacho.tsx` já está correta — compara diretamente com `pedido.tipo_logistica`, que vem cru do banco.

