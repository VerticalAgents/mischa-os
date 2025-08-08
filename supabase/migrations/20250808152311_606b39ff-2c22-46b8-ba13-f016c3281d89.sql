
-- ===== PRODUTOS: saldo, trigger e trava =====
create or replace function public.saldo_produto(p_id uuid)
returns numeric language sql stable as $$
  select coalesce(sum(case
    when tipo = 'entrada' then quantidade
    when tipo = 'saida'   then -quantidade
    else quantidade
  end), 0)
  from public.movimentacoes_estoque_produtos
  where produto_id = p_id;
$$;

create or replace function public.sync_estoque_produto()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'UPDATE' and NEW.produto_id is distinct from OLD.produto_id) then
    update public.produtos_finais
      set estoque_atual = public.saldo_produto(OLD.produto_id)
      where id = OLD.produto_id;
  end if;

  update public.produtos_finais
    set estoque_atual = public.saldo_produto(coalesce(NEW.produto_id, OLD.produto_id))
    where id = coalesce(NEW.produto_id, OLD.produto_id);

  return null;
end;
$$;

drop trigger if exists trg_sync_estoque_produto on public.movimentacoes_estoque_produtos;
create trigger trg_sync_estoque_produto
after insert or update or delete on public.movimentacoes_estoque_produtos
for each row execute function public.sync_estoque_produto();

create or replace function public.prevent_negative_produto()
returns trigger language plpgsql as $$
declare saldo_atual numeric;
begin
  if TG_OP = 'INSERT' and NEW.tipo = 'saida' then
    saldo_atual := public.saldo_produto(NEW.produto_id);
    if saldo_atual < NEW.quantidade then
      raise exception 'Saldo insuficiente (produto). Disponível: %, Tentado: %', saldo_atual, NEW.quantidade;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_negative_produto on public.movimentacoes_estoque_produtos;
create trigger trg_prevent_negative_produto
before insert on public.movimentacoes_estoque_produtos
for each row execute function public.prevent_negative_produto();

-- ===== INSUMOS: saldo, trigger e trava =====
create or replace function public.saldo_insumo(i_id uuid)
returns numeric language sql stable as $$
  select coalesce(sum(case
    when tipo = 'entrada' then quantidade
    when tipo = 'saida'   then -quantidade
    else quantidade
  end), 0)
  from public.movimentacoes_estoque_insumos
  where insumo_id = i_id;
$$;

create or replace function public.sync_estoque_insumo()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'UPDATE' and NEW.insumo_id is distinct from OLD.insumo_id) then
    update public.insumos
      set estoque_atual = public.saldo_insumo(OLD.insumo_id)
      where id = OLD.insumo_id;
  end if;

  update public.insumos
    set estoque_atual = public.saldo_insumo(coalesce(NEW.insumo_id, OLD.insumo_id))
    where id = coalesce(NEW.insumo_id, OLD.insumo_id);

  return null;
end;
$$;

drop trigger if exists trg_sync_estoque_insumo on public.movimentacoes_estoque_insumos;
create trigger trg_sync_estoque_insumo
after insert or update or delete on public.movimentacoes_estoque_insumos
for each row execute function public.sync_estoque_insumo();

create or replace function public.prevent_negative_insumo()
returns trigger language plpgsql as $$
declare saldo_atual numeric;
begin
  if TG_OP = 'INSERT' and NEW.tipo = 'saida' then
    saldo_atual := public.saldo_insumo(NEW.insumo_id);
    if saldo_atual < NEW.quantidade then
      raise exception 'Saldo insuficiente (insumo). Disponível: %, Tentado: %', saldo_atual, NEW.quantidade;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_negative_insumo on public.movimentacoes_estoque_insumos;
create trigger trg_prevent_negative_insumo
before insert on public.movimentacoes_estoque_insumos
for each row execute function public.prevent_negative_insumo();

-- ===== RLS: somente SELECT/INSERT (sem UPDATE/DELETE) =====
-- Atualizar políticas para movimentações de produtos
DROP POLICY IF EXISTS "Users can manage movimentacoes_estoque_produtos" ON public.movimentacoes_estoque_produtos;
CREATE POLICY "Users can select movimentacoes_estoque_produtos" 
  ON public.movimentacoes_estoque_produtos
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert movimentacoes_estoque_produtos" 
  ON public.movimentacoes_estoque_produtos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Atualizar políticas para movimentações de insumos
DROP POLICY IF EXISTS "Authenticated users can manage movimentacoes_estoque_insumos" ON public.movimentacoes_estoque_insumos;
CREATE POLICY "Users can select movimentacoes_estoque_insumos" 
  ON public.movimentacoes_estoque_insumos
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert movimentacoes_estoque_insumos" 
  ON public.movimentacoes_estoque_insumos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
