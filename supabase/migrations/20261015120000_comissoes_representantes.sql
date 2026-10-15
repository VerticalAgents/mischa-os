-- Comissão dos representantes por quinzena (Lucca, 15/10/2026). Cada linha de
-- comissoes_fechamentos é um lançamento (uma conta a pagar); a quinzena pode ter vários.
--
-- Nota emitida do dia 1 ao 15 paga no dia 16; do 16 ao fim do mês, no dia 1º seguinte.
-- A conta vem das notas do Gestão Click (o Mischa OS perde o vínculo com a nota depois da
-- entrega). A regra está em supabase/functions/_shared/comissao.ts. Estas tabelas guardam
-- o que já foi lançado, para nenhuma nota ser paga, descontada ou devolvida duas vezes.
-- Quem escreve é o gestaoclick-proxy (service role); a tela só lê, e só o admin.

alter table public.representantes
  add column if not exists cnpj text,
  add column if not exists razao_social text,
  add column if not exists gestaoclick_fornecedor_id text,
  add column if not exists comissao_por_unidade numeric(10,2);

comment on column public.representantes.comissao_por_unidade is
  'R$ por brownie vendido. Só quem tem valor aparece na aba Comissões.';

update public.representantes
   set cnpj = '10939052000181', razao_social = 'L A Fernandes Alimentos ME', comissao_por_unidade = 0.85
 where id = 19;
update public.representantes
   set cnpj = '66090629000188', razao_social = 'T.M.C. REPRESENTACOES LTDA', comissao_por_unidade = 0.85
 where id = 20;

create table if not exists public.comissoes_fechamentos (
  id bigint generated always as identity primary key,
  representante_id integer not null references public.representantes(id),
  inicio date not null,
  fim date not null,
  pagamento date not null,
  notas integer not null default 0,
  unidades integer not null default 0,
  bruto_centavos integer not null default 0,
  descontos_centavos integer not null default 0,
  creditos_centavos integer not null default 0,
  saldo_anterior_centavos integer not null default 0,
  liquido_centavos integer not null default 0,
  saldo_proximo_centavos integer not null default 0,
  gestaoclick_pagamento_id text,
  gestaoclick_pagamento_codigo text,
  lancado_em timestamptz not null default now(),
  lancado_por uuid
);
-- Uma quinzena pode ter vários lançamentos: o Lucca lança parte das notas quando quiser (15/10/2026).
create index if not exists comissoes_fechamentos_rep_inicio_idx on public.comissoes_fechamentos (representante_id, inicio);

create table if not exists public.comissoes_notas (
  id bigint generated always as identity primary key,
  gestaoclick_nf_id text not null unique,
  numero_nf text,
  representante_id integer not null references public.representantes(id),
  fechamento_id bigint not null references public.comissoes_fechamentos(id),
  gestaoclick_cliente_id text,
  cliente_nome text,
  data_emissao date not null,
  venda_codigo text,
  -- venda do Gestão Click: a entrega paga sem nota não volta a ser paga quando a nota sair
  gestaoclick_venda_id text,
  unidades integer not null,
  comissao_centavos integer not null,
  descontada_em bigint references public.comissoes_fechamentos(id),
  devolvida_em bigint references public.comissoes_fechamentos(id)
);

create index if not exists comissoes_notas_rep_idx on public.comissoes_notas (representante_id);
create index if not exists comissoes_notas_venda_idx on public.comissoes_notas (gestaoclick_venda_id);

alter table public.comissoes_fechamentos enable row level security;
alter table public.comissoes_notas enable row level security;

drop policy if exists "admin le fechamentos de comissao" on public.comissoes_fechamentos;
create policy "admin le fechamentos de comissao" on public.comissoes_fechamentos
  for select using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin le notas de comissao" on public.comissoes_notas;
create policy "admin le notas de comissao" on public.comissoes_notas
  for select using (public.has_role(auth.uid(), 'admin'));
