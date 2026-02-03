

# Plano: Integração Direta com PagHiper para Boletos

## Status: ✅ Implementação Básica Concluída

---

## O Que Foi Implementado

### ✅ Edge Function `paghiper-proxy`
- **Action `buscar_boleto`**: Consulta boleto pelo `transaction_id`
- Retorna `url_slip_pdf` para download direto do PDF
- Credenciais `PAGHIPER_API_KEY` e `PAGHIPER_TOKEN` configuradas

### ✅ Hook `useGestaoClickBoleto` Atualizado
- Nova função `buscarBoletoPagHiper(transactionId)` 
- Função `abrirBoleto` aceita `urlPdf` opcional
- Fallback para página do GestaoClick quando não há URL direta

### ✅ Campo `paghiper_transaction_id` 
- Adicionado à tabela `agendamentos_clientes`
- Permite armazenar o ID da transação PagHiper para consultas futuras

---

## Descoberta Importante

A API do GestaoClick **NÃO retorna** o `transaction_id` do PagHiper nos recebimentos.

**Porém**, descobrimos que:
- O `order_id` no PagHiper corresponde ao **código da venda** no GestaoClick
- Exemplo: Venda "2820" no GC = order_id "2820" no PagHiper

**Limitação**: A API do PagHiper não permite buscar por `order_id`, apenas por `transaction_id`.

---

## Próximos Passos (Para Implementação Futura)

### Opção 1: Input Manual do Transaction ID
Quando o usuário clicar em "Ver Boleto" pela primeira vez:
1. Prompt pedindo o `transaction_id` (visível na URL do boleto)
2. Sistema salva no campo `paghiper_transaction_id`
3. Próximas vezes abre diretamente o PDF

### Opção 2: Webhook do PagHiper
1. Criar endpoint para receber notificações do PagHiper
2. Quando boleto é criado, PagHiper notifica com o `transaction_id`
3. Sistema associa automaticamente pelo `order_id` (código da venda)

### Opção 3: Buscar na Interface GestaoClick (Workaround)
1. GestaoClick pode ter o `transaction_id` em algum campo não documentado
2. Investigar a interface web para encontrar padrões

---

## Resumo Técnico

### Arquivos Criados/Modificados

| Arquivo | Status |
|---------|--------|
| `supabase/functions/paghiper-proxy/index.ts` | ✅ Criado |
| `supabase/config.toml` | ✅ Atualizado |
| `src/hooks/useGestaoClickBoleto.ts` | ✅ Atualizado |
| `supabase/functions/gestaoclick-proxy/index.ts` | ✅ Logging melhorado |

### Secrets Configurados

| Secret | Status |
|--------|--------|
| `PAGHIPER_API_KEY` | ✅ Configurado |
| `PAGHIPER_TOKEN` | ✅ Configurado |

### Teste da API PagHiper

```json
// Request
{ "action": "buscar_boleto", "transaction_id": "02UJ3AECX2WRDJ26" }

// Response
{
  "success": true,
  "order_id": "2820",
  "status": "pending",
  "due_date": "2026-02-10",
  "value_cents": 16000,
  "url_slip_pdf": "https://www.paghiper.com/checkout/boleto/.../pdf"
}
```

---

## Fluxo Atual (Pós-Implementação)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Clica "Ver Boleto"                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Tem paghiper_transaction_id?  │
                    └───────────────────────────────┘
                           │              │
                          Sim            Não
                           │              │
                           ▼              ▼
              ┌────────────────┐   ┌────────────────────────┐
              │ Chama PagHiper │   │ Abre GestaoClick       │
              │ /status/       │   │ /recebimentos/visualizar│
              └────────────────┘   └────────────────────────┘
                     │
                     ▼
              ┌────────────────┐
              │ Abre PDF direto│
              └────────────────┘
```
