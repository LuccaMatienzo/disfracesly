SELECT
  o.id_operacion,
  (
    ((p.nombre) :: text || ' ' :: text) || (p.apellido) :: text
  ) AS cliente,
  'Alquiler' :: text AS tipo,
  (a.etapa) :: text AS etapa,
  o.fecha_retiro AS fecha,
  (
    (
      (a.etapa = 'RETIRADO' :: "EtapaAlquiler")
      AND ((a.fecha_devolucion) :: date < CURRENT_DATE)
    )
    OR (
      (
        a.etapa = ANY (
          ARRAY ['RESERVADO'::"EtapaAlquiler", 'LISTO_PARA_RETIRO'::"EtapaAlquiler"]
        )
      )
      AND ((o.fecha_retiro) :: date < CURRENT_DATE)
    )
  ) AS es_atrasado,
  a.fecha_devolucion AS fecha_fin
FROM
  (
    (
      (
        operacion o
        JOIN cliente c ON ((c.id_cliente = o.id_cliente))
      )
      JOIN persona p ON ((p.id_persona = c.id_persona))
    )
    JOIN alquiler a ON ((a.id_operacion = o.id_operacion))
  )
WHERE
  (
    (o.deleted_at IS NULL)
    AND (
      a.etapa = ANY (
        ARRAY ['RESERVADO'::"EtapaAlquiler", 'LISTO_PARA_RETIRO'::"EtapaAlquiler", 'RETIRADO'::"EtapaAlquiler"]
      )
    )
  )
UNION
ALL
SELECT
  o.id_operacion,
  (
    ((p.nombre) :: text || ' ' :: text) || (p.apellido) :: text
  ) AS cliente,
  'Venta' :: text AS tipo,
  (v.etapa) :: text AS etapa,
  o.fecha_retiro AS fecha,
  (
    (
      v.etapa = ANY (
        ARRAY ['RESERVADO'::"EtapaVenta", 'LISTO_PARA_ENTREGA'::"EtapaVenta"]
      )
    )
    AND ((o.fecha_retiro) :: date < CURRENT_DATE)
  ) AS es_atrasado,
  NULL :: timestamp without time zone AS fecha_fin
FROM
  (
    (
      (
        operacion o
        JOIN cliente c ON ((c.id_cliente = o.id_cliente))
      )
      JOIN persona p ON ((p.id_persona = c.id_persona))
    )
    JOIN venta v ON ((v.id_operacion = o.id_operacion))
  )
WHERE
  (
    (o.deleted_at IS NULL)
    AND (
      v.etapa = ANY (
        ARRAY ['RESERVADO'::"EtapaVenta", 'LISTO_PARA_ENTREGA'::"EtapaVenta"]
      )
    )
  );