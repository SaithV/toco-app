import ExcelJS from 'exceljs';
import { calcularSemanasRol } from './fechas';

// ─────────────────────────────────────────────────────────────────────────────
// DICCIONARIO IMSS — estado app (MAYÚSCULAS) → símbolo oficial
// La comparación se hace con .toUpperCase() para tolerar variantes de casing.
// ─────────────────────────────────────────────────────────────────────────────
const DICT_IMSS = {
  'ASISTENCIA':      '●',
  'FALTA':           'F',
  'TXT':             'TXT',
  'T. EXTRA':        'TE',
  'VACACIONES':      'V',
  'INCAPACIDAD':     'I',
  'LICENCIA':        'L',
  'NIVELACION':      'N',
  'CONVENIO':        'T',
  'CAMBIO ADSC':     'CA',
  'OTRO SERVICIO':   'OS',
  'PERMUTA':         'P',
  'CAMBIO TURNO':    'CT',
  'FESTIVO':         'FES',
  'COMISION':        'C',
};

// Días de la semana: índice 0 = Domingo
const LETRAS_DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

// Nombres completos de los meses para el texto del periodo en cabecera
const MESES_TEXTO = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

// Mapa número (diasDescanso) → etiqueta corta
const DIAS_LABEL = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié',
  4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

