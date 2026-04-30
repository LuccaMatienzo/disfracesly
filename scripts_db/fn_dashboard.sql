-- #1 Función: KPI de Alquileres Activos con Cálculo de Vencimiento
-- gestion.fn_kpi_active_rentals()
-- Reemplaza: getActiveRentals() en dashboard.service.js
-- Retorna: total de ítems, cantidad vencidos, cantidad que vencen hoy

CREATE OR REPLACE FUNCTION gestion.fn_kpi_active_rentals()
RETURNS TABLE (
    total_items  BIGINT,
    overdue      BIGINT,
    due_today    BIGINT
)
LANGUAGE sql
STABLE  -- no modifica datos, permite caching del plan
AS $$
    SELECT
        COUNT(od.id_operacion_detalle)  AS total_items,
        COUNT(*) FILTER (
            WHERE a.fecha_devolucion < CURRENT_DATE
        )                               AS overdue,
        COUNT(*) FILTER (
            WHERE a.fecha_devolucion::date = CURRENT_DATE
        )                               AS due_today
    FROM gestion.alquiler a
    JOIN gestion.operacion o ON o.id_operacion = a.id_operacion
    JOIN gestion.operacion_detalle od ON od.id_operacion = o.id_operacion
    WHERE
        a.etapa = 'RETIRADO'
        AND o.deleted_at IS NULL;
$$;

-- Uso desde Node.js/Prisma:
-- const result = await prisma.$queryRaw`SELECT * FROM gestion.fn_kpi_active_rentals()`;



-- #2 Función: Ingresos Mensuales con Variación Porcentual
-- gestion.fn_monthly_revenue()
-- Reemplaza: getMonthlyRevenue() en dashboard.service.js
-- Retorna: ingresos mes actual, mes anterior y % de cambio

CREATE OR REPLACE FUNCTION gestion.fn_monthly_revenue()
RETURNS TABLE (
    current_amount   NUMERIC,
    previous_amount  NUMERIC,
    percent_change   INTEGER
)
LANGUAGE sql
STABLE
AS $$
    WITH
    this_month AS (
        SELECT COALESCE(SUM(monto), 0) AS total
        FROM gestion.pago_operacion
        WHERE
            deleted_at IS NULL
            AND tipo IN ('SENA', 'DEPOSITO', 'SALDO')
            AND fecha >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    last_month AS (
        SELECT COALESCE(SUM(monto), 0) AS total
        FROM gestion.pago_operacion
        WHERE
            deleted_at IS NULL
            AND tipo IN ('SENA', 'DEPOSITO', 'SALDO')
            AND fecha >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            AND fecha <  DATE_TRUNC('month', CURRENT_DATE)
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



-- #3 Función: Cash Flow del Día
-- FUNCIÓN: gestion.fn_cash_flow_today()
-- Reemplaza: getCashFlowToday() — actualmente 3 queries separadas + reduce() en JS

CREATE OR REPLACE FUNCTION gestion.fn_cash_flow_today()
RETURNS TABLE (
    total_income        NUMERIC,
    deposits_in_custody NUMERIC,
    pending_balance     NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    WITH
    income_today AS (
        SELECT COALESCE(SUM(monto), 0) AS total
        FROM gestion.pago_operacion
        WHERE
            deleted_at IS NULL
            AND tipo IN ('SENA', 'SALDO')
            AND fecha >= CURRENT_DATE
            AND fecha  < CURRENT_DATE + INTERVAL '1 day'
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



-- #4 — Vista: Movimientos Recientes
-- VISTA SIMPLE (para empezar, sin costo de refresh):
-- gestion.v_recent_movements

CREATE OR REPLACE VIEW gestion.v_recent_movements AS
SELECT
    i.id_interaccion_operacion,
    i.tipo                                              AS status_raw,
    CASE
        WHEN i.tipo = 'RETIRO'    THEN 'Pickup'
        WHEN i.tipo = 'DEVOLUCION' THEN 'Return'
        WHEN op.alquiler_id IS NULL THEN 'Sale'
        ELSE 'Otra'
    END                                                 AS status,
    p_item.nombre                                       AS item_name,
    ps.talle                                            AS item_size,
    o.id_operacion::TEXT                                AS item_id,
    CONCAT(p_cli.nombre, ' ', p_cli.apellido)           AS customer_name,
    CONCAT(p_emp.nombre, ' ', p_emp.apellido)           AS employee_name,
    UPPER(LEFT(p_emp.nombre,1) || LEFT(p_emp.apellido,1)) AS employee_initials,
    i.fecha_hora                                        AS time_ago
FROM gestion.interaccion_operacion i
JOIN gestion.operacion o ON o.id_operacion = i.id_operacion
LEFT JOIN gestion.cliente c ON c.id_cliente = o.id_cliente
LEFT JOIN gestion.persona p_cli ON p_cli.id_persona = c.id_persona
JOIN gestion.usuario u ON u.id_usuario = i.id_usuario
JOIN gestion.persona p_emp ON p_emp.id_persona = u.id_persona
LEFT JOIN gestion.operacion_detalle od ON od.id_operacion = o.id_operacion
    AND od.id_operacion_detalle = (
        SELECT MIN(od2.id_operacion_detalle)
        FROM gestion.operacion_detalle od2
        WHERE od2.id_operacion = o.id_operacion
    )
LEFT JOIN gestion.pieza_stock ps ON ps.id_pieza_stock = od.id_pieza_stock
LEFT JOIN gestion.pieza p_item ON p_item.id_pieza = ps.id_pieza
LEFT JOIN (SELECT id_operacion, 1 AS alquiler_id FROM gestion.alquiler) op
    ON op.id_operacion = o.id_operacion
WHERE i.deleted_at IS NULL
ORDER BY i.fecha_hora DESC;



-- #5 Función: Próximos Alquileres a Vencer
-- FUNCIÓN: gestion.fn_upcoming_returns(p_limit INT DEFAULT 5)
-- Reemplaza: getUpcomingReturns() — lógica de etiquetas de etapa en JS

CREATE OR REPLACE FUNCTION gestion.fn_upcoming_returns(p_limit INT DEFAULT 5)
RETURNS TABLE (
    id           TEXT,
    cliente      TEXT,
    disfraz      TEXT,
    retiro       TEXT,
    devolucion   TEXT,
    etapa        TEXT
)
LANGUAGE sql
STABLE
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
