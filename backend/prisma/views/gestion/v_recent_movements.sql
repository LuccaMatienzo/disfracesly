SELECT
  i.id_interaccion_operacion,
  i.tipo AS status_raw,
  CASE
    WHEN (i.tipo = 'RETIRO' :: "TipoInteraccion") THEN 'Pickup' :: text
    WHEN (i.tipo = 'DEVOLUCION' :: "TipoInteraccion") THEN 'Return' :: text
    WHEN (op.alquiler_id IS NULL) THEN 'Sale' :: text
    ELSE 'Otra' :: text
  END AS STATUS,
  p_item.nombre AS item_name,
  ps.talle AS item_size,
  (o.id_operacion) :: text AS item_id,
  concat(p_cli.nombre, ' ', p_cli.apellido) AS customer_name,
  concat(p_emp.nombre, ' ', p_emp.apellido) AS employee_name,
  upper(
    (
      "left"((p_emp.nombre) :: text, 1) || "left"((p_emp.apellido) :: text, 1)
    )
  ) AS employee_initials,
  i.fecha_hora AS time_ago
FROM
  (
    (
      (
        (
          (
            (
              (
                (
                  (
                    interaccion_operacion i
                    JOIN operacion o ON ((o.id_operacion = i.id_operacion))
                  )
                  LEFT JOIN cliente c ON ((c.id_cliente = o.id_cliente))
                )
                LEFT JOIN persona p_cli ON ((p_cli.id_persona = c.id_persona))
              )
              JOIN usuario u ON ((u.id_usuario = i.id_usuario))
            )
            JOIN persona p_emp ON ((p_emp.id_persona = u.id_persona))
          )
          LEFT JOIN operacion_detalle od ON (
            (
              (od.id_operacion = o.id_operacion)
              AND (
                od.id_operacion_detalle = (
                  SELECT
                    min(od2.id_operacion_detalle) AS min
                  FROM
                    operacion_detalle od2
                  WHERE
                    (od2.id_operacion = o.id_operacion)
                )
              )
            )
          )
        )
        LEFT JOIN pieza_stock ps ON ((ps.id_pieza_stock = od.id_pieza_stock))
      )
      LEFT JOIN pieza p_item ON ((p_item.id_pieza = ps.id_pieza))
    )
    LEFT JOIN (
      SELECT
        alquiler.id_operacion,
        1 AS alquiler_id
      FROM
        alquiler
    ) op ON ((op.id_operacion = o.id_operacion))
  )
WHERE
  (i.deleted_at IS NULL)
ORDER BY
  i.fecha_hora DESC;