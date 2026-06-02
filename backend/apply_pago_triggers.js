const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sqlFunction = `
CREATE OR REPLACE FUNCTION gestion.trg_check_pago_limits()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;
`;

const sqlDropTrigger = `DROP TRIGGER IF EXISTS trg_pago_limits_insert ON gestion.pago_operacion;`;

const sqlCreateTrigger = `
CREATE TRIGGER trg_pago_limits_insert
BEFORE INSERT OR UPDATE ON gestion.pago_operacion
FOR EACH ROW EXECUTE FUNCTION gestion.trg_check_pago_limits();
`;

async function main() {
  await prisma.$executeRawUnsafe(sqlFunction);
  await prisma.$executeRawUnsafe(sqlDropTrigger);
  await prisma.$executeRawUnsafe(sqlCreateTrigger);
  console.log('Triggers created successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
