-- ================================================================================
-- Disfracesly - DDL (PostgreSQL)
-- Esquema: gestion
--
-- SECCIÓN A por separado (conectado a postgres) y luego 
-- conectarse a la DB 'disfracesly' para ejecutar SECCIÓN B+.
-- ================================================================================

-- ================================================================================
-- SECCIÓN A) Roles + Base de datos (EJECUTAR COMO superusuario, p.ej. postgres)
-- Esta parte no iría al repositorio claramente, ni creación de roles ni passwords.
-- ================================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'disfracesly_owner') THEN
    CREATE ROLE disfracesly_owner LOGIN PASSWORD 'OWNER_PASSWORD';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'disfracesly_app') THEN
    CREATE ROLE disfracesly_app LOGIN PASSWORD 'APP_PASSWORD';
  END IF;
END
$$;

-- (Postgres no tiene CREATE DATABASE IF NOT EXISTS)
CREATE DATABASE disfracesly OWNER disfracesly_owner;

-- Conectarse a la BD
-- \c disfracesly


-- =============================================================================
-- SECCIÓN B) Seguridad + Esquema (EJECUTAR YA CONECTADO A la DB 'disfracesly')
-- =============================================================================

-- Por seguridad: revocar privilegios del esquema public
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Crear esquema de negocio si no existe
CREATE SCHEMA IF NOT EXISTS gestion AUTHORIZATION disfracesly_owner;

-- Permisos básicos a la app
GRANT CONNECT ON DATABASE disfracesly TO disfracesly_app;
GRANT USAGE ON SCHEMA gestion TO disfracesly_app;

-- Los DEFAULT PRIVILEGES aplican al rol que CREA objetos.
-- Si las tablas las crea disfracesly_owner, entonces el default debe ser FOR ROLE disfracesly_owner.
ALTER DEFAULT PRIVILEGES FOR ROLE disfracesly_owner IN SCHEMA gestion
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO disfracesly_app;

ALTER DEFAULT PRIVILEGES FOR ROLE disfracesly_owner IN SCHEMA gestion
  GRANT USAGE, SELECT ON SEQUENCES TO disfracesly_app;

-- Search path por defecto (para no tener que poner en cada sentencia gestion.[object_name])
ALTER ROLE disfracesly_app   SET search_path TO gestion, public;
ALTER ROLE disfracesly_owner SET search_path TO gestion, public;

SET search_path TO gestion;


-- =============================================================================
-- SECCIÓN C) Tablas
-- =============================================================================

-- --- Catálogo / Stock --------------------------------------------------------

