--
-- PostgreSQL database dump
--

\restrict 1vrltC9nkQnhZfJhcxNTzrUj7ZZETQYAboMAg5dHDC1hnQZpmh8WZySAtQ8ggzE

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: gestion; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA gestion;


ALTER SCHEMA gestion OWNER TO postgres;

--
-- Name: EstadoPiezaStock; Type: TYPE; Schema: gestion; Owner: postgres
--

CREATE TYPE gestion."EstadoPiezaStock" AS ENUM (
    'DISPONIBLE',
    'RESERVADA',
    'ALQUILADA',
    'VENDIDA',
    'FUERA_DE_SERVICIO',
    'DE BAJA'
);


ALTER TYPE gestion."EstadoPiezaStock" OWNER TO postgres;

--
-- Name: EtapaAlquiler; Type: TYPE; Schema: gestion; Owner: postgres
--

CREATE TYPE gestion."EtapaAlquiler" AS ENUM (
    'RESERVADO',
    'LISTO_PARA_RETIRO',
    'RETIRADO',
    'DEVUELTO',
    'CANCELADO'
);


ALTER TYPE gestion."EtapaAlquiler" OWNER TO postgres;

--
-- Name: EtapaVenta; Type: TYPE; Schema: gestion; Owner: postgres
--

CREATE TYPE gestion."EtapaVenta" AS ENUM (
    'RESERVADO',
    'LISTO_PARA_ENTREGA',
    'VENDIDO',
    'CANCELADO'
);


ALTER TYPE gestion."EtapaVenta" OWNER TO postgres;

--
-- Name: MetodoPago; Type: TYPE; Schema: gestion; Owner: postgres
--

CREATE TYPE gestion."MetodoPago" AS ENUM (
    'EFECTIVO',
    'TRANSFERENCIA'
);


ALTER TYPE gestion."MetodoPago" OWNER TO postgres;

--
-- Name: TipoInteraccion; Type: TYPE; Schema: gestion; Owner: postgres
--

CREATE TYPE gestion."TipoInteraccion" AS ENUM (
    'RETIRO',
    'DEVOLUCION',
    'OTRA'
);


ALTER TYPE gestion."TipoInteraccion" OWNER TO postgres;

--
-- Name: TipoPago; Type: TYPE; Schema: gestion; Owner: postgres
--

CREATE TYPE gestion."TipoPago" AS ENUM (
    'SENA',
    'DEPOSITO',
    'SALDO',
    'DEVOLUCION_DEPOSITO',
    'AJUSTE'
);


ALTER TYPE gestion."TipoPago" OWNER TO postgres;

--
-- Name: fn_cash_flow_today(); Type: FUNCTION; Schema: gestion; Owner: postgres
--

CREATE FUNCTION gestion.fn_cash_flow_today() RETURNS TABLE(total_income numeric, deposits_in_custody numeric, pending_balance numeric)
    LANGUAGE sql
    AS $$
