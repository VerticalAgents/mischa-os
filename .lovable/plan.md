
# Plano: Reverter Integração PagHiper

## Resumo

Vou remover todos os arquivos, configurações e alterações relacionadas à integração com PagHiper que foram criadas nesta sessão.

---

## O Que Será Removido

### 1. Edge Function
- `supabase/functions/paghiper-proxy/index.ts` - Deletar pasta completa

### 2. Configuração
- `supabase/config.toml` - Remover entrada `[functions.paghiper-proxy]`

### 3. Coluna do Banco de Dados
- Nova migração para remover `paghiper_transaction_id` da tabela `agendamentos_clientes`

### 4. Hook Modificado
- `src/hooks/useGestaoClickBoleto.ts` - Remover função `buscarBoletoPagHiper` e referências ao PagHiper

### 5. Secrets (Manual)
- `PAGHIPER_API_KEY` e `PAGHIPER_TOKEN` - Você pode remover manualmente se desejar (não são obrigatórios remover, apenas deixarão de ser usados)

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/paghiper-proxy/` | Deletar pasta |
| `supabase/config.toml` | Remover linhas 9-10 |
| `supabase/migrations/new_migration.sql` | Criar migração para DROP COLUMN |
| `src/hooks/useGestaoClickBoleto.ts` | Simplificar (remover PagHiper) |
| `src/integrations/supabase/types.ts` | Será atualizado automaticamente após migração |

---

## Comportamento Após Reversão

O botão "Ver Boleto" no `GestaoClickTab` voltará ao comportamento simples que apenas marca o boleto como "gerado" localmente (era um placeholder). Se você quiser uma solução diferente no futuro, podemos implementar.

---

## Seção Técnica

### Migração de Rollback

```sql
ALTER TABLE public.agendamentos_clientes 
DROP COLUMN IF EXISTS paghiper_transaction_id;
```

### Hook Simplificado

Remover:
- Interface `BoletoInfo` com campos PagHiper
- Função `buscarBoletoPagHiper`
- Referências a `paghiper-proxy`

Manter:
- `buscarRecebimentos` (usa GestaoClick API)
- `abrirBoleto` (abre URL do GestaoClick)