// ─────────────────────────────────────────────────────────────────────────────
// COORDENADAS FIJAS (Hoja 4 — Lista Asistencia IMSS)
// ─────────────────────────────────────────────────────────────────────────────
const COORD = {
  SERVICIO:      'C5',   // servicioSeleccionado
  TURNO:         'K5',   // turnoSeleccionado
  PERIODO:       'W5',   // texto "16 DE MARZO AL 15 DE ABRIL 2026"
  FILA_DIAS:     6,      // fila donde van D, L, M…
  COL_INICIO:    6,      // columna F (índice 1-based en ExcelJS)
  FILA_PERSONAL: 8,      // primera fila de empleados (filas 8–26)
  MAX_EMPLEADOS: 19,     // máx 19 empleados — NO se tocan filas fuera del rango
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Parsea 'YYYY-MM-DD' a { y, m, d } sin conversión UTC */
function parsearFecha(str) {
  const [y, m, d] = str.split('-').map(Number);
  return { y, m, d };
}

/**
 * Construye el array de días entre inicio y fin (inclusive).
 * Devuelve [{ iso: 'YYYY-MM-DD', diaSemana: 0-6 }, …] — máximo 31 elementos.
 */
function buildDiasPeriodo(inicio, fin) {
  const { y: yi, m: mi, d: di } = parsearFecha(inicio);
  const { y: yf, m: mf, d: df } = parsearFecha(fin);

  const fechaInicio = new Date(yi, mi - 1, di);
  const fechaFin    = new Date(yf, mf - 1, df);
  const dias        = [];

  const cursor = new Date(fechaInicio);
  while (cursor <= fechaFin && dias.length < 31) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    dias.push({ iso: `${y}-${m}-${d}`, diaSemana: cursor.getDay() });
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

/** Construye el texto del periodo: "16 DE MARZO AL 15 DE ABRIL 2026" */
function buildTextoPeriodo(inicio, fin) {
  const { m: mi, d: di }       = parsearFecha(inicio);
  const { y: yf, m: mf, d: df } = parsearFecha(fin);
  return `${di} DE ${MESES_TEXTO[mi - 1]} AL ${df} DE ${MESES_TEXTO[mf - 1]} ${yf}`;
}

/** Calcula automáticamente el periodo activo (16 mes anterior → 15 mes actual) */
function calcularPeriodoActual() {
  const hoy = new Date();
  const dia = hoy.getDate();
  let mesIni  = dia < 16 ? hoy.getMonth() - 1 : hoy.getMonth();
  let anioIni = hoy.getFullYear();
  if (mesIni < 0) { mesIni = 11; anioIni--; }
  const mesFin  = (mesIni + 1) % 12;
  const anioFin = mesIni === 11 ? anioIni + 1 : anioIni;
  const pad = (n) => String(n).padStart(2, '0');
  return {
    inicio: `${anioIni}-${pad(mesIni + 1)}-16`,
    fin:    `${anioFin}-${pad(mesFin + 1)}-15`,
  };
}

/** Traduce el estado de la app al símbolo IMSS. Tolerante a minúsculas/espacios. */
function traducirEstado(estado) {
  if (!estado || estado === 'Pendiente') return '';
  return DICT_IMSS[estado.toUpperCase()] ?? '';
}

/** Formatea el array diasDescanso → "Lun, Mié" (texto largo, para Hoja 4) */
function formatearDescansos(diasDescanso) {
  if (!Array.isArray(diasDescanso) || diasDescanso.length === 0) return '';
  return diasDescanso.map((n) => DIAS_LABEL[n] ?? n).join(', ');
}

/**
 * Formatea el array diasDescanso → "S-D" (código corto, para Hoja 2 Rol Actividades).
 * Mapa: 0=D, 1=L, 2=M, 3=Mi, 4=J, 5=V, 6=S
 */
const DIAS_CORTO = { 0: 'D', 1: 'L', 2: 'M', 3: 'Mi', 4: 'J', 5: 'V', 6: 'S' };
function formatearDescansosCorto(diasDescanso) {
  if (!Array.isArray(diasDescanso) || diasDescanso.length === 0) return '';
  return diasDescanso.map((n) => DIAS_CORTO[n] ?? String(n)).join('-');
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera y descarga el reporte de asistencia en formato .xlsx.
 *
 * @param {Array}  empleados            - catálogo de empleados del store
 * @param {Object} asistenciaDiaria     - { [fecha]: { [empId]: { estado, pacientes, cubreA, nota } } }
 * @param {string} [periodoInicio]      - 'YYYY-MM-DD' — si se omite se calcula automáticamente
 * @param {string} [periodoFin]         - 'YYYY-MM-DD' — si se omite se calcula automáticamente
 * @param {string} [servicioSeleccionado]
 * @param {string} [turnoSeleccionado]
 */
export const generarReporteRol = async (
  empleados,
  asistenciaDiaria,
  periodoInicio,
  periodoFin,
  servicioSeleccionado = 'HOSPITALIZACION CIRUGIA',
  turnoSeleccionado    = 'NOCTURNO',
  planeacionMensual    = {},
  rolSemanal           = {},
  configuracion        = { indicador: '3.5', elaboro: '', autorizo: '' },
  semanaActiva         = 0,
) => {
  try {
    // ── 1. Resolver periodo: usar los del store o calcular automáticamente ─
    const { inicio: autoInicio, fin: autoFin } = calcularPeriodoActual();
    const pInicio = periodoInicio || autoInicio;
    const pFin    = periodoFin    || autoFin;

    // ── 2. Cargar plantilla ───────────────────────────────────────────────
    const response = await fetch('/molde_rol.xlsx');
    if (!response.ok) throw new Error("No se encontró 'molde_rol.xlsx' en /public.");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());

    // ── 3. Buscar hojas por nombre (a prueba de cambios de orden) ────────
    // Busca coincidencia parcial en el nombre — insensible a mayúsculas/acentos.
    const findSheet = (keyword) =>
      workbook.worksheets.find((w) =>
        w.name.toUpperCase().includes(keyword.toUpperCase())
      );

    const worksheet         = findSheet('LISTA ASISTENCIA');
    const sheetRolActividad = findSheet('ROL AREA Y ACTIVIDAD')
                           ?? findSheet('ROL AREA')
                           ?? findSheet('OCT NOV');
    const sheetCirugia      = findSheet('CIRUGIA');

    if (!worksheet) throw new Error(
      "No se encontró una hoja con 'LISTA ASISTENCIA' en el nombre. " +
      "Hojas disponibles: " + workbook.worksheets.map((w) => w.name).join(', ')
    );

    // ── 4. Construir días del período ─────────────────────────────────────
    const dias   = buildDiasPeriodo(pInicio, pFin);
    const textoP = buildTextoPeriodo(pInicio, pFin);

    // ── 5. Encabezados de cabecera (coordenadas fijas C5, K5, W5) ─────────
    worksheet.getCell(COORD.SERVICIO).value = servicioSeleccionado;
    worksheet.getCell(COORD.TURNO).value    = turnoSeleccionado;
    worksheet.getCell(COORD.PERIODO).value  = textoP;

    // ── 6. Fila 6: letras de días (D, L, M, M, J, V, S) desde columna F ──
    dias.forEach((dia, i) => {
      worksheet.getCell(COORD.FILA_DIAS, COORD.COL_INICIO + i).value =
        LETRAS_DIAS[dia.diaSemana];
    });

    // ── 7. Personal: filas 8–26 (máximo 19 empleados) ─────────────────────
    //    Sin spliceRows: las filas vacías conservan el formato del molde.
    const lista = empleados.slice(0, COORD.MAX_EMPLEADOS);

    lista.forEach((emp, index) => {
      const fila = COORD.FILA_PERSONAL + index;

      // Columnas fijas: A=índice, B=categoría, C=nombre, D=matrícula, E=días descanso
      worksheet.getCell(`A${fila}`).value = index + 1;
      worksheet.getCell(`B${fila}`).value = emp.categoria || '';
      worksheet.getCell(`C${fila}`).value = emp.nombre    || '';
      worksheet.getCell(`D${fila}`).value = emp.matricula || '';
      worksheet.getCell(`E${fila}`).value = formatearDescansos(emp.diasDescanso);

      // Columnas F…AJ: símbolo IMSS de cada día del período
      dias.forEach((dia, i) => {
        const registro = asistenciaDiaria[dia.iso]?.[emp.id];
        const simbolo  = traducirEstado(registro?.estado);
        if (simbolo) {
          worksheet.getCell(fila, COORD.COL_INICIO + i).value = simbolo;
        }
      });
    });

    // ── 8. ROL DE ACTIVIDADES (hoja "OCT NOV" / "ROL AREA") ──────────────
    //    Coordenadas fijas — sin spliceRows, filas vacías conservan formato.
    if (sheetRolActividad) {
      // ── 8a. Encabezados generales ───────────────────────────────────────
      sheetRolActividad.getCell('C5').value = servicioSeleccionado;
      sheetRolActividad.getCell('K5').value = turnoSeleccionado;
      // Año del periodo (extraído de pInicio, ej. 2026)
      sheetRolActividad.getCell('F7').value = parsearFecha(pInicio).y;

      // ── 8a-ii. Meses y rangos de semanas ────────────────────────────────
      // Fila 8: mes1 en F8, mes2 en J8
      // Fila 9: rangos 'DD-DD' en columnas F→M (cols 6-13)
      const { mes1, mes2, semanas: semanasRol } = calcularSemanasRol(pInicio);
      sheetRolActividad.getCell('F8').value = mes1;
      sheetRolActividad.getCell('J8').value = mes2;
      for (let i = 0; i < 8; i++) {
        sheetRolActividad.getCell(9, 6 + i).value = semanasRol[i];
      }

      // ── 8b. Base — Cuadro 1: filas 10 a 20 (máx 11 empleados) ──────────
      const BASE_INICIO = 10;
      const BASE_MAX    = 11;
      const base = empleados.filter((e) => !e.esSuplente).slice(0, BASE_MAX);

      base.forEach((emp, index) => {
        const fila    = BASE_INICIO + index;
        const semanas = planeacionMensual[emp.id] ?? {};
        sheetRolActividad.getCell(`A${fila}`).value = emp.categoria || '';
        sheetRolActividad.getCell(`B${fila}`).value = emp.plaza     || '';
        sheetRolActividad.getCell(`C${fila}`).value = emp.nombre    || '';
        sheetRolActividad.getCell(`D${fila}`).value = emp.matricula || '';
        sheetRolActividad.getCell(`E${fila}`).value = formatearDescansosCorto(emp.diasDescanso);
        // Semanas F (col 6) → M (col 13) — índices 0-7
        for (let i = 0; i < 8; i++) {
          const val = semanas[i];
          sheetRolActividad.getCell(fila, 6 + i).value = val !== undefined && val !== '' ? val : null;
        }
      });

      // ── 8c. Suplentes — Cuadro 2: filas 24 a 28 (máx 5 empleados) ──────
      const SUP_INICIO = 24;
      const SUP_MAX    = 5;
      const suplentes = empleados.filter((e) => e.esSuplente).slice(0, SUP_MAX);

      suplentes.forEach((emp, index) => {
        const fila    = SUP_INICIO + index;
        const semanas = planeacionMensual[emp.id] ?? {};
        sheetRolActividad.getCell(`A${fila}`).value = emp.categoria || '';
        sheetRolActividad.getCell(`B${fila}`).value = emp.plaza     || '';
        sheetRolActividad.getCell(`C${fila}`).value = emp.nombre    || '';
        sheetRolActividad.getCell(`D${fila}`).value = emp.matricula || '';
        sheetRolActividad.getCell(`E${fila}`).value = formatearDescansosCorto(emp.diasDescanso);
        // Días F (col 6) → L (col 12) — índices 0-6 (Dom=0 … Sáb=6)
        for (let i = 0; i < 7; i++) {
          const val = semanas[i];
          sheetRolActividad.getCell(fila, 6 + i).value = val !== undefined && val !== '' ? val : null;
        }
      });
    }

    // ── 9. ROL SEMANAL CIRUGÍA (hoja "CIRUGIA") ──────────────────────────
    if (sheetCirugia) {
      // Datos de la semana activa — nueva estructura: rolSemanal[semanaIndex][empId][diaIndex]
      // Guardia de compatibilidad: si el primer valor no es objeto, estructura vieja → ignorar
      const datosSemana = (() => {
        const raw = rolSemanal[semanaActiva];
        if (!raw) return {};
        const firstVal = Object.values(raw)[0];
        if (firstVal !== undefined && typeof firstVal !== 'object') return {};
        return raw;
      })();

      // Rango de fechas de la semana activa (ej. "24-30")
      const { semanas: semanasRangos } = calcularSemanasRol(pInicio);
      const rangoSemana = semanasRangos[semanaActiva] ?? '';

      // 9a. Encabezados
      sheetCirugia.getCell('C5').value = servicioSeleccionado;
      sheetCirugia.getCell('E5').value = configuracion.indicador || '';
      sheetCirugia.getCell('G5').value = parsearFecha(pInicio).y;
      sheetCirugia.getCell('J5').value = turnoSeleccionado;
      // Rango de la semana (ej. "24-30") en A5 para identificar el reporte impreso
      sheetCirugia.getCell('A5').value = rangoSemana ? `SEM: ${rangoSemana}` : `SEM ${semanaActiva + 1}`;

      // 9b. Base — filas 7 a 17 (máx 11 empleados)
      const ciBase = empleados.filter((e) => !e.esSuplente).slice(0, 11);
      ciBase.forEach((emp, index) => {
        const fila = 7 + index;
        sheetCirugia.getCell(`A${fila}`).value = index + 1;
        sheetCirugia.getCell(`B${fila}`).value = emp.categoria || '';
        sheetCirugia.getCell(`C${fila}`).value = emp.plaza     || '';
        sheetCirugia.getCell(`D${fila}`).value = emp.nombre    || '';
        sheetCirugia.getCell(`E${fila}`).value = emp.matricula || '';
        for (let i = 0; i < 7; i++) {
          const val = datosSemana[emp.id]?.[i];
          sheetCirugia.getCell(fila, 6 + i).value = val ?? null;
        }
      });

      // 9c. Suplentes — filas 19 a 21 (máx 3 empleados)
      const ciSup = empleados.filter((e) => e.esSuplente).slice(0, 3);
      ciSup.forEach((emp, index) => {
        const fila = 19 + index;
        sheetCirugia.getCell(`A${fila}`).value = index + 1;
        sheetCirugia.getCell(`B${fila}`).value = emp.categoria || '';
        sheetCirugia.getCell(`C${fila}`).value = emp.plaza     || '';
        sheetCirugia.getCell(`D${fila}`).value = emp.nombre    || '';
        sheetCirugia.getCell(`E${fila}`).value = emp.matricula || '';
        for (let i = 0; i < 7; i++) {
          const val = datosSemana[emp.id]?.[i];
          sheetCirugia.getCell(fila, 6 + i).value = val ?? null;
        }
      });

      // 9d. Totales — fila 22, columnas F→L
      for (let i = 0; i < 7; i++) {
        const totalDia = empleados.filter((emp) => {
          const val = datosSemana[emp.id]?.[i];
          return val !== undefined && val !== '' && val !== null;
        }).length;
        sheetCirugia.getCell(22, 6 + i).value = totalDia > 0 ? totalDia : null;
      }

      // 9e. Firmas — fila 24
      sheetCirugia.getCell('A24').value = configuracion.elaboro  || '';
      sheetCirugia.getCell('E24').value = configuracion.autorizo || '';
    }

    // ── 10. Generar descarga ──────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `ASISTENCIA_${textoP.replace(/ /g, '_')}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('[exportarExcel] Error:', error);
    alert('Error al generar el Excel:\n' + error.message);
  }
};
