ALTER TABLE public.clientes
  ADD COLUMN tipo_cliente text NOT NULL DEFAULT 'PDV'
    CHECK (tipo_cliente IN ('PDV','INDUSTRIAL','AMBOS')),
  ADD COLUMN preco_industrializacao_unitario numeric(10,2);

CREATE INDEX idx_clientes_tipo_cliente ON public.clientes (tipo_cliente);

INSERT INTO public.clientes (
  id, nome, cnpj_cpf, contato_nome, contato_email, contato_telefone,
  endereco_entrega, observacoes, ativo, tipo_cliente,
  preco_industrializacao_unitario, status_cliente, tipo_pessoa,
  prazo_pagamento_tipo, created_at, updated_at
)
SELECT
  ci.id, ci.nome, NULLIF(ci.cnpj, ''),
  NULLIF(ci.contato_nome, ''), NULLIF(ci.contato_email, ''), NULLIF(ci.contato_telefone, ''),
  NULLIF(ci.endereco, ''), NULLIF(ci.observacoes, ''),
  COALESCE(ci.ativo, true), 'INDUSTRIAL', ci.preco_industrializacao_unitario,
  'ATIVO', 'PJ', 'dias', ci.created_at, ci.updated_at
FROM public.clientes_industriais ci
WHERE NOT EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = ci.id);

ALTER TABLE public.insumos            RENAME COLUMN cliente_industrial_id TO cliente_id;
ALTER TABLE public.produtos_finais    RENAME COLUMN cliente_industrial_id TO cliente_id;
ALTER TABLE public.historico_producao RENAME COLUMN cliente_industrial_id TO cliente_id;
ALTER TABLE public.historico_entregas DROP COLUMN cliente_industrial_id;

ALTER TABLE public.insumos
  ADD CONSTRAINT insumos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;
ALTER TABLE public.produtos_finais
  ADD CONSTRAINT produtos_finais_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;
ALTER TABLE public.historico_producao
  ADD CONSTRAINT historico_producao_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;

DROP INDEX IF EXISTS public.idx_insumos_cliente_industrial;
DROP INDEX IF EXISTS public.idx_produtos_finais_cliente_industrial;
DROP INDEX IF EXISTS public.idx_historico_producao_cliente_industrial;
DROP INDEX IF EXISTS public.idx_historico_entregas_cliente_industrial;

CREATE INDEX idx_insumos_cliente ON public.insumos(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX idx_produtos_finais_cliente ON public.produtos_finais(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX idx_historico_producao_cliente ON public.historico_producao(cliente_id) WHERE cliente_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_itens_receita_cliente_industrial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_ci uuid;
  v_insumo_ci uuid;
  v_produto_final_id uuid;
  v_tipo text;
BEGIN
  SELECT rb.produto_final_id INTO v_produto_final_id
  FROM public.receitas_base rb WHERE rb.id = NEW.receita_id;
  IF v_produto_final_id IS NULL THEN RETURN NEW; END IF;

  SELECT pf.cliente_id INTO v_produto_ci FROM public.produtos_finais pf WHERE pf.id = v_produto_final_id;
  SELECT i.cliente_id INTO v_insumo_ci FROM public.insumos i WHERE i.id = NEW.insumo_id;

  IF v_produto_ci IS DISTINCT FROM v_insumo_ci THEN
    RAISE EXCEPTION 'Contexto industrial incompatível: produto (cliente=%) não pode usar insumo (cliente=%).', v_produto_ci, v_insumo_ci;
  END IF;

  IF v_produto_ci IS NOT NULL THEN
    SELECT tipo_cliente INTO v_tipo FROM public.clientes WHERE id = v_produto_ci;
    IF v_tipo NOT IN ('INDUSTRIAL','AMBOS') THEN
      RAISE EXCEPTION 'Cliente % não é do tipo INDUSTRIAL/AMBOS (tipo atual: %).', v_produto_ci, v_tipo;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TABLE public.clientes_industriais CASCADE;