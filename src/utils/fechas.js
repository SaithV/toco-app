// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE FECHAS — compartidas entre PlaneadorMensual y exportarExcel
// ─────────────────────────────────────────────────────────────────────────────

const MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

/**
 * Calcula las 8 semanas de trabajo del rol IMSS a partir de la fecha de inicio
 * del periodo (ej. '2026-03-16').
 *
 * Lógica:
 *  1. Determina los dos meses que abarca el rol (mes de inicio y el siguiente).
 *  2. Encuentra el primer lunes ≥ al día 1 del mes de inicio.
 *  3. Genera 8 bloques de 7 días con formato 'DD-DD' (rellenando con cero).
 *
 * @param {string} periodoInicio  - 'YYYY-MM-DD'
 * @returns {{ mes1: string, mes2: string, semanas: string[] }}
 *   Ejemplo: { mes1: 'MARZO', mes2: 'ABRIL', semanas: ['02-08', '09-15', …] }
 */
export function calcularSemanasRol(periodoInicio) {
  // ── Parsear sin UTC ───────────────────────────────────────────────────────
  const [anio, mes, ] = periodoInicio.split('-').map(Number);

  // Mes1 = mes del periodo, Mes2 = siguiente
  const mes1 = MESES[mes - 1];
  const mes2Idx = mes % 12;          // 0-based: mes 3 (marzo) → índice 3 → abril
  const mes2 = MESES[mes2Idx];

  // ── Encontrar el primer lunes del mes de inicio ───────────────────────────
  // Iteramos desde el día 1 hasta el 7 buscando el lunes (getDay() === 1)
  let cursor = new Date(anio, mes - 1, 1);
  while (cursor.getDay() !== 1) {
    cursor.setDate(cursor.getDate() + 1);
  }

  // ── Generar 8 semanas de 7 días ───────────────────────────────────────────
  const pad = (n) => String(n).padStart(2, '0');
  const semanas = [];

  for (let s = 0; s < 8; s++) {
    const inicio = new Date(cursor);
    const fin    = new Date(cursor);
    fin.setDate(fin.getDate() + 6);

    semanas.push(`${pad(inicio.getDate())}-${pad(fin.getDate())}`);
    cursor.setDate(cursor.getDate() + 7);
  }

  return { mes1, mes2, semanas };
}
