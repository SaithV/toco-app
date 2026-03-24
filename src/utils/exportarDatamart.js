import ExcelJS from 'exceljs';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: convierte el valor de un campo de procedimiento a número
// - Si es vacío / null / undefined → 0
// - Si es número (o string numérico) → el valor numérico
// - Si es cualquier texto ('X', 'HX', etc.) → 1
// ─────────────────────────────────────────────────────────────────────────────
function valorANumero(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  if (!isNaN(n)) return n;
  return 1; // cualquier texto no vacío cuenta como 1
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapeo ordenado: key del objeto → columna Excel (H en adelante)
// Debe coincidir EXACTAMENTE con el orden de columnas del molde
// ─────────────────────────────────────────────────────────────────────────────
const COLS_PROC = [
  { key: 'vma',            col: 'H' },
  { key: 'cpap',           col: 'I' },
  { key: 'cardioversion',  col: 'J' },
  { key: 'cvc',            col: 'K' },
  { key: 'vesical',        col: 'L' },
  { key: 'sng',            col: 'M' },
  { key: 'sog',            col: 'N' },
  { key: 'pleural',        col: 'O' },
  { key: 'curaciones',     col: 'P' },
  { key: 'tenckhoff',      col: 'Q' },
  { key: 'interconsultas', col: 'R' },
  { key: 'paracentesis',   col: 'S' },
  { key: 'toracocentesis', col: 'T' },
  { key: 'artrocentesis',  col: 'U' },
  { key: 'lumbar',         col: 'V' },
  { key: 'drenaje',        col: 'W' },
  { key: 'suturas',        col: 'X' },
  { key: 'npt',            col: 'Y' },
];

// Todas las columnas que participan en los totales (incluyendo Z = total por fila)
const COLS_TOTALES = [...COLS_PROC.map((c) => c.col), 'Z'];

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera y descarga el reporte DataMart en formato .xlsx.
 *
 * @param {Object} params
 * @param {Array}  params.registros  - registrosDatamart del store
 * @param {string} params.periodo    - texto del periodo, ej. '16 MARZO AL 15 ABRIL 2026'
 * @param {number} params.egresos    - total de egresos del mes (para calcular %)
 * @param {string} params.servicio   - nombre del servicio, ej. 'HOSPITALIZACION CIRUGIA'
 */
export async function exportarExcelDatamart({ registros, periodo, egresos, servicio }) {
  try {
    // ── 1. Cargar molde ────────────────────────────────────────────────────
    const response = await fetch('/molde_datamart.xlsx');
    if (!response.ok) {
      throw new Error(
        `No se encontró 'molde_datamart.xlsx' en /public. Status: ${response.status}`
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());

    const ws = workbook.worksheets[0];
    if (!ws) throw new Error('El molde no contiene ninguna hoja.');

    // ── 2. Cabeceras ───────────────────────────────────────────────────────
    ws.getCell('B8').value = servicio ?? '';
    ws.getCell('R8').value = (periodo ?? '').toUpperCase();

    // ── 3. Mapeo de filas (12 a 31) ────────────────────────────────────────
    const datos = registros.slice(0, 20);

    datos.forEach((reg, i) => {
      const r = 12 + i;

      // Consecutivo, fecha, nombre y origen
      ws.getCell(`A${r}`).value = i + 1;
      ws.getCell(`B${r}`).value = reg.fecha  || '';
      ws.getCell(`C${r}`).value = reg.nombre || '';
      ws.getCell(`D${r}`).value = reg.origen === 'De la Unidad'   ? 'X' : '';
      ws.getCell(`E${r}`).value = reg.origen === 'De otra unidad' ? 'X' : '';
      ws.getCell(`G${r}`).value = reg.hosp   || '';

      // Procedimientos H–Y
      let totalFila = 0;
      COLS_PROC.forEach(({ key, col }) => {
        const v = reg[key] ?? '';
        ws.getCell(`${col}${r}`).value = v || '';
        totalFila += valorANumero(v);
      });

      // Total por paciente — columna Z
      ws.getCell(`Z${r}`).value = totalFila || '';
    });

    // ── 4. Totales y porcentajes (filas 32 y 33) ──────────────────────────
    COLS_TOTALES.forEach((col) => {
      let suma = 0;

      // Suma las filas 12 a 31 de esta columna
      for (let fila = 12; fila <= 31; fila++) {
        suma += valorANumero(ws.getCell(`${col}${fila}`).value);
      }

      // Fila 32: total absoluto
      ws.getCell(`${col}32`).value = suma > 0 ? suma : '';

      // Fila 33: porcentaje relativo a los egresos del mes
      const pct = egresos > 0 ? Math.round((suma / egresos) * 100) : 0;
      ws.getCell(`${col}33`).value = suma > 0 ? `${pct}%` : '';
    });

    // ── 5. Generar descarga ────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'DataMart_Mes.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('[exportarDatamart] Error:', error);
    alert('Error al generar el DataMart:\n' + error.message);
  }
}