CREATE TABLE IF NOT EXISTS categoria_motivo (
  id_categoria_motivo BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL,
  descripcion         TEXT,
  deleted_at          TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS pieza (
  id_pieza     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  deleted_at   TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS disfraz (
  id_disfraz    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   TEXT,
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS pieza_categoria (
  id_pieza_categoria  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pieza            BIGINT NOT NULL,
  id_categoria_motivo BIGINT NOT NULL,

  CONSTRAINT uq_pieza_motivo UNIQUE (id_pieza, id_categoria_motivo),

  CONSTRAINT fk_pcm_pieza FOREIGN KEY (id_pieza)
    REFERENCES pieza(id_pieza) ON DELETE CASCADE,
  CONSTRAINT fk_pcm_motivo FOREIGN KEY (id_categoria_motivo)
    REFERENCES categoria_motivo(id_categoria_motivo) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disfraz_pieza (
  id_disfraz_pieza BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_disfraz       BIGINT NOT NULL,
  id_pieza         BIGINT NOT NULL,

  CONSTRAINT uq_disfraz_pieza UNIQUE (id_disfraz, id_pieza),

  CONSTRAINT fk_dp_disfraz FOREIGN KEY (id_disfraz)
    REFERENCES disfraz(id_disfraz) ON DELETE CASCADE,
  CONSTRAINT fk_dp_pieza FOREIGN KEY (id_pieza)
    REFERENCES pieza(id_pieza) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pieza_stock (
  id_pieza_stock      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pieza            BIGINT NOT NULL,
  talle               VARCHAR(20),
  medidas             TEXT,
  estado_pieza_stock  VARCHAR(50) NOT NULL DEFAULT 'DISPONIBLE',
  descripcion         TEXT,
  deleted_at          TIMESTAMPTZ DEFAULT NULL,

  CONSTRAINT fk_piezastock_pieza FOREIGN KEY (id_pieza)
    REFERENCES pieza(id_pieza) ON DELETE RESTRICT,

  CONSTRAINT ck_pieza_stock_estado_pieza CHECK (
    estado_pieza_stock IN ('DISPONIBLE','RESERVADA','ALQUILADA','VENDIDA','FUERA_DE_SERVICIO')
  )
);

-- --- Personas / Seguridad ----------------------------------------------------

CREATE TABLE IF NOT EXISTS persona (
  id_persona   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  documento    VARCHAR(20)  NOT NULL,
  nombre       VARCHAR(100) NOT NULL,
  apellido     VARCHAR(100) NOT NULL,
  deleted_at   TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT uq_persona_documento UNIQUE (documento)
);

CREATE TABLE IF NOT EXISTS rol (
  id_rol       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       VARCHAR(60) NOT NULL,
  descripcion  VARCHAR(255),
  CONSTRAINT uq_rol_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS permiso (
  id_permiso   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL,
  descripcion  VARCHAR(255),
  CONSTRAINT uq_permiso_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS rol_permiso (
  id_rol     BIGINT NOT NULL,
  id_permiso BIGINT NOT NULL,
  PRIMARY KEY (id_rol, id_permiso),
  CONSTRAINT fk_rol_permiso_rol FOREIGN KEY (id_rol)
    REFERENCES rol(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (id_permiso)
    REFERENCES permiso(id_permiso) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_persona  BIGINT NOT NULL,
  id_rol      BIGINT NOT NULL,
  correo      VARCHAR(100) NOT NULL,
  contrasena  TEXT NOT NULL,
  deleted_at  TIMESTAMPTZ DEFAULT NULL,

  CONSTRAINT uq_usuario_correo UNIQUE (correo),
  CONSTRAINT uq_usuario_id_persona UNIQUE (id_persona),

  CONSTRAINT fk_usuario_persona FOREIGN KEY (id_persona)
    REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol)
    REFERENCES rol(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS cliente (
  id_cliente  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_persona  BIGINT NOT NULL,
  domicilio   VARCHAR(255),
  telefono    VARCHAR(50) NOT NULL,
  fecha_alta  DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo_baja VARCHAR(255),
  deleted_at  TIMESTAMPTZ DEFAULT NULL,

  CONSTRAINT uq_cliente_id_persona UNIQUE (id_persona),
  CONSTRAINT fk_cliente_persona FOREIGN KEY (id_persona)
    REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- --- Operaciones -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS operacion (
  id_operacion       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente         BIGINT NOT NULL,
  fecha_constitucion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_retiro       TIMESTAMPTZ NULL,
  monto_total        NUMERIC(12,2) NOT NULL DEFAULT 0,
  observaciones      TEXT,
  deleted_at         TIMESTAMPTZ DEFAULT NULL,

  CONSTRAINT fk_operacion_cliente FOREIGN KEY (id_cliente)
    REFERENCES cliente(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT ck_operacion_monto_total_nonneg CHECK (monto_total >= 0)
);

CREATE TABLE IF NOT EXISTS operacion_detalle (
  id_operacion_detalle BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_operacion         BIGINT NOT NULL,
  id_pieza_stock       BIGINT NOT NULL,

  CONSTRAINT uq_operacion_detalle UNIQUE (id_operacion, id_pieza_stock),

  CONSTRAINT fk_operacion_detalle_operacion FOREIGN KEY (id_operacion)
    REFERENCES operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_operacion_detalle_pieza_stock FOREIGN KEY (id_pieza_stock)
    REFERENCES pieza_stock(id_pieza_stock) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS alquiler (
  id_alquiler               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_operacion              BIGINT NOT NULL,
  etapa                     VARCHAR(30) NOT NULL DEFAULT 'RESERVADO',
  fecha_devolucion          TIMESTAMPTZ NULL,
  deposito_monto            NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposito_devuelto_monto   NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposito_motivo_retencion VARCHAR(255),

  CONSTRAINT uq_alquiler_id_operacion UNIQUE (id_operacion),

  CONSTRAINT fk_alquiler_operacion FOREIGN KEY (id_operacion)
    REFERENCES operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT ck_alquiler_etapa CHECK (etapa IN ('RESERVADO','LISTO_PARA_RETIRO','RETIRADO','DEVUELTO','CANCELADO')),
  CONSTRAINT ck_alquiler_deposito_nonneg CHECK (deposito_monto >= 0 AND deposito_devuelto_monto >= 0),
  CONSTRAINT ck_alquiler_deposito_devuelto_ok CHECK (deposito_devuelto_monto <= deposito_monto)
);

CREATE TABLE IF NOT EXISTS venta (
  id_venta                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_operacion             BIGINT NOT NULL,
  etapa                    VARCHAR(30) NOT NULL DEFAULT 'RESERVADO',
  fecha_entrega_estimada   TIMESTAMPTZ NULL,
  especificaciones_medidas TEXT,
  sena_monto               NUMERIC(12,2) NOT NULL DEFAULT 0,

  CONSTRAINT uq_venta_id_operacion UNIQUE (id_operacion),

  CONSTRAINT fk_venta_operacion FOREIGN KEY (id_operacion)
    REFERENCES operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT ck_venta_etapa CHECK (etapa IN ('RESERVADO','LISTO_PARA_ENTREGA','ENTREGADO','VENDIDO','CANCELADO')),
  CONSTRAINT ck_venta_sena_nonneg CHECK (sena_monto >= 0)
);

-- --- Interacciones / Pagos ---------------------------------------------------

CREATE TABLE IF NOT EXISTS interaccion_operacion (
  id_interaccion_operacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario    BIGINT NOT NULL,
  id_persona    BIGINT NOT NULL,
  id_operacion  BIGINT NOT NULL,
  tipo          VARCHAR(30) NOT NULL,
  fecha_hora    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  deleted_at    TIMESTAMPTZ DEFAULT NULL,

  CONSTRAINT fk_interaccion_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_interaccion_persona FOREIGN KEY (id_persona)
    REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_interaccion_operacion FOREIGN KEY (id_operacion)
    REFERENCES operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT ck_interaccion_tipo CHECK (tipo IN ('RETIRO','DEVOLUCION','OTRA'))
);

CREATE TABLE IF NOT EXISTS pago_operacion (
  id_pago_operacion BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_persona        BIGINT         NOT NULL,
  id_operacion      BIGINT         NOT NULL,
  tipo              VARCHAR(30)    NOT NULL,
  metodo            VARCHAR(30)    NOT NULL,
  monto             NUMERIC(12,2)  NOT NULL,
  fecha             TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMPTZ    DEFAULT NULL,

  CONSTRAINT fk_pago_persona FOREIGN KEY (id_persona)
    REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_pago_operacion FOREIGN KEY (id_operacion)
    REFERENCES operacion(id_operacion) ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT ck_pago_tipo CHECK (tipo IN ('SENA','DEPOSITO','SALDO','DEVOLUCION_DEPOSITO','AJUSTE')),
  CONSTRAINT ck_pago_metodo CHECK (metodo IN ('EFECTIVO','TRANSFERENCIA')),
  CONSTRAINT ck_pago_monto_nonzero CHECK (monto <> 0)
);

-- --- Imagenes ---------------------------------------------------

CREATE TABLE IF NOT EXISTS imagen (
  id_imagen        BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url              TEXT            NOT NULL,
  thumbnail_url    TEXT,
  texto_alt        VARCHAR(255)    NULL,     -- Texto alternativo (Buenas prácticas SEO/Accesibilidad en React)
  fecha_subida     TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at       TIMESTAMPTZ     DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS pieza_imagen (
  id_pieza_imagen  BIGINT   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pieza         BIGINT   NOT NULL,
  id_imagen        BIGINT   NOT NULL,
  es_principal     BOOLEAN  DEFAULT false,
  orden            SMALLINT DEFAULT 0,
  CONSTRAINT uq_pieza_imagen UNIQUE (id_pieza, id_imagen),

  CONSTRAINT fk_pieza_imagen_pieza FOREIGN KEY (id_pieza)
    REFERENCES pieza(id_pieza) ON DELETE CASCADE,

  CONSTRAINT fk_pieza_imagen_imagen FOREIGN KEY (id_imagen)
    REFERENCES imagen(id_imagen) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pieza_stock_imagen (
  id_pieza_stock_imagen   BIGINT     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pieza_stock          BIGINT     NOT NULL,
  id_imagen               BIGINT     NOT NULL,
  es_principal            BOOLEAN    DEFAULT false,
  orden                   SMALLINT   DEFAULT 0,
  CONSTRAINT uq_pieza_stock_imagen UNIQUE (id_pieza_stock, id_imagen),

  CONSTRAINT fk_ps_imagen_stock FOREIGN KEY (id_pieza_stock)
    REFERENCES pieza_stock(id_pieza_stock) ON DELETE CASCADE,

  CONSTRAINT fk_ps_imagen_imagen FOREIGN KEY (id_imagen)
    REFERENCES imagen(id_imagen) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disfraz_imagen (
  id_disfraz_imagen BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_disfraz        BIGINT    NOT NULL,
  id_imagen         BIGINT    NOT NULL,
  es_principal      BOOLEAN   DEFAULT false,
  orden             SMALLINT  DEFAULT 0,
  CONSTRAINT uq_disfraz_imagen UNIQUE (id_disfraz, id_imagen),

  CONSTRAINT fk_disfraz_imagen_disfraz FOREIGN KEY (id_disfraz)
    REFERENCES disfraz(id_disfraz) ON DELETE CASCADE,

  CONSTRAINT fk_disfraz_imagen_imagen FOREIGN KEY (id_imagen)
    REFERENCES imagen(id_imagen) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categoria_motivo_imagen (
  id_categoria_motivo_imagen  BIGINT   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_categoria_motivo         BIGINT   NOT NULL,
  id_imagen                   BIGINT   NOT NULL,
  es_principal                BOOLEAN  DEFAULT false,
  CONSTRAINT uq_categoria_motivo_imagen UNIQUE (id_categoria_motivo, id_imagen),

  CONSTRAINT fk_cm_imagen_categoria FOREIGN KEY (id_categoria_motivo)
    REFERENCES categoria_motivo(id_categoria_motivo) ON DELETE CASCADE,

  CONSTRAINT fk_cm_imagen_imagen FOREIGN KEY (id_imagen)
    REFERENCES imagen(id_imagen) ON DELETE CASCADE
);


-- =============================================================================
-- SECCIÓN D) Índices (joins/filtros típicos)
-- =============================================================================

CREATE INDEX IF NOT EXISTS ix_operacion_id_cliente ON gestion.operacion(id_cliente);

CREATE INDEX IF NOT EXISTS ix_operacion_detalle_id_operacion   ON gestion.operacion_detalle(id_operacion);
CREATE INDEX IF NOT EXISTS ix_operacion_detalle_id_pieza_stock ON gestion.operacion_detalle(id_pieza_stock);

CREATE INDEX IF NOT EXISTS ix_pago_operacion_id_operacion ON gestion.pago_operacion(id_operacion);
CREATE INDEX IF NOT EXISTS ix_pago_operacion_id_persona  ON gestion.pago_operacion(id_persona);

CREATE INDEX IF NOT EXISTS ix_interaccion_operacion_id_operacion ON gestion.interaccion_operacion(id_operacion);
CREATE INDEX IF NOT EXISTS ix_interaccion_operacion_id_usuario    ON gestion.interaccion_operacion(id_usuario);
CREATE INDEX IF NOT EXISTS ix_interaccion_operacion_id_persona    ON gestion.interaccion_operacion(id_persona);

CREATE INDEX IF NOT EXISTS ix_usuario_id_rol     ON gestion.usuario(id_rol);
CREATE INDEX IF NOT EXISTS ix_usuario_id_persona ON gestion.usuario(id_persona);
CREATE INDEX IF NOT EXISTS ix_cliente_id_persona ON gestion.cliente(id_persona);

CREATE INDEX IF NOT EXISTS ix_pieza_stock_id_pieza ON gestion.pieza_stock(id_pieza);

CREATE INDEX IF NOT EXISTS ix_pieza_categoria_id_categoria_motivo ON gestion.pieza_categoria(id_categoria_motivo);
CREATE INDEX IF NOT EXISTS ix_disfraz_pieza_id_pieza              ON gestion.disfraz_pieza(id_pieza);

CREATE UNIQUE INDEX uq_pieza_imagen_principal
ON pieza_imagen (id_pieza)
WHERE es_principal = true;

CREATE UNIQUE INDEX uq_pieza_stock_imagen_principal
ON pieza_stock_imagen (id_pieza_stock)
WHERE es_principal = true;

CREATE UNIQUE INDEX uq_disfraz_imagen_principal
ON disfraz_imagen (id_disfraz)
WHERE es_principal = true;

CREATE UNIQUE INDEX uq_categoria_motivo_imagen_principal
ON categoria_motivo_imagen (id_categoria_motivo)
WHERE es_principal = true;

CREATE INDEX ix_pieza_imagen_orden ON pieza_imagen (id_pieza, orden);
CREATE INDEX ix_ps_imagen_orden ON pieza_stock_imagen (id_pieza_stock, orden);
CREATE INDEX ix_disfraz_imagen_orden ON disfraz_imagen (id_disfraz, orden);
CREATE INDEX ix_cm_imagen_orden ON categoria_motivo_imagen (id_categoria_motivo, id_imagen);

-- =============================================================================
-- SECCIÓN E) TRIGGERS 
-- =============================================================================

--- Operación = Alquiler XOR Venta (total + exclusiva) ---

CREATE OR REPLACE FUNCTION gestion.fn_check_operacion_subtipo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_alquiler boolean;
  has_venta boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM gestion.alquiler a WHERE a.id_operacion = NEW.id_operacion)
    INTO has_alquiler;

  SELECT EXISTS (SELECT 1 FROM gestion.venta v WHERE v.id_operacion = NEW.id_operacion)
    INTO has_venta;

  IF (has_alquiler = has_venta) THEN
    RAISE EXCEPTION
      'Operación % debe ser exactamente un subtipo: alquiler XOR venta (actual: alquiler=%, venta=%)',
      NEW.id_operacion, has_alquiler, has_venta;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_operacion_subtipo ON gestion.operacion;

CREATE CONSTRAINT TRIGGER trg_check_operacion_subtipo
AFTER INSERT OR UPDATE ON gestion.operacion
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION gestion.fn_check_operacion_subtipo();
