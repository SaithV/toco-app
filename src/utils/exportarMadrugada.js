import ExcelJS from 'exceljs';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers para localizar hojas por nombre (tolerante a espacios y mayúsculas)
// ─────────────────────────────────────────────────────────────────────────────

/** Normaliza un nombre de hoja: sin acentos, sin espacios extra, mayúsculas */
const norm = (s) =>
  s.toUpperCase()
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .trim();

/**
 * Busca la hoja que contenga todas las palabras clave (array de strings).
 * Ej: findSheet(wb, ['GINE', '1']) → hoja "GINE  (1)"
 */
function findSheet(workbook, keywords) {
  return workbook.worksheets.find((w) => {
    const n = norm(w.name);
    return keywords.every((k) => n.includes(norm(k)));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: calcula días transcurridos desde una fecha ISO ('YYYY-MM-DD')
// Retorna null si la fecha no es válida.
// ─────────────────────────────────────────────────────────────────────────────
function diasDesde(fechaISO) {
  if (!fechaISO) return null;
  const ms = Date.now() - new Date(fechaISO).getTime();
  if (isNaN(ms) || ms < 0) return null;
  return Math.floor(ms / 86_400_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Resuelve qué hoja y qué fila base le corresponde a cada cama
// Retorna { sheet, fila } o null si no aplica
// ─────────────────────────────────────────────────────────────────────────────
function resolverUbicacion(idCama, hojas) {
  if (idCama.startsWith('G')) {
    const n = parseInt(idCama.replace('G', ''), 10);
    if (isNaN(n)) return null;

    if (n <= 12) {
      return { sheet: hojas.gine1, fila: 11 + (n - 1)  * 3 };
    } else if (n <= 24) {
      return { sheet: hojas.gine2, fila: 11 + (n - 13) * 3 };
    } else {
      return { sheet: hojas.gine3, fila: 11 + (n - 25) * 3 };
    }
  }

  if (idCama.startsWith('L')) {
    const n = parseInt(idCama.replace('L', ''), 10);
    if (isNaN(n)) return null;
    return { sheet: hojas.ped, fila: 11 + (n - 1) * 3 };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera y descarga el censo de madrugada en formato .xlsx.
 *
 * @param {Object} censo  - censoMadrugada del store:
 *                          { [idCama]: { paciente, ingreso, dxMedico, invasivos,
 *                                        riesgos, tratamiento, observaciones, … } }
 */
export async function exportarCensoMadrugada(censo) {
  try {
    // ── 1. Cargar molde ────────────────────────────────────────────────────
    const response = await fetch('/molde_madrugada.xlsx');
    if (!response.ok) {
      throw new Error(
        `No se encontró 'molde_madrugada.xlsx' en /public. Status: ${response.status}`
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());

    // ── 2. Localizar hojas ─────────────────────────────────────────────────
    const hojas = {
      gine1: findSheet(workbook, ['GINE', '1']),
      gine2: findSheet(workbook, ['GINE', '2']),
      gine3: findSheet(workbook, ['GINE', '3']),
      ped:   findSheet(workbook, ['PED']),
    };

    // Alerta por hojas faltantes (no aborta — inyectará lo que pueda)
    const faltantes = Object.entries(hojas)
      .filter(([, ws]) => !ws)
      .map(([k]) => k);
    if (faltantes.length > 0) {
      console.warn(
        '[exportarMadrugada] Hojas no encontradas:',
        faltantes,
        '— Hojas disponibles:',
        workbook.worksheets.map((w) => w.name)
      );
    }

    // ── 3. Inyectar datos por cama ─────────────────────────────────────────
    for (const [idCama, paciente] of Object.entries(censo)) {
      if (!paciente) continue;

      const ubicacion = resolverUbicacion(idCama, hojas);
      if (!ubicacion || !ubicacion.sheet) continue;

      const { sheet: ws, fila: r } = ubicacion;

      // ── 3a. Ingreso ──────────────────────────────────────────────────────
      ws.getCell(`B${r}`).value     = paciente.ingreso?.fecha ?? '';
      ws.getCell(`B${r + 2}`).value = paciente.ingreso?.hora  ?? '';

      // ── 3b. Datos del paciente ───────────────────────────────────────────
      const celdaNombre = ws.getCell(`C${r}`);
      celdaNombre.value = (paciente.paciente?.nombre ?? '').toUpperCase() || '';
      celdaNombre.font  = { ...(celdaNombre.font ?? {}), bold: true };

      ws.getCell(`C${r + 1}`).value = paciente.paciente?.nss   ?? '';
      ws.getCell(`C${r + 2}`).value = paciente.dxMedico        ?? '';
      ws.getCell(`D${r}`).value     = paciente.paciente?.genero ?? '';
      ws.getCell(`D${r + 2}`).value = paciente.paciente?.edad  ?? '';

      // Especialidad a cargo (sobrescribe etiqueta fija del molde, ej. 'OBST')
      ws.getCell(`A${r + 2}`).value = paciente.especialidad   ?? '';

      // ── 3c. Invasivos — CVC ──────────────────────────────────────────────
      const cvcTipo  = paciente.invasivos?.cvc?.tipo  ?? '';
      const cvcFecha = paciente.invasivos?.cvc?.fecha ?? '';
      if (cvcTipo || cvcFecha) {
        ws.getCell(`G${r}`).value = [cvcTipo, cvcFecha].filter(Boolean).join(' / ');
      }

      // ── 3d. Invasivos — Sonda Vesical ────────────────────────────────────
      const sondaTipo  = paciente.invasivos?.sonda?.tipo  ?? '';
      const sondaFecha = paciente.invasivos?.sonda?.fecha ?? '';
      if (sondaTipo || sondaFecha) {
        ws.getCell(`H${r}`).value = [sondaTipo, sondaFecha].filter(Boolean).join(' / ');
      }
      // Días de instalación de la sonda
      const diasSonda = diasDesde(sondaFecha);
      if (diasSonda !== null) {
        ws.getCell(`H${r + 1}`).value = `D: ${diasSonda}`;
      }

      // ── 3e. Riesgos ──────────────────────────────────────────────────────
      ws.getCell(`K${r}`).value = paciente.riesgos?.caidas      ?? '';
      ws.getCell(`L${r}`).value = paciente.riesgos?.upp         ?? '';
      ws.getCell(`M${r}`).value = paciente.riesgos?.aislamiento ?? '';

      // ── 3f. Tratamiento y observaciones ──────────────────────────────────
      ws.getCell(`O${r}`).value = paciente.tratamiento?.soluciones ?? '';
      ws.getCell(`T${r}`).value = paciente.observaciones            ?? '';
    }

    // ── 4. Generar descarga ────────────────────────────────────────────────
    const ahora = new Date();
    const sello = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}_${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `Censo_Madrugada_${sello}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('[exportarMadrugada] Error:', error);
    alert('Error al generar el censo:\n' + error.message);
  }
}
