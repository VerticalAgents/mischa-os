# Fase 2 — Painel do Representante

## Escopo
1. **RLS**: liberar leitura de `historico_entregas`, `distribuidores_expositores` e `historico_giro_semanal_consolidado` para representantes (apenas dos clientes deles).
2. **Aba Histórico de Entregas** (somente leitura para representante).
3. **Aba Análise de Giro** (somente leitura).
4. **"Repetir Último Pedido"** voltar a funcionar para o representante.
5. **Novo item no menu lateral**: "Estatísticas Comerciais" — espelha a Gestão Comercial > Dashboard do admin, restrita ao próprio representante.

## 1. Migrações (RLS)

Adicionar policies SELECT para representantes nas 3 tabelas, sempre escopadas pelos clientes do representante (`representante_id = get_my_representante_id()`):

```sql
-- historico_entregas
CREATE POLICY "Representante reads own historico_entregas"
ON public.historico_entregas FOR SELECT
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);

-- distribuidores_expositores
CREATE POLICY "Representante reads own distribuidores_expositores"
ON public.distribuidores_expositores FOR SELECT
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);

-- historico_giro_semanal_consolidado
CREATE POLICY "Representante reads own historico_giro"
ON public.historico_giro_semanal_consolidado FOR SELECT
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);
```

> **Sem INSERT/UPDATE/DELETE** — representante é leitura pura (regra explicitamente pedida: histórico não pode ser editado).

## 2. Aba Histórico de Entregas
Já existe `HistoricoEntregasCliente` — usado em `ClienteDetalhesTabs`. Após RLS acima, passa a carregar para o representante. Garantir que botões de editar/excluir só apareçam quando `useEditPermission().canEdit && !isRep`. Verificar componente e ocultar ações de mutação se houver.

## 3. Aba Análise de Giro
`AnaliseGiro.tsx` consulta `historico_entregas` + `historico_giro_semanal_consolidado`. Após as policies RLS acima, funciona. Sem mudanças de código se já é só visualização.

## 4. Repetir Último Pedido
A função em `ProdutoQuantidadeSelector.repetirUltimoPedido` faz SELECT em `historico_entregas`. Com a nova policy passa a retornar dados. Sem mudança de código.

## 5. Estatísticas Comerciais (novo menu)

### a) Item no `RepSidebar.tsx`
Adicionar entre "Agendamentos" e "Configurações":
```tsx
{ to: "/rep/estatisticas", label: "Estatísticas Comerciais", icon: BarChart3 }
```

### b) Nova rota e página `src/pages/rep/RepEstatisticas.tsx`
Espelhar o conteúdo de `GestaoComercial > Dashboard` (`RepresentantesOptimized`), porém:
- Sem o seletor de representante (forçar `representanteSelecionado = id do próprio rep`).
- Reusar `RepresentantesIndicadoresOptimized` e `RepresentantesCharts` que já recebem dados prontos.
- Carregar `representanteId` via `useMyRepresentanteId`.
- Bloqueado por `RepGuard`.

### c) Registrar rota em `src/App.tsx`
```tsx
<Route path="/rep/estatisticas" element={
  <ProtectedRoute>
    <RepGuard>
      <RepLayout><RepEstatisticas /></RepLayout>
    </RepGuard>
  </ProtectedRoute>
} />
```

### d) Hook
Reusar `useOptimizedRepresentantesData(repIdString, true)` passando o id do próprio representante. O hook já filtra `clientes` por `representanteId` — perfeito, pois o store agora também precisará estar populado para o representante (ver nota abaixo).

### e) Garantir store populado para o representante
`useClienteStore.carregarClientes` precisa rodar em `RepEstatisticas`. Chamar no `useEffect` da página, igual o admin faz na página Clientes.

## Resultado
- Representante vê histórico, análise de giro e consegue repetir último pedido sem erros.
- Novo menu "Estatísticas Comerciais" mostra os mesmos cards/charts do admin, restritos aos clientes dele (RLS garante isolamento).
- Histórico permanece somente leitura para o representante.
