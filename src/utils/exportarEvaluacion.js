import ExcelJS from 'exceljs';

// ─────────────────────────────────────────────────────────────────────────────
// Columnas ExcelJS (1-based) para los 4 empleados evaluados.
// Corresponden a las columnas C, D, F, G del molde.
// ─────────────────────────────────────────────────────────────────────────────
const COL_EMPLEADOS = [3, 4, 6, 7]; // C=3, D=4, F=6, G=7

// Filas donde va la calificación de cada pregunta (preguntas 0-16 → filas 9-25)
const FILA_PRIMERA_PREGUNTA = 9;
const NUM_PREGUNTAS = 17;

// Fila del total obtenido y del % de desempeño
const FILA_TOTAL   = 26;
const FILA_PORCENT = 28;
// Celda del total global (promedio de todos los evaluados)
const CELDA_GLOBAL = 'B29';

// Filas de observaciones
const FILAS_OBS = [31, 32, 33, 34];

// Filas de nombres + firmas de los evaluados (uno por fila, filas 37-40)
const FILAS_EVALUADOS = [37, 38, 39, 40];
// Columna de texto del nombre del evaluado (A)
const COL_NOMBRE_EVAL = 1;
// Columna de inicio de la imagen de firma del evaluado (col C = índice 0-based 2)
const COL_FIRMA_EVAL_IMG = 2;

// Fila y columna de firma del evaluador
const FILA_EVALUADOR = 43;
const COL_FIRMA_EVALUADOR_IMG = 1; // col B = índice 0-based 1

// ─────────────────────────────────────────────────────────────────────────────
// Helper: convierte un dataURL base64 (image/png) al string base64 puro
// ─────────────────────────────────────────────────────────────────────────────
function base64PuroDesdeDataUrl(dataUrl) {
  if (!dataUrl) return null;
  // Formato: "data:image/png;base64,XXXX"
  const partes = dataUrl.split(',');
  return partes.length === 2 ? partes[1] : dataUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exporta la cédula de evaluación de enlace de turno a un archivo .xlsx.
 *
 * @param {Object} datos
 * @param {string[]}  datos.empleadosSeleccionados  - array de IDs de empleados
 * @param {Object}    datos.empleadosObjs           - array de objetos empleado completos (con id, nombre, matricula)
 * @param {Object}    datos.calificaciones          - { [pregIdx]: { [empId]: 0|1|2|null } }
 * @param {Object}    datos.firmasEvaluados         - { [empId]: dataUrl base64 }
 * @param {string|null} datos.firmaEvaluador        - dataUrl base64 o null
 * @param {string}    datos.mesEvaluacion
 * @param {string}    datos.servicio
 * @param {string}    datos.turno
 * @param {string[]}  datos.observaciones           - array de 4 strings
 */
export async function exportarCedulaEvaluacion({
  empleadosSeleccionados,
  empleadosObjs,
  calificaciones,
  firmasEvaluados,
  firmaEvaluador,
  mesEvaluacion,
  servicio,
  turno,
  observaciones,
}) {
  try {
    // ── 1. Cargar el molde ─────────────────────────────────────────────────
    const response = await fetch('/molde_evaluacion_enlace.xlsx');
    if (!response.ok) {
      throw new Error(
        "No se encontró 'molde_evaluacion_enlace.xlsx' en /public.\n" +
        `Status: ${response.status}`
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());

    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('El molde no contiene ninguna hoja.');

    // ── 2. Cabeceras — A5 (richText servicio + fecha) y D5 (turno) ────────
    worksheet.getCell('A5').value = {
      richText: [
        { font: { bold: true }, text: 'SERVICIO: ' },
        { text: (servicio ?? '') + '                 ' },
        { font: { bold: true }, text: 'FECHA: ' },
        { text: mesEvaluacion ?? '' },
      ],
    };

    worksheet.getCell('D5').value = turno ?? '';

    // ── 3. Calificaciones, totales y % de desempeño ────────────────────────
    const porcentajes = [];

    empleadosSeleccionados.forEach((empId, eIdx) => {
      if (eIdx >= COL_EMPLEADOS.length) return; // solo 4 columnas disponibles
      const col = COL_EMPLEADOS[eIdx];

      let suma = 0;

      for (let qIdx = 0; qIdx < NUM_PREGUNTAS; qIdx++) {
        const valor = calificaciones[qIdx]?.[empId];
        const fila  = FILA_PRIMERA_PREGUNTA + qIdx;

        if (valor !== null && valor !== undefined) {
          worksheet.getCell(fila, col).value = valor;
          suma += valor;
        }
      }

      // Total obtenido (fila 26)
      worksheet.getCell(FILA_TOTAL, col).value = suma;

      // % de desempeño (fila 28) — base 34 (17 preguntas × máx 2 puntos)
      const pct = Math.round((suma / (NUM_PREGUNTAS * 2)) * 100);
      worksheet.getCell(FILA_PORCENT, col).value = pct;
      porcentajes.push(pct);
    });

    // ── 4. Total global — promedio de los % de todos los evaluados ────────
    if (porcentajes.length > 0) {
      const promedio = Math.round(
        porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length
      );
      worksheet.getCell(CELDA_GLOBAL).value = `T: ${promedio}%`;
    }

    // ── 5. Observaciones ──────────────────────────────────────────────────
    observaciones.forEach((obs, idx) => {
      if (idx < FILAS_OBS.length && obs) {
        worksheet.getCell(`A${FILAS_OBS[idx]}`).value = obs;
      }
    });

    // ── 6. Nombres y firmas de los evaluados ──────────────────────────────
    empleadosObjs.forEach((emp, eIdx) => {
      if (eIdx >= FILAS_EVALUADOS.length) return;
      const fila = FILAS_EVALUADOS[eIdx];

      // Texto: nombre + matrícula en col A
      worksheet.getCell(fila, COL_NOMBRE_EVAL).value =
        [emp.nombre, emp.matricula].filter(Boolean).join(' - ');

      // Imagen de firma
      const base64 = base64PuroDesdeDataUrl(firmasEvaluados[emp.id]);
      if (base64) {
        try {
          const imageId = workbook.addImage({ base64, extension: 'png' });
          worksheet.addImage(imageId, {
            tl: { col: COL_FIRMA_EVAL_IMG,     row: fila - 1 },
            br: { col: COL_FIRMA_EVAL_IMG + 2, row: fila      },
            editAs: 'oneCell',
          });
        } catch (imgErr) {
          console.warn(`[exportarEvaluacion] No se pudo insertar firma del empleado ${emp.nombre}:`, imgErr);
        }
      }
    });

    // ── 7. Firma del evaluador ─────────────────────────────────────────────
    const base64Eval = base64PuroDesdeDataUrl(firmaEvaluador);
    if (base64Eval) {
      try {
        const imageId = workbook.addImage({ base64: base64Eval, extension: 'png' });
        worksheet.addImage(imageId, {
          tl: { col: COL_FIRMA_EVALUADOR_IMG,     row: FILA_EVALUADOR - 1 },
          br: { col: COL_FIRMA_EVALUADOR_IMG + 2, row: FILA_EVALUADOR      },
          editAs: 'oneCell',
        });
      } catch (imgErr) {
        console.warn('[exportarEvaluacion] No se pudo insertar firma del evaluador:', imgErr);
      }
    }

    // ── 8. Generar descarga ────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `Cedula_Enlace_Turno_${(mesEvaluacion ?? 'SIN_MES').replace(/\s/g, '_')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('[exportarEvaluacion] Error:', error);
    alert('Error al generar la cédula:\n' + error.message);
  }
}
