

# Plano: Integração Direta com PagHiper para Boletos

## Resumo Executivo

Após analisar a documentação da PagHiper, identifiquei o caminho técnico viável para buscar os boletos diretamente pela API da PagHiper.

---

## O Que Descobri

### API da PagHiper

| Endpoint | Função |
|----------|--------|
| `POST /transaction/status/` | Consulta um boleto pelo `transaction_id` |
| Resposta inclui | `url_slip` (HTML) e `url_slip_pdf` (PDF direto!) |

A resposta da API retorna a URL do PDF do boleto:
```json
{
  "bank_slip": {
    "url_slip": "https://www.paghiper.com/checkout/boleto/XXX",
    "url_slip_pdf": "https://www.paghiper.com/checkout/boleto/XXX/pdf"
  }
}
```

### O Desafio de Vinculação

Para buscar um boleto na PagHiper, precisamos do `transaction_id` (ex: `BPV661O7AVLORCN5`).

A integração GestaoClick → PagHiper provavelmente funciona assim:
1. GestaoClick cria uma venda
2. GestaoClick envia para PagHiper passando o código da venda no campo `order_id`
3. PagHiper retorna o `transaction_id`
4. GestaoClick salva esse `transaction_id` no recebimento

**Questão crítica**: O GestaoClick retorna o `transaction_id` do PagHiper na API de recebimentos?

---

## Plano de Implementação

### Fase 0: Investigação (Validação Necessária)

Antes de implementar, preciso que você me ajude a verificar:

1. **Acesse o GestaoClick** → Financeiro → Recebimentos
2. **Encontre um boleto** vinculado a uma venda
3. **Me informe se você vê** algum campo com ID/código do PagHiper ou "transaction_id"

Ou, alternativamente, vou testar a API de recebimentos do GestaoClick para ver quais campos retornam.

---

### Fase 1: Se o GestaoClick NÃO retornar o transaction_id

Neste cenário, a integração direta com PagHiper fica limitada. As opções seriam:

**Opção A - Usar URL do GestaoClick (atual)**
- Abrir `https://app.gestaoclick.com/recebimentos/visualizar/{id}`
- Usuário precisa estar logado no GC

**Opção B - Buscar por order_id no PagHiper (não existe endpoint público)**
- A API do PagHiper não tem endpoint para listar transações por `order_id`
- Seria necessário armazenar o `transaction_id` no momento da criação do boleto

---

### Fase 2: Se o GestaoClick RETORNAR o transaction_id

Este é o cenário ideal! A implementação seria:

**Arquivos a modificar/criar:**

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/paghiper-proxy/index.ts` | **Nova edge function** para chamar API PagHiper |
| `src/hooks/useGestaoClickBoleto.ts` | Atualizar para usar PagHiper quando tiver transaction_id |
| `src/components/expedicao/gestaoclick/VendaGCCard.tsx` | Implementar botão "Ver Boleto" funcional |

**Nova Edge Function - paghiper-proxy:**
```
Action: buscar_boleto
Input: { transaction_id: string }
Output: { 
  url_slip: string, 
  url_slip_pdf: string,
  status: string,
  valor: number
}
```

**Configuração necessária:**
- Credenciais PagHiper: `apiKey` e `token`
- Armazenar em `integracoes_config` (igual GestaoClick)

---

### Fase 3: Impressão em Massa

Uma vez que tenhamos acesso aos PDFs individuais, podemos:

1. **Buscar todos os transaction_ids** das vendas selecionadas
2. **Chamar PagHiper para cada um** e obter URLs dos PDFs
3. **Duas opções de implementação:**
   - A) Abrir todos os PDFs em abas separadas (simples, mas UX ruim)
   - B) Baixar PDFs via fetch, combinar com pdf-lib, e gerar PDF único (complexo, mas UX excelente)

---

## Próximo Passo Necessário

Para avançar, preciso de uma das seguintes informações:

**Opção 1 - Você verificar no GestaoClick:**
- Acesse um recebimento de boleto no GC
- Veja se há algum campo com código/ID do PagHiper
- Me envie uma screenshot ou o valor desse campo

**Opção 2 - Testar via API:**
- Posso chamar a API de recebimentos do GestaoClick e analisar todos os campos retornados
- Me confirme e eu faço esse teste

**Opção 3 - Você fornecer o transaction_id:**
- Se você souber o `transaction_id` de um boleto (ex: `BPV661O7AVLORCN5`)
- Posso testar a API do PagHiper diretamente

---

## Resumo Visual do Fluxo Ideal

```text
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Lovable (UI)      │     │  gestaoclick-proxy  │     │   GestaoClick API   │
│                     │     │   (Edge Function)   │     │                     │
│  Clica "Ver Boleto" │────▶│  Busca recebimento  │────▶│  /recebimentos      │
│                     │     │                     │     │  Retorna com        │
│                     │◀────│  Extrai trans_id    │◀────│  transaction_id     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │
         │                           ▼
         │                  ┌─────────────────────┐     ┌─────────────────────┐
         │                  │   paghiper-proxy    │     │   PagHiper API      │
         │                  │   (Edge Function)   │     │                     │
         │                  │  Consulta status    │────▶│  /transaction/status│
         │                  │                     │     │  Retorna url_slip   │
         │                  │  Retorna URL PDF    │◀────│  e url_slip_pdf     │
         │                  └─────────────────────┘     └─────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Abre PDF do boleto para impressão                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Credenciais Necessárias

Para a integração com PagHiper, você precisará:
1. **apiKey** - Ex: `apk_12345678-OqCWOKczcjutZaFRSfTlVBDpHFXpkdzz`
2. **Token** - Ex: `ZKSRNZGN8VW3MWN68UX8DDMDJR578N9772YU2FHABDEX`

Ambos disponíveis em: https://www.paghiper.com/painel/credenciais/

---

## Checklist de Validação (Após Implementação)

1. Botão "Ver Boleto" abre o PDF do PagHiper em nova aba
2. O PDF carrega corretamente sem exigir login adicional
3. Funciona para boletos em aberto e pagos
4. Modal de impressão em massa lista boletos corretamente
5. Impressão em massa abre múltiplos PDFs ou gera PDF consolidado

