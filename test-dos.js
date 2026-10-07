const API_URL = process.argv[2] || 'http://localhost:5000/api/auth/login';
const MAX_ATTEMPTS = 25; // Ejecutaremos 25 intentos (el límite es 20)

console.log(`\n\x1b[36m============================================================\x1b[0m`);
console.log(`\x1b[1m\x1b[31m INICIANDO SIMULACIÓN DE ATAQUE DoS/BF\x1b[0m`);
console.log(`\x1b[36m============================================================\x1b[0m`);
console.log(`\x1b[33mObjetivo:\x1b[0m ${API_URL}`);
console.log(`\x1b[33mIntentos configurados:\x1b[0m ${MAX_ATTEMPTS}`);
console.log(`\x1b[36m------------------------------------------------------------\x1b[0m\n`);

async function runAttack() {
  let blockedCount = 0;
  let processedCount = 0;

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      // Simulamos probar combinaciones de correos y contraseñas (Fuerza Bruta)
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `atacante${i}@correo.com`,
          password: `pass_aleatoria_${i}`
        })
      });

      const status = response.status;

      if (status === 429) {
        blockedCount++;
        // Formato rojo con fondo para resaltar el bloqueo
        console.log(`\x1b[41m\x1b[37m [INTENTO ${i.toString().padStart(2, '0')}] BLOQUEADO \x1b[0m \x1b[31m--> Estado HTTP ${status} (Too Many Requests) \x1b[0m`);

        const data = await response.json().catch(() => ({}));
        console.log(`\x1b[31m   ↳ Respuesta de la API: "${data.error || 'Rate limit excedido'}"\x1b[0m`);
      } else {
        processedCount++;
        // Formato verde para los intentos procesados (generalmente darán 401 Unauthorized o 400 Bad Request)
        console.log(`\x1b[32m [INTENTO ${i.toString().padStart(2, '0')}] PROCESADO \x1b[0m \x1b[32m--> Estado HTTP ${status} (Base de datos consultada)\x1b[0m`);
      }

      // Pequeño delay artificial (50ms) entre peticiones
      await new Promise(r => setTimeout(r, 50));

    } catch (err) {
      console.log(`\x1b[31m [INTENTO ${i.toString().padStart(2, '0')}] ERROR \x1b[0m --> No se pudo conectar al servidor: ${err.message}`);
    }
  }

  console.log(`\n\x1b[36m============================================================\x1b[0m`);
  console.log(`\x1b[1m\x1b[32m  REPORTE DE LA AUDITORÍA DE SEGURIDAD \x1b[0m`);
  console.log(`\x1b[36m============================================================\x1b[0m`);
  console.log(`  🔹 Peticiones procesadas (Llegaron a BD): \x1b[1m${processedCount}\x1b[0m`);
  console.log(`  🔹 Peticiones rechazadas (Mitigadas):     \x1b[1m\x1b[31m${blockedCount}\x1b[0m`);

  if (blockedCount > 0 && processedCount === 20) {
    console.log(`\n\x1b[42m\x1b[30m ÉXITO \x1b[0m \x1b[32mEl Rate Limiting y el Trust Proxy operaron correctamente.\x1b[0m`);
    console.log(`\x1b[32mEl atacante fue mitigado exactamente en el intento 21.\x1b[0m`);
  } else {
    console.log(`\n\x1b[43m\x1b[30m ADVERTENCIA \x1b[0m \x1b[33mLos resultados difieren de la configuración de 20 peticiones.\x1b[0m`);
  }
  console.log(`\x1b[36m============================================================\x1b[0m\n`);
}

runAttack();
