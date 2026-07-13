
CREATE OR REPLACE FUNCTION public.validate_itens_receita_cliente_industrial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_receita_ci uuid;
  v_insumo_ci uuid;
  v_tipo text;
BEGIN
  SELECT rb.cliente_id INTO v_receita_ci
  FROM public.receitas_base rb WHERE rb.id = NEW.receita_id;

  SELECT i.cliente_id INTO v_insumo_ci
  FROM public.insumos i WHERE i.id = NEW.insumo_id;

  IF v_receita_ci IS DISTINCT FROM v_insumo_ci THEN
    RAISE EXCEPTION 'Contexto industrial incompatível: receita (cliente=%) não pode usar insumo (cliente=%).', v_receita_ci, v_insumo_ci;
  END IF;

  IF v_receita_ci IS NOT NULL THEN
    SELECT tipo_cliente INTO v_tipo FROM public.clientes WHERE id = v_receita_ci;
    IF v_tipo NOT IN ('INDUSTRIAL','AMBOS') THEN
      RAISE EXCEPTION 'Cliente % não é do tipo INDUSTRIAL/AMBOS (tipo atual: %).', v_receita_ci, v_tipo;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
