

# Plano: Renomear Aba e Implementar Visualização de Boletos do GestaoClick

## Resumo Executivo

Você quer:
1. **Renomear** a aba "GestaoClick" para "Emissão de Documentos"
2. **Puxar boletos** do GestaoClick para impressão individual e em massa

---

## Análise Técnica

### O que descobri na API

Após analisar a documentação completa da API GestaoClick (10.297 linhas), descobri:

1. **A API NÃO tem endpoint para baixar PDF de boleto diretamente**
2. **Mas** a API retorna um campo `hash` nas vendas (ex: `"hash": "wpQseRf"`)
3. **A URL que você enviou** (`https://gestaoclick.com/nfe/danfe/eO3BlK`) usa exatamente esse padrão de hash

### Como funciona a URL do GestaoClick

Baseado na URL que você compartilhou e na estrutura da API:
- NF/DANFE: `https://gestaoclick.com/nfe/danfe/{hash}`
- Boleto (provável): `https://gestaoclick.com/recebimentos/imprimir/{recebimento_id}` ou similar

**Precisamos confirmar a URL do boleto.** Você pode me enviar a URL de um boleto aberto manualmente no GestaoClick para confirmar o padrão exato.

---

## Implementação por Etapas

### Fase 1: Renomear a Aba (Simples)

**Arquivo**: `src/pages/Expedicao.tsx`

Trocar o texto "GestaoClick" por "Emissão de Documentos" na aba.

---

### Fase 2: Buscar Recebimentos da Venda (Backend)

**O que faz**: Quando o usuário clica em "Ver Boleto", o sistema vai buscar na API quais recebimentos (parcelas) estão associados àquela venda.

**Arquivo**: `supabase/functions/gestaoclick-proxy/index.ts`

Nova action: `buscar_recebimentos_venda`
- Chama: `GET /recebimentos?cliente_id={X}&data_inicio={Y}&data_fim={Z}`
- Filtra por venda (via descrição ou data)
- Retorna lista de recebimentos com IDs

---

### Fase 3: Visualizar Boleto Individual (UI)

**Comportamento**:
1. Clique em "Ver Boleto" no card
2. Sistema busca recebimento(s) da venda via edge function
3. Monta URL do boleto: `https://gestaoclick.com/recebimentos/imprimir/{id}` (ou padrão descoberto)
4. Abre nova aba para impressão

**Arquivos**:
- `src/components/expedicao/gestaoclick/VendaGCCard.tsx` - Atualizar botão "Ver Boleto"
- `src/hooks/useGestaoClickBoleto.ts` - Novo hook para buscar e abrir boleto

---

### Fase 4: Impressão em Massa (Futuro)

**Comportamento**:
1. Botão "Imprimir Boletos" na barra de ações em massa
2. Modal com checkboxes para selecionar vendas com BOLETO
3. Ao confirmar: abre múltiplas abas (ou tenta consolidar se o GC permitir)

**Arquivos novos**:
- `src/components/expedicao/gestaoclick/BoletosSelecaoModal.tsx`
- Atualizar `src/components/expedicao/gestaoclick/AcoesMassaGC.tsx`

---

## Detalhamento Técnico

### Nova action no Edge Function

```text
Action: buscar_recebimentos_venda
Input: { venda_id: string, cliente_id: string, data_venda: string }
Output: { recebimentos: [{ id, valor, data_vencimento, liquidado }] }
```

O endpoint `GET /recebimentos` aceita filtros:
- `cliente_id` (obrigatório)
- `data_inicio` / `data_fim` (para achar os recebimentos da venda)
- `liquidado` (ab = Em aberto, pg = Confirmado)

### Estrutura do Recebimento (da API)

```json
{
  "id": "410",
  "codigo": "3306",
  "descricao": "venda de TV 44",
  "valor": "1599.99",
  "cliente_id": "6",
  "nome_cliente": "Jarvis Stark",
  "data_vencimento": "2020-01-30",
  "liquidado": "0"
}
```

### URLs de Documentos do GestaoClick (padrões conhecidos)

| Documento | Padrão de URL |
|-----------|---------------|
| NF Visualizar | `https://app.gestaoclick.com/notas_fiscais/visualizar/{nf_id}` |
| DANFE (NF) | `https://gestaoclick.com/nfe/danfe/{hash}` |
| Boleto | Precisa confirmar - provavelmente `https://app.gestaoclick.com/recebimentos/boleto/{id}` |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Expedicao.tsx` | Renomear aba "GestaoClick" → "Emissão de Documentos" |
| `supabase/functions/gestaoclick-proxy/index.ts` | Adicionar action `buscar_recebimentos_venda` |
| `src/components/expedicao/gestaoclick/VendaGCCard.tsx` | Implementar botão "Ver Boleto" funcional |
| `src/hooks/useGestaoClickBoleto.ts` | Novo hook para lógica de boletos |
| `src/components/expedicao/gestaoclick/types.ts` | Adicionar tipos para recebimentos |

---

## Arquivos a Criar (Fase de Massa)

| Arquivo | Descrição |
|---------|-----------|
| `src/components/expedicao/gestaoclick/BoletosSelecaoModal.tsx` | Modal para seleção múltipla |

---

## Dependências e Riscos

### Risco 1: URL do Boleto
Precisamos confirmar a URL exata do boleto. **Ação necessária**: você me envia a URL de um boleto aberto manualmente.

### Risco 2: Autenticação da URL
Se a URL do boleto exigir login no GestaoClick, o usuário precisará estar logado lá para visualizar. Isso é comum em ERPs.

### Risco 3: Sem PDF via API
A API não retorna PDF diretamente. A solução é abrir a página de impressão do GestaoClick em nova aba.

---

## Próximos Passos Sugeridos

1. **Você me confirma a URL do boleto** (abre um boleto no GC e copia a URL)
2. **Implemento a Fase 1** (renomear aba) + **Fase 2** (buscar recebimentos)
3. **Implemento a Fase 3** (abrir boleto individual)
4. **Testamos o fluxo**
5. **Se funcionar**, implemento a Fase 4 (impressão em massa)

---

## Validação Final

Checklist de testes após implementação:
1. Aba aparece como "Emissão de Documentos" (não mais "GestaoClick")
2. Clicar em "Ver Boleto" em uma venda BOLETO abre a página de impressão correta
3. O botão só aparece para vendas com forma de pagamento = BOLETO
4. Modal de impressão em massa lista todas as vendas BOLETO pendentes
5. Selecionar múltiplos boletos e imprimir funciona

