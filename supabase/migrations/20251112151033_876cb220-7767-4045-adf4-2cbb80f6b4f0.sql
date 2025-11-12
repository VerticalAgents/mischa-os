-- =====================================================================
-- CORREÇÃO ROBUSTA: Cálculo de Vencimentos de Parcelamentos
-- =====================================================================
-- 
-- PROBLEMA CORRIGIDO:
-- A função anterior tinha 3 bugs críticos:
-- 1. Comparava apenas DIA (não data completa) com fechamento
-- 2. Usava cálculo de data frágil (DATE_TRUNC + INTERVAL + dias)
-- 3. Não validava se o dia existe no mês de destino
--
-- LÓGICA CORRETA:
-- - Fatura fecha dia 23, vence dia 01
-- - Compras entre 23/07 e 22/08 → entram na fatura que vence 01/09
-- - Compras entre 23/08 e 22/09 → entram na fatura que vence 01/10
-- 
-- REGRA:
-- - Se data_compra >= data_fechamento_do_mes: primeira parcela +2 meses
-- - Se data_compra < data_fechamento_do_mes: primeira parcela +1 mês
-- =====================================================================

-- =====================================================================
-- FASE 1: Função Auxiliar para Adicionar Meses com Dia Fixo
-- =====================================================================
CREATE OR REPLACE FUNCTION public.adicionar_meses_com_dia_fixo(
  data_base DATE,
  n_meses INTEGER,
  dia_fixo INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_ano INTEGER;
  v_mes INTEGER;
  v_ultimo_dia_mes INTEGER;
BEGIN
  -- Extrair ano e mês da data base
  v_ano := EXTRACT(YEAR FROM data_base)::INTEGER;
  v_mes := EXTRACT(MONTH FROM data_base)::INTEGER;
  
  -- Adicionar os meses
  v_mes := v_mes + n_meses;
  
  -- Ajustar ano se necessário (quando passar de 12 meses)
  WHILE v_mes > 12 LOOP
    v_ano := v_ano + 1;
    v_mes := v_mes - 12;
  END LOOP;
  
  WHILE v_mes < 1 LOOP
    v_ano := v_ano - 1;
    v_mes := v_mes + 12;
  END LOOP;
  
  -- Descobrir o último dia do mês de destino
  v_ultimo_dia_mes := EXTRACT(DAY FROM (make_date(v_ano, v_mes, 1) + INTERVAL '1 month - 1 day')::DATE)::INTEGER;
  
  -- Se o dia fixo não existe no mês (ex: 31 em fevereiro), usar último dia do mês
  RETURN make_date(v_ano, v_mes, LEAST(dia_fixo, v_ultimo_dia_mes));
END;
$$;

-- =====================================================================
-- FASE 2: Função Principal - Gerar Parcelas Automaticamente
-- =====================================================================
CREATE OR REPLACE FUNCTION public.gerar_parcelas_automaticamente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valor_parcela NUMERIC(10,2);
  v_valor_ultima_parcela NUMERIC(10,2);
  v_data_vencimento DATE;
  v_dia_vencimento INTEGER;
  v_dia_fechamento INTEGER;
  v_data_fechamento_mes DATE;
  v_meses_para_primeira_parcela INTEGER;
  v_contador INTEGER;
  v_ano_compra INTEGER;
  v_mes_compra INTEGER;
BEGIN
  -- ===================================================================
  -- PASSO 1: Buscar informações do cartão
  -- ===================================================================
  SELECT dia_vencimento, dia_fechamento
  INTO v_dia_vencimento, v_dia_fechamento
  FROM cartoes_credito
  WHERE id = NEW.cartao_id;

  -- Validar se encontrou o cartão
  IF v_dia_vencimento IS NULL OR v_dia_fechamento IS NULL THEN
    RAISE EXCEPTION 'Cartão não encontrado ou sem dia de vencimento/fechamento configurado';
  END IF;

  -- ===================================================================
  -- PASSO 2: Calcular valores das parcelas
  -- ===================================================================
  -- Arredondar para baixo
  v_valor_parcela := FLOOR((NEW.valor_total / NEW.numero_parcelas) * 100) / 100;
  
  -- Última parcela compensa arredondamento
  v_valor_ultima_parcela := NEW.valor_total - (v_valor_parcela * (NEW.numero_parcelas - 1));

  -- ===================================================================
  -- PASSO 3: Construir data de fechamento do mês da compra
  -- ===================================================================
  v_ano_compra := EXTRACT(YEAR FROM NEW.data_compra)::INTEGER;
  v_mes_compra := EXTRACT(MONTH FROM NEW.data_compra)::INTEGER;
  
  -- Construir data completa do fechamento no mês da compra
  -- Usar LEAST para garantir que o dia existe no mês (ex: 31 em fevereiro)
  v_data_fechamento_mes := make_date(
    v_ano_compra,
    v_mes_compra,
    LEAST(v_dia_fechamento, EXTRACT(DAY FROM (make_date(v_ano_compra, v_mes_compra, 1) + INTERVAL '1 month - 1 day')::DATE)::INTEGER)
  );

  -- ===================================================================
  -- PASSO 4: Determinar em qual fatura a compra entra
  -- ===================================================================
  -- REGRA: Compras >= dia fechamento entram na PRÓXIMA fatura
  IF NEW.data_compra >= v_data_fechamento_mes THEN
    -- Compra NO DIA ou DEPOIS do fechamento
    -- → Entra na próxima fatura → Vence daqui a 2 meses
    v_meses_para_primeira_parcela := 2;
  ELSE
    -- Compra ANTES do fechamento
    -- → Entra na fatura atual → Vence no próximo mês
    v_meses_para_primeira_parcela := 1;
  END IF;

  -- ===================================================================
  -- PASSO 5: Calcular primeira data de vencimento
  -- ===================================================================
  v_data_vencimento := adicionar_meses_com_dia_fixo(
    NEW.data_compra,
    v_meses_para_primeira_parcela,
    v_dia_vencimento
  );

  -- ===================================================================
  -- PASSO 6: Gerar todas as parcelas
  -- ===================================================================
  FOR v_contador IN 1..NEW.numero_parcelas LOOP
    INSERT INTO parcelas (
      parcelamento_id,
      numero_parcela,
      valor_parcela,
      data_vencimento,
      status
    ) VALUES (
      NEW.id,
      v_contador,
      CASE 
        WHEN v_contador = NEW.numero_parcelas THEN v_valor_ultima_parcela 
        ELSE v_valor_parcela 
      END,
      v_data_vencimento,
      'pendente'
    );

    -- Avançar para próximo mês mantendo sempre o dia do vencimento
    v_data_vencimento := adicionar_meses_com_dia_fixo(
      v_data_vencimento,
      1,
      v_dia_vencimento
    );
  END LOOP;

  RETURN NEW;
END;
$$;