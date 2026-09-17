-- Liga uma conversa do WhatsApp a um cliente (ou a um lead) do Mischa OS.
--
-- Por que existe: desde o fim de 2025 o WhatsApp Web não mostra mais o telefone
-- de quem está do outro lado. A extensão do painel lateral não tem, portanto,
-- como adivinhar de quem é a conversa. O Lucca diz uma vez — "essa conversa é o
-- cliente X" — e fica guardado aqui.
--
-- Por que tabela nova e não coluna em clientes: um cliente tem mais de um
-- WhatsApp (dono, gerente, o balcão), e lead também precisa ser vinculado.

create table if not exists public.whatsapp_vinculos (
  id uuid primary key default gen_random_uuid(),

  cliente_id uuid references public.clientes(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,

  -- O nome da conversa como aparece no cabeçalho do WhatsApp. Hoje é a chave
  -- principal, porque é a única coisa estável que a tela ainda mostra.
  chat_titulo text,
  -- Guardados quando aparecerem: telefone em E.164 e o identificador interno.
  telefone_e164 text,
  lid text,

  origem text not null default 'manual', -- 'manual' | 'cadastro' | 'lead'
  criado_por uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vinculo_tem_alvo check (num_nonnulls(cliente_id, lead_id) = 1),
  constraint vinculo_tem_identidade check (
    chat_titulo is not null or telefone_e164 is not null or lid is not null
  )
);

-- Cada identidade aponta para um cliente só. É o que impede a conversa de um
-- cliente mostrar o financeiro de outro: revincular substitui, não duplica.
create unique index if not exists whatsapp_vinculos_titulo_uk
  on public.whatsapp_vinculos (lower(chat_titulo)) where chat_titulo is not null;
create unique index if not exists whatsapp_vinculos_tel_uk
  on public.whatsapp_vinculos (telefone_e164) where telefone_e164 is not null;
create unique index if not exists whatsapp_vinculos_lid_uk
  on public.whatsapp_vinculos (lid) where lid is not null;

create index if not exists whatsapp_vinculos_cliente_idx
  on public.whatsapp_vinculos (cliente_id);

create trigger trigger_update_whatsapp_vinculos_updated_at
  before update on public.whatsapp_vinculos
  for each row execute function public.update_updated_at_column();

alter table public.whatsapp_vinculos enable row level security;

-- Mesmo padrão de agendamentos_clientes: dono e staff fazem tudo.
create policy "Owner or staff can manage whatsapp_vinculos"
  on public.whatsapp_vinculos for all to authenticated
  using (is_owner_or_staff()) with check (is_owner_or_staff());

create policy "Admins can manage whatsapp_vinculos"
  on public.whatsapp_vinculos for all to authenticated
  using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
