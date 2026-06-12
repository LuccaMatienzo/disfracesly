SELECT
  id_disfraz,
  nombre,
  descripcion,
  (
    SELECT
      img.url
    FROM
      (
        disfraz_imagen di
        JOIN imagen img ON ((di.id_imagen = img.id_imagen))
      )
    WHERE
      (
        (di.id_disfraz = d.id_disfraz)
        AND (di.es_principal = TRUE)
      )
    LIMIT
      1
  ) AS imagen_principal,
  (
    SELECT
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id',
            cm.id_categoria_motivo,
            'nombre',
            cm.nombre
          )
        ),
        '[]' :: jsonb
      ) AS "coalesce"
    FROM
      (
        (
          disfraz_pieza dp
          JOIN pieza_categoria pc ON ((dp.id_pieza = pc.id_pieza))
        )
        JOIN categoria_motivo cm ON (
          (pc.id_categoria_motivo = cm.id_categoria_motivo)
        )
      )
    WHERE
      (dp.id_disfraz = d.id_disfraz)
  ) AS categorias,
  (
    SELECT
      COALESCE(
        jsonb_agg(DISTINCT ps.talle) FILTER (
          WHERE
            (ps.talle IS NOT NULL)
        ),
        '[]' :: jsonb
      ) AS "coalesce"
    FROM
      (
        disfraz_pieza dp
        JOIN pieza_stock ps ON ((dp.id_pieza = ps.id_pieza))
      )
    WHERE
      (
        (dp.id_disfraz = d.id_disfraz)
        AND (
          ps.estado_pieza_stock = 'DISPONIBLE' :: "EstadoPiezaStock"
        )
        AND (ps.deleted_at IS NULL)
      )
  ) AS talles,
  CASE
    WHEN (
      EXISTS (
        SELECT
          1
        FROM
          (
            disfraz_pieza dp
            JOIN pieza_stock ps ON ((dp.id_pieza = ps.id_pieza))
          )
        WHERE
          (
            (dp.id_disfraz = d.id_disfraz)
            AND (
              ps.estado_pieza_stock = 'DISPONIBLE' :: "EstadoPiezaStock"
            )
            AND (ps.deleted_at IS NULL)
          )
      )
    ) THEN 'DISPONIBLE' :: text
    WHEN (
      EXISTS (
        SELECT
          1
        FROM
          (
            disfraz_pieza dp
            JOIN pieza_stock ps ON ((dp.id_pieza = ps.id_pieza))
          )
        WHERE
          (
            (dp.id_disfraz = d.id_disfraz)
            AND (
              ps.estado_pieza_stock = 'RESERVADA' :: "EstadoPiezaStock"
            )
            AND (ps.deleted_at IS NULL)
          )
      )
    ) THEN 'RESERVADA' :: text
    WHEN (
      EXISTS (
        SELECT
          1
        FROM
          (
            disfraz_pieza dp
            JOIN pieza_stock ps ON ((dp.id_pieza = ps.id_pieza))
          )
        WHERE
          (
            (dp.id_disfraz = d.id_disfraz)
            AND (
              ps.estado_pieza_stock = 'ALQUILADA' :: "EstadoPiezaStock"
            )
            AND (ps.deleted_at IS NULL)
          )
      )
    ) THEN 'ALQUILADA' :: text
    ELSE 'SIN_STOCK' :: text
  END AS disponibilidad,
  deleted_at
FROM
  disfraz d;