WITH
income_today AS (
    SELECT COALESCE(SUM(monto), 0) AS total
    FROM gestion.pago_operacion
    WHERE
        deleted_at IS NULL
        AND tipo IN ('SENA', 'SALDO')
        -- Ajustamos la fecha que Prisma inserta (UTC) a la zona horaria local 
        -- para que las comparaciones con CURRENT_DATE sean precisas en horas cercanas a medianoche
        AND (fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Buenos_Aires')::date = CURRENT_DATE
),
deposits AS (
    SELECT COALESCE(
        SUM(a.deposito_monto - COALESCE(a.deposito_devuelto_monto, 0)),
        0
    ) AS total
    FROM gestion.alquiler a
    JOIN gestion.operacion o ON o.id_operacion = a.id_operacion
    WHERE
        a.etapa IN ('RESERVADO', 'LISTO_PARA_RETIRO', 'RETIRADO')
        AND o.deleted_at IS NULL
),
pending AS (
    SELECT COALESCE(SUM(
        GREATEST(0, o.monto_total - COALESCE(pagados.suma, 0))
    ), 0) AS total
    FROM gestion.operacion o
    LEFT JOIN (
        SELECT id_operacion, SUM(monto) AS suma
        FROM gestion.pago_operacion
        WHERE deleted_at IS NULL AND tipo IN ('SENA', 'SALDO')
        GROUP BY id_operacion
    ) pagados ON pagados.id_operacion = o.id_operacion
    WHERE o.deleted_at IS NULL AND (
        EXISTS (
            SELECT 1 FROM gestion.alquiler a2
            WHERE a2.id_operacion = o.id_operacion
            AND a2.etapa IN ('RESERVADO','LISTO_PARA_RETIRO','RETIRADO')
        )
        OR EXISTS (
            SELECT 1 FROM gestion.venta v2
            WHERE v2.id_operacion = o.id_operacion
            AND v2.etapa IN ('RESERVADO','LISTO_PARA_ENTREGA')
        )
    )
)
SELECT i.total, d.total, p.total
FROM income_today i, deposits d, pending p;
$$;


ALTER FUNCTION gestion.fn_cash_flow_today() OWNER TO postgres;

--
-- Name: fn_cash_flow_weekly(); Type: FUNCTION; Schema: gestion; Owner: postgres
--

CREATE FUNCTION gestion.fn_cash_flow_weekly() RETURNS TABLE(total_income numeric, deposits_in_custody numeric, pending_balance numeric)
    LANGUAGE sql STABLE
    AS $$
  WITH
    rango AS (
      SELECT
        date_trunc('week', now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
          AT TIME ZONE 'America/Argentina/Buenos_Aires'  AS inicio,
        date_trunc('week', now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
          AT TIME ZONE 'America/Argentina/Buenos_Aires' + INTERVAL '7 days'  AS fin
    ),

    -- Pagos vigentes de esta semana (excluimos deleted)
    pagos_semana AS (
      SELECT po.tipo, po.monto, po.id_operacion
      FROM   gestion.pago_operacion po
      JOIN   gestion.operacion o ON o.id_operacion = po.id_operacion
      WHERE  po.deleted_at IS NULL
        AND  o.deleted_at  IS NULL
        AND  po.fecha >= (SELECT inicio FROM rango)
        AND  po.fecha <  (SELECT fin    FROM rango)
    ),

    -- Saldo pendiente: operaciones aún activas
    saldo_pendiente AS (
      SELECT
        COALESCE(SUM(
          o.monto_total
          - COALESCE((
              SELECT SUM(po2.monto)
              FROM   gestion.pago_operacion po2
              WHERE  po2.id_operacion = o.id_operacion
                AND  po2.deleted_at  IS NULL
                AND  po2.tipo NOT IN ('DEPOSITO', 'DEVOLUCION_DEPOSITO')
            ), 0)
        ), 0) AS total
      FROM gestion.operacion o
      LEFT JOIN gestion.alquiler a ON a.id_operacion = o.id_operacion
      LEFT JOIN gestion.venta    v ON v.id_operacion = o.id_operacion
      WHERE o.deleted_at IS NULL
        AND (
          (a.etapa IS NOT NULL AND a.etapa NOT IN ('RETIRADO', 'DEVUELTO', 'CANCELADO'))
          OR
          (v.etapa IS NOT NULL AND v.etapa NOT IN ('VENDIDO', 'CANCELADO'))
        )
    )

  SELECT
    COALESCE(SUM(monto) FILTER (WHERE tipo IN ('SENA', 'SALDO', 'AJUSTE')), 0) AS total_income,
    COALESCE(SUM(monto) FILTER (WHERE tipo = 'DEPOSITO'),                   0) AS deposits_in_custody,
    (SELECT total FROM saldo_pendiente)                                         AS pending_balance
  FROM pagos_semana;
$$;


ALTER FUNCTION gestion.fn_cash_flow_weekly() OWNER TO postgres;

--
-- Name: fn_kpi_active_rentals(); Type: FUNCTION; Schema: gestion; Owner: postgres
--

CREATE FUNCTION gestion.fn_kpi_active_rentals() RETURNS TABLE(total_items bigint, overdue bigint, due_today bigint)
    LANGUAGE sql STABLE
    AS $$
        SELECT
            -- total_items counts all operations that are active
            COUNT(*)::bigint AS total_items,
            
            -- overdue counts operations that are overdue
            COUNT(*) FILTER (WHERE es_atrasado = true)::bigint AS overdue,
            
            -- due_today counts operations due today
            COUNT(*) FILTER (
                WHERE (tipo = 'Alquiler' AND etapa = 'RETIRADO' AND fecha_fin::date = CURRENT_DATE)
                   OR (tipo = 'Alquiler' AND etapa IN ('RESERVADO', 'LISTO_PARA_RETIRO') AND fecha::date = CURRENT_DATE)
                   OR (tipo = 'Venta' AND etapa IN ('RESERVADO', 'LISTO_PARA_ENTREGA') AND fecha::date = CURRENT_DATE)
            )::bigint AS due_today
        FROM gestion.v_active_operations_details;
    $$;


ALTER FUNCTION gestion.fn_kpi_active_rentals() OWNER TO postgres;

--
-- Name: fn_monthly_revenue(); Type: FUNCTION; Schema: gestion; Owner: postgres
--

CREATE FUNCTION gestion.fn_monthly_revenue() RETURNS TABLE(current_amount numeric, previous_amount numeric, percent_change integer)
    LANGUAGE sql
    AS $$
WITH
this_month AS (
    SELECT COALESCE(SUM(monto), 0) AS total
    FROM gestion.pago_operacion
    WHERE
        deleted_at IS NULL
        AND tipo IN ('SENA', 'SALDO')
        AND DATE_TRUNC('month', (fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Buenos_Aires')::date) = DATE_TRUNC('month', CURRENT_DATE)
),
last_month AS (
    SELECT COALESCE(SUM(monto), 0) AS total
    FROM gestion.pago_operacion
    WHERE
        deleted_at IS NULL
        AND tipo IN ('SENA', 'SALDO')
        AND DATE_TRUNC('month', (fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Buenos_Aires')::date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
)
SELECT
    t.total AS current_amount,
    l.total AS previous_amount,
    CASE
        WHEN l.total = 0 AND t.total > 0 THEN 100
        WHEN l.total = 0 THEN 0
        ELSE ROUND(((t.total - l.total) / l.total) * 100)::INTEGER
    END AS percent_change
FROM this_month t, last_month l;
$$;


ALTER FUNCTION gestion.fn_monthly_revenue() OWNER TO postgres;

--
-- Name: fn_obtener_estado_financiero(bigint); Type: FUNCTION; Schema: gestion; Owner: postgres
--

CREATE FUNCTION gestion.fn_obtener_estado_financiero(p_id_operacion bigint) RETURNS TABLE(monto_total numeric, total_pagado numeric, saldo_pendiente numeric, deposito_garantia numeric, deposito_devuelto numeric, sena_pagada numeric)
    LANGUAGE sql STABLE
    AS $$
    WITH pagos_resumen AS (
        SELECT 
            COALESCE(SUM(monto) FILTER (WHERE tipo IN ('SENA', 'SALDO')), 0) AS t_pagado,
            COALESCE(SUM(monto) FILTER (WHERE tipo = 'DEPOSITO'), 0) AS d_garantia,
            COALESCE(SUM(monto) FILTER (WHERE tipo = 'DEVOLUCION_DEPOSITO'), 0) AS d_devuelto,
            COALESCE(SUM(monto) FILTER (WHERE tipo = 'SENA'), 0) AS s_pagada -- Nueva sumatoria
        FROM gestion.pago_operacion
        WHERE id_operacion = p_id_operacion
          AND deleted_at IS NULL
    )
    SELECT 
        o.monto_total,
        pr.t_pagado AS total_pagado,
        GREATEST(0::numeric, o.monto_total - pr.t_pagado) AS saldo_pendiente,
        pr.d_garantia AS deposito_garantia,
        (COALESCE(a.deposito_devuelto_monto, 0) + pr.d_devuelto) AS deposito_devuelto,
        pr.s_pagada AS sena_pagada
    FROM gestion.operacion o
    LEFT JOIN gestion.alquiler a ON a.id_operacion = o.id_operacion
    CROSS JOIN pagos_resumen pr
    WHERE o.id_operacion = p_id_operacion;
$$;


ALTER FUNCTION gestion.fn_obtener_estado_financiero(p_id_operacion bigint) OWNER TO postgres;

--
-- Name: fn_upcoming_returns(integer); Type: FUNCTION; Schema: gestion; Owner: postgres
--

CREATE FUNCTION gestion.fn_upcoming_returns(p_limit integer DEFAULT 5) RETURNS TABLE(id text, cliente text, disfraz text, retiro text, devolucion text, etapa text)
    LANGUAGE sql STABLE
    AS $$
    SELECT
        o.id_operacion::TEXT,
        CONCAT(p.nombre, ' ', LEFT(p.apellido, 1), '.')  AS cliente,
        COALESCE(pi.nombre, 'Sin pieza')                 AS disfraz,
        TO_CHAR(o.fecha_retiro, 'YYYY-MM-DD')            AS retiro,
        TO_CHAR(a.fecha_devolucion, 'YYYY-MM-DD')        AS devolucion,
        CASE
            WHEN a.etapa = 'RESERVADO'       THEN 'Pendiente'
            WHEN a.etapa = 'LISTO_PARA_RETIRO' THEN 'Confirmado'
            WHEN a.etapa = 'RETIRADO'
                AND a.fecha_devolucion < CURRENT_DATE   THEN 'Por vencer'
            ELSE 'Activo'
        END                                              AS etapa
    FROM gestion.alquiler a
    JOIN gestion.operacion o ON o.id_operacion = a.id_operacion
    LEFT JOIN gestion.cliente c ON c.id_cliente = o.id_cliente
    LEFT JOIN gestion.persona p ON p.id_persona = c.id_persona
    LEFT JOIN (
        SELECT DISTINCT ON (id_operacion)
            id_operacion, id_pieza_stock
        FROM gestion.operacion_detalle
        ORDER BY id_operacion, id_operacion_detalle
    ) od ON od.id_operacion = o.id_operacion
    LEFT JOIN gestion.pieza_stock ps ON ps.id_pieza_stock = od.id_pieza_stock
    LEFT JOIN gestion.pieza pi ON pi.id_pieza = ps.id_pieza
    WHERE
        a.etapa IN ('RETIRADO', 'LISTO_PARA_RETIRO', 'RESERVADO')
        AND o.deleted_at IS NULL
    ORDER BY a.fecha_devolucion ASC NULLS LAST
    LIMIT p_limit;
$$;


ALTER FUNCTION gestion.fn_upcoming_returns(p_limit integer) OWNER TO postgres;

--
-- Name: trg_check_pago_limits(); Type: FUNCTION; Schema: gestion; Owner: postgres
--

CREATE FUNCTION gestion.trg_check_pago_limits() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_monto_total NUMERIC := 0;
  v_deposito_pactado NUMERIC := 0;
  v_sena_pactada NUMERIC := 0;
  v_deposito_pagado NUMERIC := 0;
  v_deposito_devuelto NUMERIC := 0;
  v_sena_pagada NUMERIC := 0;
  v_saldo_pagado NUMERIC := 0;
BEGIN
  -- Si el pago está siendo eliminado, no validamos el límite
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.tipo IN ('DEPOSITO', 'DEVOLUCION_DEPOSITO', 'SENA', 'SALDO') THEN
    -- Obtener montos pactados
    SELECT o.monto_total, a.deposito_monto, v.sena_monto 
    INTO v_monto_total, v_deposito_pactado, v_sena_pactada
    FROM gestion.operacion o
    LEFT JOIN gestion.alquiler a ON a.id_operacion = o.id_operacion
    LEFT JOIN gestion.venta v ON v.id_operacion = o.id_operacion
    WHERE o.id_operacion = NEW.id_operacion;

    -- Obtener depósito pagado
    SELECT COALESCE(SUM(monto), 0) INTO v_deposito_pagado
    FROM gestion.pago_operacion
    WHERE id_operacion = NEW.id_operacion 
      AND tipo = 'DEPOSITO' 
      AND deleted_at IS NULL 
      AND id_pago_operacion != COALESCE(NEW.id_pago_operacion, -1);

    -- Obtener depósito devuelto
    SELECT COALESCE(SUM(monto), 0) INTO v_deposito_devuelto
    FROM gestion.pago_operacion
    WHERE id_operacion = NEW.id_operacion 
      AND tipo = 'DEVOLUCION_DEPOSITO' 
      AND deleted_at IS NULL 
      AND id_pago_operacion != COALESCE(NEW.id_pago_operacion, -1);

    -- Obtener seña pagada
    SELECT COALESCE(SUM(monto), 0) INTO v_sena_pagada
    FROM gestion.pago_operacion
    WHERE id_operacion = NEW.id_operacion 
      AND tipo = 'SENA' 
      AND deleted_at IS NULL 
      AND id_pago_operacion != COALESCE(NEW.id_pago_operacion, -1);

    -- Obtener saldo pagado
    SELECT COALESCE(SUM(monto), 0) INTO v_saldo_pagado
    FROM gestion.pago_operacion
    WHERE id_operacion = NEW.id_operacion 
      AND tipo = 'SALDO' 
      AND deleted_at IS NULL 
      AND id_pago_operacion != COALESCE(NEW.id_pago_operacion, -1);

    -- Validaciones
    IF NEW.tipo = 'DEPOSITO' THEN
      IF (v_deposito_pagado + NEW.monto) > COALESCE(v_deposito_pactado, 0) THEN
        RAISE EXCEPTION 'El depósito no puede superar el monto acordado en el alquiler';
      END IF;
    ELSIF NEW.tipo = 'DEVOLUCION_DEPOSITO' THEN
      IF (v_deposito_devuelto + NEW.monto) > v_deposito_pagado THEN
        RAISE EXCEPTION 'No se puede devolver más del depósito disponible';
      END IF;
    ELSIF NEW.tipo = 'SENA' THEN
      IF (v_sena_pagada + NEW.monto) > COALESCE(v_sena_pactada, 0) THEN
        RAISE EXCEPTION 'La seña no puede superar el monto acordado en la venta';
      END IF;
      IF (v_sena_pagada + v_saldo_pagado + NEW.monto) > v_monto_total THEN
        RAISE EXCEPTION 'La suma de seña y saldo no puede superar el monto total de la operación';
      END IF;
    ELSIF NEW.tipo = 'SALDO' THEN
      IF (v_sena_pagada + v_saldo_pagado + NEW.monto) > v_monto_total THEN
        RAISE EXCEPTION 'El saldo a pagar no puede superar el saldo pendiente de la operación';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION gestion.trg_check_pago_limits() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alquiler; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.alquiler (
    id_alquiler bigint NOT NULL,
    id_operacion bigint NOT NULL,
    etapa gestion."EtapaAlquiler" DEFAULT 'RESERVADO'::gestion."EtapaAlquiler" NOT NULL,
    fecha_devolucion timestamp(3) without time zone,
    deposito_monto numeric(12,2) DEFAULT 0 NOT NULL,
    deposito_devuelto_monto numeric(12,2) DEFAULT 0 NOT NULL,
    deposito_motivo_retencion character varying(255),
    CONSTRAINT chk_alquiler_deposito_devuelto_positivo CHECK ((deposito_devuelto_monto >= (0)::numeric)),
    CONSTRAINT chk_alquiler_deposito_positivo CHECK ((deposito_monto >= (0)::numeric))
);


ALTER TABLE gestion.alquiler OWNER TO postgres;

--
-- Name: alquiler_id_alquiler_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.alquiler_id_alquiler_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.alquiler_id_alquiler_seq OWNER TO postgres;

--
-- Name: alquiler_id_alquiler_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.alquiler_id_alquiler_seq OWNED BY gestion.alquiler.id_alquiler;


--
-- Name: categoria_motivo; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.categoria_motivo (
    id_categoria_motivo bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE gestion.categoria_motivo OWNER TO postgres;

--
-- Name: categoria_motivo_id_categoria_motivo_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.categoria_motivo_id_categoria_motivo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.categoria_motivo_id_categoria_motivo_seq OWNER TO postgres;

--
-- Name: categoria_motivo_id_categoria_motivo_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.categoria_motivo_id_categoria_motivo_seq OWNED BY gestion.categoria_motivo.id_categoria_motivo;


--
-- Name: categoria_motivo_imagen; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.categoria_motivo_imagen (
    id_categoria_motivo_imagen bigint NOT NULL,
    id_categoria_motivo bigint NOT NULL,
    id_imagen bigint NOT NULL,
    es_principal boolean DEFAULT false NOT NULL
);


ALTER TABLE gestion.categoria_motivo_imagen OWNER TO postgres;

--
-- Name: categoria_motivo_imagen_id_categoria_motivo_imagen_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.categoria_motivo_imagen_id_categoria_motivo_imagen_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.categoria_motivo_imagen_id_categoria_motivo_imagen_seq OWNER TO postgres;

--
-- Name: categoria_motivo_imagen_id_categoria_motivo_imagen_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.categoria_motivo_imagen_id_categoria_motivo_imagen_seq OWNED BY gestion.categoria_motivo_imagen.id_categoria_motivo_imagen;


--
-- Name: cliente; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.cliente (
    id_cliente bigint NOT NULL,
    id_persona bigint NOT NULL,
    domicilio character varying(255),
    telefono character varying(50) NOT NULL,
    fecha_alta date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    motivo_baja character varying(255),
    deleted_at timestamp(3) without time zone,
    CONSTRAINT chk_cliente_telefono CHECK (((telefono)::text ~ '^[0-9]{10}$'::text))
);


ALTER TABLE gestion.cliente OWNER TO postgres;

--
-- Name: cliente_id_cliente_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.cliente_id_cliente_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.cliente_id_cliente_seq OWNER TO postgres;

--
-- Name: cliente_id_cliente_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.cliente_id_cliente_seq OWNED BY gestion.cliente.id_cliente;


--
-- Name: disfraz; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.disfraz (
    id_disfraz bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE gestion.disfraz OWNER TO postgres;

--
-- Name: disfraz_id_disfraz_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.disfraz_id_disfraz_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.disfraz_id_disfraz_seq OWNER TO postgres;

--
-- Name: disfraz_id_disfraz_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.disfraz_id_disfraz_seq OWNED BY gestion.disfraz.id_disfraz;


--
-- Name: disfraz_imagen; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.disfraz_imagen (
    id_disfraz_imagen bigint NOT NULL,
    id_disfraz bigint NOT NULL,
    id_imagen bigint NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    orden smallint DEFAULT 0 NOT NULL
);


ALTER TABLE gestion.disfraz_imagen OWNER TO postgres;

--
-- Name: disfraz_imagen_id_disfraz_imagen_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.disfraz_imagen_id_disfraz_imagen_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.disfraz_imagen_id_disfraz_imagen_seq OWNER TO postgres;

--
-- Name: disfraz_imagen_id_disfraz_imagen_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.disfraz_imagen_id_disfraz_imagen_seq OWNED BY gestion.disfraz_imagen.id_disfraz_imagen;


--
-- Name: disfraz_pieza; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.disfraz_pieza (
    id_disfraz_pieza bigint NOT NULL,
    id_disfraz bigint NOT NULL,
    id_pieza bigint NOT NULL
);


ALTER TABLE gestion.disfraz_pieza OWNER TO postgres;

--
-- Name: disfraz_pieza_id_disfraz_pieza_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.disfraz_pieza_id_disfraz_pieza_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.disfraz_pieza_id_disfraz_pieza_seq OWNER TO postgres;

--
-- Name: disfraz_pieza_id_disfraz_pieza_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.disfraz_pieza_id_disfraz_pieza_seq OWNED BY gestion.disfraz_pieza.id_disfraz_pieza;


--
-- Name: imagen; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.imagen (
    id_imagen bigint NOT NULL,
    url text NOT NULL,
    thumbnail_url text,
    texto_alt character varying(255),
    fecha_subida timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE gestion.imagen OWNER TO postgres;

--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.imagen_id_imagen_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.imagen_id_imagen_seq OWNER TO postgres;

--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.imagen_id_imagen_seq OWNED BY gestion.imagen.id_imagen;


--
-- Name: interaccion_operacion; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.interaccion_operacion (
    id_interaccion_operacion bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_persona bigint NOT NULL,
    id_operacion bigint NOT NULL,
    tipo gestion."TipoInteraccion" NOT NULL,
    fecha_hora timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    observaciones text,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE gestion.interaccion_operacion OWNER TO postgres;

--
-- Name: interaccion_operacion_id_interaccion_operacion_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.interaccion_operacion_id_interaccion_operacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.interaccion_operacion_id_interaccion_operacion_seq OWNER TO postgres;

--
-- Name: interaccion_operacion_id_interaccion_operacion_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.interaccion_operacion_id_interaccion_operacion_seq OWNED BY gestion.interaccion_operacion.id_interaccion_operacion;


--
-- Name: operacion_detalle; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.operacion_detalle (
    id_operacion_detalle bigint NOT NULL,
    id_operacion bigint NOT NULL,
    id_pieza_stock bigint NOT NULL
);


ALTER TABLE gestion.operacion_detalle OWNER TO postgres;

--
-- Name: pieza_stock; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.pieza_stock (
    id_pieza_stock bigint NOT NULL,
    id_pieza bigint NOT NULL,
    talle character varying(20),
    medidas text,
    estado_pieza_stock gestion."EstadoPiezaStock" DEFAULT 'DISPONIBLE'::gestion."EstadoPiezaStock" NOT NULL,
    descripcion text,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE gestion.pieza_stock OWNER TO postgres;

--
-- Name: mv_disfraces_populares; Type: MATERIALIZED VIEW; Schema: gestion; Owner: postgres
--

CREATE MATERIALIZED VIEW gestion.mv_disfraces_populares AS
 SELECT d.id_disfraz,
    count(od.id_operacion_detalle) AS ops_count
   FROM (((gestion.disfraz d
     JOIN gestion.disfraz_pieza dp ON ((d.id_disfraz = dp.id_disfraz)))
     JOIN gestion.pieza_stock ps ON ((dp.id_pieza = ps.id_pieza)))
     JOIN gestion.operacion_detalle od ON ((ps.id_pieza_stock = od.id_pieza_stock)))
  WHERE (d.deleted_at IS NULL)
  GROUP BY d.id_disfraz
  ORDER BY (count(od.id_operacion_detalle)) DESC
 LIMIT 4
  WITH NO DATA;


ALTER MATERIALIZED VIEW gestion.mv_disfraces_populares OWNER TO postgres;

--
-- Name: operacion; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.operacion (
    id_operacion bigint NOT NULL,
    id_cliente bigint NOT NULL,
    fecha_constitucion timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_retiro timestamp(3) without time zone,
    monto_total numeric(12,2) DEFAULT 0 NOT NULL,
    observaciones text,
    deleted_at timestamp(3) without time zone,
    motivo_diferencia_monto text,
    CONSTRAINT chk_operacion_monto_total_positivo CHECK ((monto_total >= (0)::numeric))
);


ALTER TABLE gestion.operacion OWNER TO postgres;

--
-- Name: operacion_detalle_id_operacion_detalle_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.operacion_detalle_id_operacion_detalle_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.operacion_detalle_id_operacion_detalle_seq OWNER TO postgres;

--
-- Name: operacion_detalle_id_operacion_detalle_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.operacion_detalle_id_operacion_detalle_seq OWNED BY gestion.operacion_detalle.id_operacion_detalle;


--
-- Name: operacion_id_operacion_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.operacion_id_operacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.operacion_id_operacion_seq OWNER TO postgres;

--
-- Name: operacion_id_operacion_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.operacion_id_operacion_seq OWNED BY gestion.operacion.id_operacion;


--
-- Name: pago_operacion; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.pago_operacion (
    id_pago_operacion bigint NOT NULL,
    id_persona bigint NOT NULL,
    id_operacion bigint NOT NULL,
    tipo gestion."TipoPago" NOT NULL,
    metodo gestion."MetodoPago" NOT NULL,
    monto numeric(12,2) NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE gestion.pago_operacion OWNER TO postgres;

--
-- Name: pago_operacion_id_pago_operacion_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.pago_operacion_id_pago_operacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.pago_operacion_id_pago_operacion_seq OWNER TO postgres;

--
-- Name: pago_operacion_id_pago_operacion_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.pago_operacion_id_pago_operacion_seq OWNED BY gestion.pago_operacion.id_pago_operacion;


--
-- Name: permiso; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.permiso (
    id_permiso bigint NOT NULL,
    nombre character varying(80) NOT NULL,
    descripcion character varying(255)
);


ALTER TABLE gestion.permiso OWNER TO postgres;

--
-- Name: permiso_id_permiso_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.permiso_id_permiso_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.permiso_id_permiso_seq OWNER TO postgres;

--
-- Name: permiso_id_permiso_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.permiso_id_permiso_seq OWNED BY gestion.permiso.id_permiso;


--
-- Name: persona; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.persona (
    id_persona bigint NOT NULL,
    documento character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    deleted_at timestamp(3) without time zone,
    CONSTRAINT chk_persona_apellido CHECK (((apellido)::text ~ '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'']+$'::text)),
    CONSTRAINT chk_persona_documento CHECK (((documento)::text ~ '^[0-9]{8}$'::text)),
    CONSTRAINT chk_persona_nombre CHECK (((nombre)::text ~ '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'']+$'::text))
);


ALTER TABLE gestion.persona OWNER TO postgres;

--
-- Name: persona_id_persona_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.persona_id_persona_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.persona_id_persona_seq OWNER TO postgres;

--
-- Name: persona_id_persona_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.persona_id_persona_seq OWNED BY gestion.persona.id_persona;


--
-- Name: pieza; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.pieza (
    id_pieza bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE gestion.pieza OWNER TO postgres;

--
-- Name: pieza_categoria; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.pieza_categoria (
    id_pieza_categoria bigint NOT NULL,
    id_pieza bigint NOT NULL,
    id_categoria_motivo bigint NOT NULL
);


ALTER TABLE gestion.pieza_categoria OWNER TO postgres;

--
-- Name: pieza_categoria_id_pieza_categoria_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.pieza_categoria_id_pieza_categoria_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.pieza_categoria_id_pieza_categoria_seq OWNER TO postgres;

--
-- Name: pieza_categoria_id_pieza_categoria_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.pieza_categoria_id_pieza_categoria_seq OWNED BY gestion.pieza_categoria.id_pieza_categoria;


--
-- Name: pieza_id_pieza_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.pieza_id_pieza_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.pieza_id_pieza_seq OWNER TO postgres;

--
-- Name: pieza_id_pieza_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.pieza_id_pieza_seq OWNED BY gestion.pieza.id_pieza;


--
-- Name: pieza_imagen; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.pieza_imagen (
    id_pieza_imagen bigint NOT NULL,
    id_pieza bigint NOT NULL,
    id_imagen bigint NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    orden smallint DEFAULT 0 NOT NULL
);


ALTER TABLE gestion.pieza_imagen OWNER TO postgres;

--
-- Name: pieza_imagen_id_pieza_imagen_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.pieza_imagen_id_pieza_imagen_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.pieza_imagen_id_pieza_imagen_seq OWNER TO postgres;

--
-- Name: pieza_imagen_id_pieza_imagen_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.pieza_imagen_id_pieza_imagen_seq OWNED BY gestion.pieza_imagen.id_pieza_imagen;


--
-- Name: pieza_stock_id_pieza_stock_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.pieza_stock_id_pieza_stock_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.pieza_stock_id_pieza_stock_seq OWNER TO postgres;

--
-- Name: pieza_stock_id_pieza_stock_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.pieza_stock_id_pieza_stock_seq OWNED BY gestion.pieza_stock.id_pieza_stock;


--
-- Name: pieza_stock_imagen; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.pieza_stock_imagen (
    id_pieza_stock_imagen bigint NOT NULL,
    id_pieza_stock bigint NOT NULL,
    id_imagen bigint NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    orden smallint DEFAULT 0 NOT NULL
);


ALTER TABLE gestion.pieza_stock_imagen OWNER TO postgres;

--
-- Name: pieza_stock_imagen_id_pieza_stock_imagen_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.pieza_stock_imagen_id_pieza_stock_imagen_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.pieza_stock_imagen_id_pieza_stock_imagen_seq OWNER TO postgres;

--
-- Name: pieza_stock_imagen_id_pieza_stock_imagen_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.pieza_stock_imagen_id_pieza_stock_imagen_seq OWNED BY gestion.pieza_stock_imagen.id_pieza_stock_imagen;


--
-- Name: rol; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.rol (
    id_rol bigint NOT NULL,
    nombre character varying(60) NOT NULL,
    descripcion character varying(255)
);


ALTER TABLE gestion.rol OWNER TO postgres;

--
-- Name: rol_id_rol_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.rol_id_rol_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.rol_id_rol_seq OWNER TO postgres;

--
-- Name: rol_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.rol_id_rol_seq OWNED BY gestion.rol.id_rol;


--
-- Name: rol_permiso; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.rol_permiso (
    id_rol bigint NOT NULL,
    id_permiso bigint NOT NULL
);


ALTER TABLE gestion.rol_permiso OWNER TO postgres;

--
-- Name: usuario; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.usuario (
    id_usuario bigint NOT NULL,
    id_persona bigint NOT NULL,
    id_rol bigint NOT NULL,
    correo character varying(100) NOT NULL,
    contrasena text NOT NULL,
    deleted_at timestamp(3) without time zone,
    foto_url text,
    CONSTRAINT check_correo_format CHECK (((correo)::text ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'::text)),
    CONSTRAINT chk_usuario_correo CHECK (((correo)::text ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'::text))
);


ALTER TABLE gestion.usuario OWNER TO postgres;

--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.usuario_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.usuario_id_usuario_seq OWNER TO postgres;

--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.usuario_id_usuario_seq OWNED BY gestion.usuario.id_usuario;


--
-- Name: venta; Type: TABLE; Schema: gestion; Owner: postgres
--

CREATE TABLE gestion.venta (
    id_venta bigint NOT NULL,
    id_operacion bigint NOT NULL,
    etapa gestion."EtapaVenta" DEFAULT 'RESERVADO'::gestion."EtapaVenta" NOT NULL,
    especificaciones_medidas text,
    sena_monto numeric(12,2) DEFAULT 0 NOT NULL,
    CONSTRAINT chk_venta_sena_positiva CHECK ((sena_monto >= (0)::numeric))
);


ALTER TABLE gestion.venta OWNER TO postgres;

--
-- Name: v_active_operations_details; Type: VIEW; Schema: gestion; Owner: postgres
--

CREATE VIEW gestion.v_active_operations_details AS
 SELECT o.id_operacion,
    (((p.nombre)::text || ' '::text) || (p.apellido)::text) AS cliente,
    'Alquiler'::text AS tipo,
    (a.etapa)::text AS etapa,
    o.fecha_retiro AS fecha,
    (((a.etapa = 'RETIRADO'::gestion."EtapaAlquiler") AND ((a.fecha_devolucion)::date < CURRENT_DATE)) OR ((a.etapa = ANY (ARRAY['RESERVADO'::gestion."EtapaAlquiler", 'LISTO_PARA_RETIRO'::gestion."EtapaAlquiler"])) AND ((o.fecha_retiro)::date < CURRENT_DATE))) AS es_atrasado,
    a.fecha_devolucion AS fecha_fin
   FROM (((gestion.operacion o
     JOIN gestion.cliente c ON ((c.id_cliente = o.id_cliente)))
     JOIN gestion.persona p ON ((p.id_persona = c.id_persona)))
     JOIN gestion.alquiler a ON ((a.id_operacion = o.id_operacion)))
  WHERE ((o.deleted_at IS NULL) AND (a.etapa = ANY (ARRAY['RESERVADO'::gestion."EtapaAlquiler", 'LISTO_PARA_RETIRO'::gestion."EtapaAlquiler", 'RETIRADO'::gestion."EtapaAlquiler"])))
UNION ALL
 SELECT o.id_operacion,
    (((p.nombre)::text || ' '::text) || (p.apellido)::text) AS cliente,
    'Venta'::text AS tipo,
    (v.etapa)::text AS etapa,
    o.fecha_retiro AS fecha,
    ((v.etapa = ANY (ARRAY['RESERVADO'::gestion."EtapaVenta", 'LISTO_PARA_ENTREGA'::gestion."EtapaVenta"])) AND ((o.fecha_retiro)::date < CURRENT_DATE)) AS es_atrasado,
    NULL::timestamp without time zone AS fecha_fin
   FROM (((gestion.operacion o
     JOIN gestion.cliente c ON ((c.id_cliente = o.id_cliente)))
     JOIN gestion.persona p ON ((p.id_persona = c.id_persona)))
     JOIN gestion.venta v ON ((v.id_operacion = o.id_operacion)))
  WHERE ((o.deleted_at IS NULL) AND (v.etapa = ANY (ARRAY['RESERVADO'::gestion."EtapaVenta", 'LISTO_PARA_ENTREGA'::gestion."EtapaVenta"])));


ALTER VIEW gestion.v_active_operations_details OWNER TO postgres;

--
-- Name: v_disfraz_publico; Type: VIEW; Schema: gestion; Owner: postgres
--

CREATE VIEW gestion.v_disfraz_publico AS
 SELECT id_disfraz,
    nombre,
    descripcion,
    ( SELECT img.url
           FROM (gestion.disfraz_imagen di
             JOIN gestion.imagen img ON ((di.id_imagen = img.id_imagen)))
          WHERE ((di.id_disfraz = d.id_disfraz) AND (di.es_principal = true))
         LIMIT 1) AS imagen_principal,
    ( SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', cm.id_categoria_motivo, 'nombre', cm.nombre)), '[]'::jsonb) AS "coalesce"
           FROM ((gestion.disfraz_pieza dp
             JOIN gestion.pieza_categoria pc ON ((dp.id_pieza = pc.id_pieza)))
             JOIN gestion.categoria_motivo cm ON ((pc.id_categoria_motivo = cm.id_categoria_motivo)))
          WHERE (dp.id_disfraz = d.id_disfraz)) AS categorias,
    ( SELECT COALESCE(jsonb_agg(DISTINCT ps.talle) FILTER (WHERE (ps.talle IS NOT NULL)), '[]'::jsonb) AS "coalesce"
           FROM (gestion.disfraz_pieza dp
             JOIN gestion.pieza_stock ps ON ((dp.id_pieza = ps.id_pieza)))
          WHERE ((dp.id_disfraz = d.id_disfraz) AND (ps.estado_pieza_stock = 'DISPONIBLE'::gestion."EstadoPiezaStock") AND (ps.deleted_at IS NULL))) AS talles,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM (gestion.disfraz_pieza dp
                 JOIN gestion.pieza_stock ps ON ((dp.id_pieza = ps.id_pieza)))
              WHERE ((dp.id_disfraz = d.id_disfraz) AND (ps.estado_pieza_stock = 'DISPONIBLE'::gestion."EstadoPiezaStock") AND (ps.deleted_at IS NULL)))) THEN 'DISPONIBLE'::text
            WHEN (EXISTS ( SELECT 1
               FROM (gestion.disfraz_pieza dp
                 JOIN gestion.pieza_stock ps ON ((dp.id_pieza = ps.id_pieza)))
              WHERE ((dp.id_disfraz = d.id_disfraz) AND (ps.estado_pieza_stock = 'RESERVADA'::gestion."EstadoPiezaStock") AND (ps.deleted_at IS NULL)))) THEN 'RESERVADA'::text
            WHEN (EXISTS ( SELECT 1
               FROM (gestion.disfraz_pieza dp
                 JOIN gestion.pieza_stock ps ON ((dp.id_pieza = ps.id_pieza)))
              WHERE ((dp.id_disfraz = d.id_disfraz) AND (ps.estado_pieza_stock = 'ALQUILADA'::gestion."EstadoPiezaStock") AND (ps.deleted_at IS NULL)))) THEN 'ALQUILADA'::text
            ELSE 'SIN_STOCK'::text
        END AS disponibilidad,
    deleted_at
   FROM gestion.disfraz d;


ALTER VIEW gestion.v_disfraz_publico OWNER TO postgres;

--
-- Name: v_recent_movements; Type: VIEW; Schema: gestion; Owner: postgres
--

CREATE VIEW gestion.v_recent_movements AS
 SELECT i.id_interaccion_operacion,
    i.tipo AS status_raw,
        CASE
            WHEN (i.tipo = 'RETIRO'::gestion."TipoInteraccion") THEN 'Pickup'::text
            WHEN (i.tipo = 'DEVOLUCION'::gestion."TipoInteraccion") THEN 'Return'::text
            WHEN (op.alquiler_id IS NULL) THEN 'Sale'::text
            ELSE 'Otra'::text
        END AS status,
    p_item.nombre AS item_name,
    ps.talle AS item_size,
    (o.id_operacion)::text AS item_id,
    concat(p_cli.nombre, ' ', p_cli.apellido) AS customer_name,
    concat(p_emp.nombre, ' ', p_emp.apellido) AS employee_name,
    upper(("left"((p_emp.nombre)::text, 1) || "left"((p_emp.apellido)::text, 1))) AS employee_initials,
    i.fecha_hora AS time_ago
   FROM (((((((((gestion.interaccion_operacion i
     JOIN gestion.operacion o ON ((o.id_operacion = i.id_operacion)))
     LEFT JOIN gestion.cliente c ON ((c.id_cliente = o.id_cliente)))
     LEFT JOIN gestion.persona p_cli ON ((p_cli.id_persona = c.id_persona)))
     JOIN gestion.usuario u ON ((u.id_usuario = i.id_usuario)))
     JOIN gestion.persona p_emp ON ((p_emp.id_persona = u.id_persona)))
     LEFT JOIN gestion.operacion_detalle od ON (((od.id_operacion = o.id_operacion) AND (od.id_operacion_detalle = ( SELECT min(od2.id_operacion_detalle) AS min
           FROM gestion.operacion_detalle od2
          WHERE (od2.id_operacion = o.id_operacion))))))
     LEFT JOIN gestion.pieza_stock ps ON ((ps.id_pieza_stock = od.id_pieza_stock)))
     LEFT JOIN gestion.pieza p_item ON ((p_item.id_pieza = ps.id_pieza)))
     LEFT JOIN ( SELECT alquiler.id_operacion,
            1 AS alquiler_id
           FROM gestion.alquiler) op ON ((op.id_operacion = o.id_operacion)))
  WHERE (i.deleted_at IS NULL)
  ORDER BY i.fecha_hora DESC;


ALTER VIEW gestion.v_recent_movements OWNER TO postgres;

--
-- Name: venta_id_venta_seq; Type: SEQUENCE; Schema: gestion; Owner: postgres
--

CREATE SEQUENCE gestion.venta_id_venta_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.venta_id_venta_seq OWNER TO postgres;

--
-- Name: venta_id_venta_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: postgres
--

ALTER SEQUENCE gestion.venta_id_venta_seq OWNED BY gestion.venta.id_venta;


--
-- Name: alquiler id_alquiler; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.alquiler ALTER COLUMN id_alquiler SET DEFAULT nextval('gestion.alquiler_id_alquiler_seq'::regclass);


--
-- Name: categoria_motivo id_categoria_motivo; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.categoria_motivo ALTER COLUMN id_categoria_motivo SET DEFAULT nextval('gestion.categoria_motivo_id_categoria_motivo_seq'::regclass);


--
-- Name: categoria_motivo_imagen id_categoria_motivo_imagen; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.categoria_motivo_imagen ALTER COLUMN id_categoria_motivo_imagen SET DEFAULT nextval('gestion.categoria_motivo_imagen_id_categoria_motivo_imagen_seq'::regclass);


--
-- Name: cliente id_cliente; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.cliente ALTER COLUMN id_cliente SET DEFAULT nextval('gestion.cliente_id_cliente_seq'::regclass);


--
-- Name: disfraz id_disfraz; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz ALTER COLUMN id_disfraz SET DEFAULT nextval('gestion.disfraz_id_disfraz_seq'::regclass);


--
-- Name: disfraz_imagen id_disfraz_imagen; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz_imagen ALTER COLUMN id_disfraz_imagen SET DEFAULT nextval('gestion.disfraz_imagen_id_disfraz_imagen_seq'::regclass);


--
-- Name: disfraz_pieza id_disfraz_pieza; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz_pieza ALTER COLUMN id_disfraz_pieza SET DEFAULT nextval('gestion.disfraz_pieza_id_disfraz_pieza_seq'::regclass);


--
-- Name: imagen id_imagen; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.imagen ALTER COLUMN id_imagen SET DEFAULT nextval('gestion.imagen_id_imagen_seq'::regclass);


--
-- Name: interaccion_operacion id_interaccion_operacion; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.interaccion_operacion ALTER COLUMN id_interaccion_operacion SET DEFAULT nextval('gestion.interaccion_operacion_id_interaccion_operacion_seq'::regclass);


--
-- Name: operacion id_operacion; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.operacion ALTER COLUMN id_operacion SET DEFAULT nextval('gestion.operacion_id_operacion_seq'::regclass);


--
-- Name: operacion_detalle id_operacion_detalle; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.operacion_detalle ALTER COLUMN id_operacion_detalle SET DEFAULT nextval('gestion.operacion_detalle_id_operacion_detalle_seq'::regclass);


--
-- Name: pago_operacion id_pago_operacion; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pago_operacion ALTER COLUMN id_pago_operacion SET DEFAULT nextval('gestion.pago_operacion_id_pago_operacion_seq'::regclass);


--
-- Name: permiso id_permiso; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.permiso ALTER COLUMN id_permiso SET DEFAULT nextval('gestion.permiso_id_permiso_seq'::regclass);


--
-- Name: persona id_persona; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.persona ALTER COLUMN id_persona SET DEFAULT nextval('gestion.persona_id_persona_seq'::regclass);


--
-- Name: pieza id_pieza; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza ALTER COLUMN id_pieza SET DEFAULT nextval('gestion.pieza_id_pieza_seq'::regclass);


--
-- Name: pieza_categoria id_pieza_categoria; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_categoria ALTER COLUMN id_pieza_categoria SET DEFAULT nextval('gestion.pieza_categoria_id_pieza_categoria_seq'::regclass);


--
-- Name: pieza_imagen id_pieza_imagen; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_imagen ALTER COLUMN id_pieza_imagen SET DEFAULT nextval('gestion.pieza_imagen_id_pieza_imagen_seq'::regclass);


--
-- Name: pieza_stock id_pieza_stock; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_stock ALTER COLUMN id_pieza_stock SET DEFAULT nextval('gestion.pieza_stock_id_pieza_stock_seq'::regclass);


--
-- Name: pieza_stock_imagen id_pieza_stock_imagen; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_stock_imagen ALTER COLUMN id_pieza_stock_imagen SET DEFAULT nextval('gestion.pieza_stock_imagen_id_pieza_stock_imagen_seq'::regclass);


--
-- Name: rol id_rol; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.rol ALTER COLUMN id_rol SET DEFAULT nextval('gestion.rol_id_rol_seq'::regclass);


--
-- Name: usuario id_usuario; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.usuario ALTER COLUMN id_usuario SET DEFAULT nextval('gestion.usuario_id_usuario_seq'::regclass);


--
-- Name: venta id_venta; Type: DEFAULT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.venta ALTER COLUMN id_venta SET DEFAULT nextval('gestion.venta_id_venta_seq'::regclass);


--
-- Name: alquiler alquiler_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.alquiler
    ADD CONSTRAINT alquiler_pkey PRIMARY KEY (id_alquiler);


--
-- Name: categoria_motivo_imagen categoria_motivo_imagen_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.categoria_motivo_imagen
    ADD CONSTRAINT categoria_motivo_imagen_pkey PRIMARY KEY (id_categoria_motivo_imagen);


--
-- Name: categoria_motivo categoria_motivo_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.categoria_motivo
    ADD CONSTRAINT categoria_motivo_pkey PRIMARY KEY (id_categoria_motivo);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id_cliente);


--
-- Name: disfraz_imagen disfraz_imagen_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz_imagen
    ADD CONSTRAINT disfraz_imagen_pkey PRIMARY KEY (id_disfraz_imagen);


--
-- Name: disfraz_pieza disfraz_pieza_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz_pieza
    ADD CONSTRAINT disfraz_pieza_pkey PRIMARY KEY (id_disfraz_pieza);


--
-- Name: disfraz disfraz_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz
    ADD CONSTRAINT disfraz_pkey PRIMARY KEY (id_disfraz);


--
-- Name: imagen imagen_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.imagen
    ADD CONSTRAINT imagen_pkey PRIMARY KEY (id_imagen);


--
-- Name: interaccion_operacion interaccion_operacion_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.interaccion_operacion
    ADD CONSTRAINT interaccion_operacion_pkey PRIMARY KEY (id_interaccion_operacion);


--
-- Name: operacion_detalle operacion_detalle_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.operacion_detalle
    ADD CONSTRAINT operacion_detalle_pkey PRIMARY KEY (id_operacion_detalle);


--
-- Name: operacion operacion_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.operacion
    ADD CONSTRAINT operacion_pkey PRIMARY KEY (id_operacion);


--
-- Name: pago_operacion pago_operacion_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pago_operacion
    ADD CONSTRAINT pago_operacion_pkey PRIMARY KEY (id_pago_operacion);


--
-- Name: permiso permiso_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.permiso
    ADD CONSTRAINT permiso_pkey PRIMARY KEY (id_permiso);


--
-- Name: persona persona_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.persona
    ADD CONSTRAINT persona_pkey PRIMARY KEY (id_persona);


--
-- Name: pieza_categoria pieza_categoria_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_categoria
    ADD CONSTRAINT pieza_categoria_pkey PRIMARY KEY (id_pieza_categoria);


--
-- Name: pieza_imagen pieza_imagen_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_imagen
    ADD CONSTRAINT pieza_imagen_pkey PRIMARY KEY (id_pieza_imagen);


--
-- Name: pieza pieza_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza
    ADD CONSTRAINT pieza_pkey PRIMARY KEY (id_pieza);


--
-- Name: pieza_stock_imagen pieza_stock_imagen_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_stock_imagen
    ADD CONSTRAINT pieza_stock_imagen_pkey PRIMARY KEY (id_pieza_stock_imagen);


--
-- Name: pieza_stock pieza_stock_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_stock
    ADD CONSTRAINT pieza_stock_pkey PRIMARY KEY (id_pieza_stock);


--
-- Name: rol_permiso rol_permiso_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.rol_permiso
    ADD CONSTRAINT rol_permiso_pkey PRIMARY KEY (id_rol, id_permiso);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id_rol);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- Name: venta venta_pkey; Type: CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.venta
    ADD CONSTRAINT venta_pkey PRIMARY KEY (id_venta);


--
-- Name: alquiler_id_operacion_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX alquiler_id_operacion_key ON gestion.alquiler USING btree (id_operacion);


--
-- Name: categoria_motivo_imagen_id_categoria_motivo_id_imagen_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX categoria_motivo_imagen_id_categoria_motivo_id_imagen_key ON gestion.categoria_motivo_imagen USING btree (id_categoria_motivo, id_imagen);


--
-- Name: cliente_id_persona_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX cliente_id_persona_key ON gestion.cliente USING btree (id_persona);


--
-- Name: disfraz_imagen_id_disfraz_id_imagen_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX disfraz_imagen_id_disfraz_id_imagen_key ON gestion.disfraz_imagen USING btree (id_disfraz, id_imagen);


--
-- Name: disfraz_pieza_id_disfraz_id_pieza_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX disfraz_pieza_id_disfraz_id_pieza_key ON gestion.disfraz_pieza USING btree (id_disfraz, id_pieza);


--
-- Name: idx_mv_disfraces_populares_id; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_disfraces_populares_id ON gestion.mv_disfraces_populares USING btree (id_disfraz);


--
-- Name: idx_pago_operacion_operacion_del; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE INDEX idx_pago_operacion_operacion_del ON gestion.pago_operacion USING btree (id_operacion) WHERE (deleted_at IS NULL);


--
-- Name: operacion_detalle_id_operacion_id_pieza_stock_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX operacion_detalle_id_operacion_id_pieza_stock_key ON gestion.operacion_detalle USING btree (id_operacion, id_pieza_stock);


--
-- Name: permiso_nombre_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX permiso_nombre_key ON gestion.permiso USING btree (nombre);


--
-- Name: persona_documento_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX persona_documento_key ON gestion.persona USING btree (documento);


--
-- Name: pieza_categoria_id_pieza_id_categoria_motivo_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX pieza_categoria_id_pieza_id_categoria_motivo_key ON gestion.pieza_categoria USING btree (id_pieza, id_categoria_motivo);


--
-- Name: pieza_imagen_id_pieza_id_imagen_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX pieza_imagen_id_pieza_id_imagen_key ON gestion.pieza_imagen USING btree (id_pieza, id_imagen);


--
-- Name: pieza_stock_imagen_id_pieza_stock_id_imagen_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX pieza_stock_imagen_id_pieza_stock_id_imagen_key ON gestion.pieza_stock_imagen USING btree (id_pieza_stock, id_imagen);


--
-- Name: rol_nombre_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX rol_nombre_key ON gestion.rol USING btree (nombre);


--
-- Name: usuario_correo_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX usuario_correo_key ON gestion.usuario USING btree (correo);


--
-- Name: usuario_id_persona_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX usuario_id_persona_key ON gestion.usuario USING btree (id_persona);


--
-- Name: venta_id_operacion_key; Type: INDEX; Schema: gestion; Owner: postgres
--

CREATE UNIQUE INDEX venta_id_operacion_key ON gestion.venta USING btree (id_operacion);


--
-- Name: pago_operacion trg_pago_limits_insert; Type: TRIGGER; Schema: gestion; Owner: postgres
--

CREATE TRIGGER trg_pago_limits_insert BEFORE INSERT OR UPDATE ON gestion.pago_operacion FOR EACH ROW EXECUTE FUNCTION gestion.trg_check_pago_limits();


--
-- Name: alquiler alquiler_id_operacion_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.alquiler
    ADD CONSTRAINT alquiler_id_operacion_fkey FOREIGN KEY (id_operacion) REFERENCES gestion.operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categoria_motivo_imagen categoria_motivo_imagen_id_categoria_motivo_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.categoria_motivo_imagen
    ADD CONSTRAINT categoria_motivo_imagen_id_categoria_motivo_fkey FOREIGN KEY (id_categoria_motivo) REFERENCES gestion.categoria_motivo(id_categoria_motivo) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categoria_motivo_imagen categoria_motivo_imagen_id_imagen_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.categoria_motivo_imagen
    ADD CONSTRAINT categoria_motivo_imagen_id_imagen_fkey FOREIGN KEY (id_imagen) REFERENCES gestion.imagen(id_imagen) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cliente cliente_id_persona_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.cliente
    ADD CONSTRAINT cliente_id_persona_fkey FOREIGN KEY (id_persona) REFERENCES gestion.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disfraz_imagen disfraz_imagen_id_disfraz_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz_imagen
    ADD CONSTRAINT disfraz_imagen_id_disfraz_fkey FOREIGN KEY (id_disfraz) REFERENCES gestion.disfraz(id_disfraz) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disfraz_imagen disfraz_imagen_id_imagen_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz_imagen
    ADD CONSTRAINT disfraz_imagen_id_imagen_fkey FOREIGN KEY (id_imagen) REFERENCES gestion.imagen(id_imagen) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disfraz_pieza disfraz_pieza_id_disfraz_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz_pieza
    ADD CONSTRAINT disfraz_pieza_id_disfraz_fkey FOREIGN KEY (id_disfraz) REFERENCES gestion.disfraz(id_disfraz) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disfraz_pieza disfraz_pieza_id_pieza_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.disfraz_pieza
    ADD CONSTRAINT disfraz_pieza_id_pieza_fkey FOREIGN KEY (id_pieza) REFERENCES gestion.pieza(id_pieza) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interaccion_operacion interaccion_operacion_id_operacion_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.interaccion_operacion
    ADD CONSTRAINT interaccion_operacion_id_operacion_fkey FOREIGN KEY (id_operacion) REFERENCES gestion.operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interaccion_operacion interaccion_operacion_id_persona_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.interaccion_operacion
    ADD CONSTRAINT interaccion_operacion_id_persona_fkey FOREIGN KEY (id_persona) REFERENCES gestion.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interaccion_operacion interaccion_operacion_id_usuario_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.interaccion_operacion
    ADD CONSTRAINT interaccion_operacion_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES gestion.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: operacion_detalle operacion_detalle_id_operacion_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.operacion_detalle
    ADD CONSTRAINT operacion_detalle_id_operacion_fkey FOREIGN KEY (id_operacion) REFERENCES gestion.operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: operacion_detalle operacion_detalle_id_pieza_stock_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.operacion_detalle
    ADD CONSTRAINT operacion_detalle_id_pieza_stock_fkey FOREIGN KEY (id_pieza_stock) REFERENCES gestion.pieza_stock(id_pieza_stock) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: operacion operacion_id_cliente_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.operacion
    ADD CONSTRAINT operacion_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES gestion.cliente(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pago_operacion pago_operacion_id_operacion_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pago_operacion
    ADD CONSTRAINT pago_operacion_id_operacion_fkey FOREIGN KEY (id_operacion) REFERENCES gestion.operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pago_operacion pago_operacion_id_persona_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pago_operacion
    ADD CONSTRAINT pago_operacion_id_persona_fkey FOREIGN KEY (id_persona) REFERENCES gestion.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pieza_categoria pieza_categoria_id_categoria_motivo_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_categoria
    ADD CONSTRAINT pieza_categoria_id_categoria_motivo_fkey FOREIGN KEY (id_categoria_motivo) REFERENCES gestion.categoria_motivo(id_categoria_motivo) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pieza_categoria pieza_categoria_id_pieza_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_categoria
    ADD CONSTRAINT pieza_categoria_id_pieza_fkey FOREIGN KEY (id_pieza) REFERENCES gestion.pieza(id_pieza) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pieza_imagen pieza_imagen_id_imagen_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_imagen
    ADD CONSTRAINT pieza_imagen_id_imagen_fkey FOREIGN KEY (id_imagen) REFERENCES gestion.imagen(id_imagen) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pieza_imagen pieza_imagen_id_pieza_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_imagen
    ADD CONSTRAINT pieza_imagen_id_pieza_fkey FOREIGN KEY (id_pieza) REFERENCES gestion.pieza(id_pieza) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pieza_stock pieza_stock_id_pieza_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_stock
    ADD CONSTRAINT pieza_stock_id_pieza_fkey FOREIGN KEY (id_pieza) REFERENCES gestion.pieza(id_pieza) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pieza_stock_imagen pieza_stock_imagen_id_imagen_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_stock_imagen
    ADD CONSTRAINT pieza_stock_imagen_id_imagen_fkey FOREIGN KEY (id_imagen) REFERENCES gestion.imagen(id_imagen) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pieza_stock_imagen pieza_stock_imagen_id_pieza_stock_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.pieza_stock_imagen
    ADD CONSTRAINT pieza_stock_imagen_id_pieza_stock_fkey FOREIGN KEY (id_pieza_stock) REFERENCES gestion.pieza_stock(id_pieza_stock) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rol_permiso rol_permiso_id_permiso_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.rol_permiso
    ADD CONSTRAINT rol_permiso_id_permiso_fkey FOREIGN KEY (id_permiso) REFERENCES gestion.permiso(id_permiso) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rol_permiso rol_permiso_id_rol_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.rol_permiso
    ADD CONSTRAINT rol_permiso_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES gestion.rol(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: usuario usuario_id_persona_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.usuario
    ADD CONSTRAINT usuario_id_persona_fkey FOREIGN KEY (id_persona) REFERENCES gestion.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: usuario usuario_id_rol_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.usuario
    ADD CONSTRAINT usuario_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES gestion.rol(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: venta venta_id_operacion_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: postgres
--

ALTER TABLE ONLY gestion.venta
    ADD CONSTRAINT venta_id_operacion_fkey FOREIGN KEY (id_operacion) REFERENCES gestion.operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 1vrltC9nkQnhZfJhcxNTzrUj7ZZETQYAboMAg5dHDC1hnQZpmh8WZySAtQ8ggzE

