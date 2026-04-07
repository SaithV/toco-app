import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, Save, Shirt, CheckCircle, FileSpreadsheet,
  X, Eraser, PenTool, Calendar, Trash2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import SignatureCanvas from 'react-signature-canvas';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const TURNOS = [
  'Matutino',
  'Vespertino',
  'Nocturno A',
  'Nocturno B',
  'Jornada Acumulada',
];

const DEPARTAMENTOS = [
  'Ginecología',
  'Urgencias',
  'Tococirugía',
  'Pediatría',
];

/** Los 12 conceptos oficiales del formato IMSS de ropería */
const CONCEPTOS = [
  { key: 'existencia',           label: 'Existencia' },
  { key: 'recibido',             label: 'Recibido' },
  { key: 'consumo',              label: 'Consumo' },
  { key: 'entregado',            label: 'Entregado' },
  { key: 'totalPrendaVales',     label: 'Total Prenda en Vales' },
  { key: 'ropaContaminada',      label: 'Ropa Contaminada' },
  { key: 'inconsistenciaConteo', label: 'Inconsistencia Conteo' },
  { key: 'conteoRoperia',        label: 'Conteo Ropería' },
  { key: 'consumoServicio',      label: 'Consumo del Servicio' },
  { key: 'dotacionRopaEsteril',  label: 'Dotación Ropa Estéril' },
  { key: 'ropaEsterilRecibida',  label: 'Ropa Estéril Recibida' },
  { key: 'ropaEsterilUtilizada', label: 'Ropa Estéril Utilizada' },
];

/** Genera el form vacío con los 12 conceptos = '' */
const FORM_VACIO = () =>
  Object.fromEntries(CONCEPTOS.map(({ key }) => [key, '']));

/**
 * Mapeo de cada concepto a su fila en la plantilla Excel (filas 14-25).
 * El orden debe coincidir exactamente con la plantilla_ropa.xlsx.
 */
const CONCEPTO_A_FILA = {
  existencia:           14,
  recibido:             15,
  consumo:              16,
  entregado:            17,
  totalPrendaVales:     18,
  ropaContaminada:      19,
  inconsistenciaConteo: 20,
  conteoRoperia:        21,
  consumoServicio:      22,
  dotacionRopaEsteril:  23,
  ropaEsterilRecibida:  24,
  ropaEsterilUtilizada: 25,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Formato de fecha "Lunes 6 de Abril" */
function fechaBonita() {
  const d = new Date();
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).replace(/^\w/, (c) => c.toUpperCase());
}

// Estilos reutilizables
const inputCls = `rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                  text-gray-800 placeholder-gray-400 text-center
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors w-full`;

const selectCls = `rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                   text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400
                   transition-colors w-full`;

/**
 * Recorta un canvas HTML eliminando el espacio en blanco alrededor de los
 * píxeles dibujados. Reemplazo vanilla de getTrimmedCanvas() que rompe Vite.
 */
const recortarCanvasManual = (canvasOriginal) => {
  const ctx = canvasOriginal.getContext('2d');
  const pixels = ctx.getImageData(0, 0, canvasOriginal.width, canvasOriginal.height);
  const l = pixels.data.length;
  const bound = { top: null, left: null, right: null, bottom: null };
  let x, y;

  for (let i = 0; i < l; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      x = (i / 4) % canvasOriginal.width;
      y = ~~((i / 4) / canvasOriginal.width);

      if (bound.top === null) bound.top = y;
      if (bound.left === null) bound.left = x;
      else if (x < bound.left) bound.left = x;
      if (bound.right === null) bound.right = x;
      else if (bound.right < x) bound.right = x;
      if (bound.bottom === null) bound.bottom = y;
      else if (bound.bottom < y) bound.bottom = y;
    }
  }

  // Si está completamente en blanco, devolver tal cual
  if (bound.top === null) return canvasOriginal.toDataURL('image/png');

  const padding = 10;
  const trimWidth  = bound.right - bound.left + padding * 2;
  const trimHeight = bound.bottom - bound.top + padding * 2;

  const canvasRecortado = document.createElement('canvas');
  canvasRecortado.width  = trimWidth;
  canvasRecortado.height = trimHeight;
  const ctxRecortado = canvasRecortado.getContext('2d');

  ctxRecortado.drawImage(
    canvasOriginal,
    bound.left - padding, bound.top - padding, trimWidth, trimHeight,
    0, 0, trimWidth, trimHeight
  );

  return canvasRecortado.toDataURL('image/png');
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function InformeRopa({ onBack }) {
  // ── Store ─────────────────────────────────────────────────────────────
  const guardarCapturaRopa  = useStore((s) => s.guardarCapturaRopa);
  const limpiarCapturasRopa = useStore((s) => s.limpiarCapturasRopa);
  const capturasRopa        = useStore((s) => s.capturasRopa);

  // ── Fecha de hoy YYYY-MM-DD (zona horaria local) ──────────────────
  const hoy   = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  // ── Estado local — captura diaria ─────────────────────────────────────
  const [departamento, setDepartamento] = useState('Ginecología');
  const [turno, setTurno]               = useState('Nocturno A');
  const [form, setForm]                 = useState(FORM_VACIO());
  const [observaciones, setObservaciones] = useState('');
  const [guardado, setGuardado]         = useState(false);

  // ── Estado local — firmas y exportación ───────────────────────────────
  const [datosFirma, setDatosFirma] = useState({
    nombreEjp: '',        matriculaEjp: '',        firmaEjpBase64: null,
    nombreSubjefe: '',    matriculaSubjefe: '',    firmaSubjefeBase64: null,
  });
  const [firmaActiva, setFirmaActiva] = useState(null);   // 'ejp' | 'subjefe' | null
  const sigPad = useRef(null);
  const [exportando, setExportando] = useState(false);

  // ── Mes del reporte (ciclo IMSS 26→25) ────────────────────────────────
  const [mesExportar, setMesExportar] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // ── Pre-llenar si ya existe captura de hoy ────────────────────────────
  useEffect(() => {
    const existente = capturasRopa[fechaHoy];
    if (existente) {
      if (existente.departamento) setDepartamento(existente.departamento);
      if (existente.turno) setTurno(existente.turno);
      if (existente.datosDia) setForm(existente.datosDia);
      if (existente.observaciones) setObservaciones(existente.observaciones);
    }
  }, [fechaHoy, capturasRopa]);

  // ── Helpers de estado ─────────────────────────────────────────────────
  const setCampo = (key, valor) =>
    setForm((prev) => ({ ...prev, [key]: valor }));

  const handleGuardar = () => {
    guardarCapturaRopa(fechaHoy, departamento, turno, form, observaciones);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  // ── Guardar firma desde el canvas fullscreen ──────────────────────────
  const guardarFirma = () => {
    if (!sigPad.current || sigPad.current.isEmpty()) {
      alert('Dibuja tu firma antes de guardar.');
      return;
    }
    const canvas = sigPad.current.getCanvas();
    const firmaRecortadaB64 = recortarCanvasManual(canvas);
    if (firmaActiva === 'ejp') {
      setDatosFirma((p) => ({ ...p, firmaEjpBase64: firmaRecortadaB64 }));
    } else {
      setDatosFirma((p) => ({ ...p, firmaSubjefeBase64: firmaRecortadaB64 }));
    }
    setFirmaActiva(null);
  };

  // ── Generar Excel mensual (período 26→25, dinámico) ───────────────────
  const generarExcelMensual = async () => {
    try {
      setExportando(true);

      // 1. Cargar plantilla
      const resp   = await fetch('/plantilla_ropa.xlsx');
      const arrBuf = await resp.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrBuf);
      const sheet = workbook.worksheets[0];

      // 2. Parsear mes del reporte
      const [yearStr, monthStr] = mesExportar.split('-');
      const yearFin   = parseInt(yearStr, 10);
      const monthFin  = parseInt(monthStr, 10);
      const monthInicio = monthFin === 1 ? 12 : monthFin - 1;
      const yearInicio  = monthFin === 1 ? yearFin - 1 : yearFin;
      const diasMesAnterior = new Date(yearFin, monthFin - 1, 0).getDate();

      const fechaInicioCiclo = `${yearInicio}-${String(monthInicio).padStart(2, '0')}-26`;
      const fechaFinCiclo    = `${yearFin}-${String(monthFin).padStart(2, '0')}-25`;

      // 3. Encabezados
      sheet.getRow(9).getCell('J').value  = departamento;
      const ciclotxt = `26/${String(monthInicio).padStart(2, '0')}/${yearInicio} AL 25/${String(monthFin).padStart(2, '0')}/${yearFin}`;
      sheet.getRow(9).getCell('W').value  = ciclotxt;
      sheet.getRow(9).getCell('AD').value = ciclotxt;

      // 4. Cabecera de días (fila 13) — limpiar días inexistentes
      sheet.getRow(13).getCell(5).value = diasMesAnterior >= 29 ? 29 : '';
      sheet.getRow(13).getCell(6).value = diasMesAnterior >= 30 ? 30 : '';
      sheet.getRow(13).getCell(7).value = diasMesAnterior >= 31 ? 31 : '';

      // 5. Datos base — firmas desde datosFirma
      sheet.getRow(33).getCell('A').value = datosFirma.nombreEjp || 'NOMBRE_EJP';
      sheet.getRow(33).getCell('E').value = datosFirma.matriculaEjp || 'MATRICULA_EJP';
      sheet.getRow(33).getCell('Q').value = datosFirma.nombreSubjefe || 'NOMBRE_SUBJEFE';
      sheet.getRow(33).getCell('X').value = datosFirma.matriculaSubjefe || 'MATRICULA_SUBJEFE';

      // 6. Iterar capturas SOLO del ciclo seleccionado
      const todasObservaciones = [];

      Object.entries(capturasRopa).forEach(([fecha, captura]) => {
        // Filtrar fuera de ciclo
        if (fecha < fechaInicioCiclo || fecha > fechaFinCiclo) return;

        const dia = parseInt(fecha.split('-')[2], 10);

        // Validar que el día exista en el mes anterior (29, 30, 31)
        if (dia >= 26 && dia > diasMesAnterior) return;

        // Columna: día 26→col 2, 27→col 3 … 31→col 7, 1→col 8 … 25→col 32
        const colIndex = dia >= 26 ? dia - 24 : dia + 7;

        const datos = captura.datosDia ?? {};

        // Escribir los 12 valores en filas 14-25
        CONCEPTOS.forEach(({ key }) => {
          const fila = CONCEPTO_A_FILA[key];
          const val  = parseInt(datos[key], 10);
          sheet.getRow(fila).getCell(colIndex).value = isNaN(val) ? 0 : val;
        });

        // Recopilar observaciones no vacías
        if (captura.observaciones && captura.observaciones.trim()) {
          const d = dia.toString().padStart(2, '0');
          todasObservaciones.push(`Día ${d}: ${captura.observaciones.trim()}`);
        }
      });

      // 7. Calcular totales por fila → columna 33 (AG)
      for (let fila = 14; fila <= 25; fila++) {
        let suma = 0;
        for (let col = 2; col <= 32; col++) {
          const raw = sheet.getRow(fila).getCell(col).value;
          const v = typeof raw === 'number' ? raw : parseInt(raw, 10);
          if (!isNaN(v)) suma += v;
        }
        sheet.getRow(fila).getCell(33).value = suma;
      }

      // 8. Escribir observaciones concatenadas
      if (todasObservaciones.length > 0) {
        sheet.getRow(27).getCell('B').value = todasObservaciones.join(' | ');
      }

      // 9. Insertar imágenes de firmas desde base64
      if (datosFirma.firmaEjpBase64) {
        const firmaB64 = datosFirma.firmaEjpBase64.replace(/^data:image\/png;base64,/, '');
        const imageId = workbook.addImage({ base64: firmaB64, extension: 'png' });
        sheet.addImage(imageId, { tl: { col: 10, row: 30 }, ext: { width: 160, height: 60 } });
      }
      if (datosFirma.firmaSubjefeBase64) {
        const firmaB64Sub = datosFirma.firmaSubjefeBase64.replace(/^data:image\/png;base64,/, '');
        const imageIdSub = workbook.addImage({ base64: firmaB64Sub, extension: 'png' });
        sheet.addImage(imageIdSub, { tl: { col: 29, row: 30 }, ext: { width: 160, height: 60 } });
      }

      // 10. Descargar
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Informe_Ropa_${mesExportar}.xlsx`);
    } catch (err) {
      console.error('Error al generar Excel:', err);
      alert('Error al generar el Excel. Revisa la consola.');
    } finally {
      setExportando(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Header sticky ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200 px-4 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200
                       active:bg-gray-50 flex items-center gap-2 transition-colors"
            aria-label="Regresar"
          >
            <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2} />
            <span className="text-sm font-semibold text-gray-600">Regresar</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-xl bg-cyan-50 p-2">
              <Shirt className="h-5 w-5 text-cyan-600" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">
                Informe de Ropa
              </h1>
              <p className="text-xs text-gray-400">Formato oficial IMSS</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenido principal ─────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-4 pb-10 flex flex-col gap-4 max-w-lg mx-auto w-full">

        {/* ── Tarjeta de contexto ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Contexto de la captura
          </p>

          {/* Fecha */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">📅</span>
            <span className="text-sm font-semibold text-gray-800">
              {fechaBonita()}
            </span>
          </div>

          {/* Departamento */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Departamento / Servicio
            </label>
            <select
              className={selectCls}
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
            >
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Turno */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Turno
            </label>
            <select
              className={selectCls}
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
            >
              {TURNOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Conceptos oficiales IMSS (grid 2 cols) ──────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex items-center justify-center rounded-xl bg-cyan-50 p-2">
              <Shirt className="h-4.5 w-4.5 text-cyan-600" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Conceptos de ropería
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CONCEPTOS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 leading-tight">
                  {label}
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder="0"
                  value={form[key]}
                  onChange={(e) => setCampo(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Observaciones ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Observaciones del día
          </label>
          <textarea
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                       text-gray-800 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors
                       w-full resize-none"
            rows={3}
            placeholder="Opcional — escribe cualquier nota relevante…"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        {/* ── Botón Guardar Captura ────────────────────────────────────────── */}
        <button
          onClick={handleGuardar}
          className={`flex items-center justify-center gap-2.5 w-full rounded-2xl
                     py-4 text-sm font-bold text-white shadow-sm
                     active:scale-95 transition-all mt-2
                     ${guardado ? 'bg-emerald-500' : 'bg-cyan-600 hover:bg-cyan-700'}`}
        >
          {guardado ? (
            <>
              <CheckCircle className="h-5 w-5" strokeWidth={2} />
              ¡Guardado Correctamente! ✅
            </>
          ) : (
            <>
              <Save className="h-5 w-5" strokeWidth={2} />
              Guardar Captura del Día
            </>
          )}
        </button>

        {/* ════════════════════════════════════════════════════════════════════
            TARJETA: FIRMAS Y AUTORIZACIÓN
            ════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Firmas y Autorización
          </p>

          {/* Selector de mes del reporte */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Mes del Reporte (Ciclo del 26 al 25)
            </label>
            <input
              type="month"
              className={inputCls}
              value={mesExportar}
              onChange={(e) => setMesExportar(e.target.value)}
            />
          </div>

          {/* ── Sección EJP ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-600">
              Enfermera Jefe de Piso (EJP)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Nombre</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Nombre completo"
                  value={datosFirma.nombreEjp}
                  onChange={(e) => setDatosFirma((p) => ({ ...p, nombreEjp: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Matrícula</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Matrícula"
                  value={datosFirma.matriculaEjp}
                  onChange={(e) => setDatosFirma((p) => ({ ...p, matriculaEjp: e.target.value }))}
                />
              </div>
            </div>

            {/* Botón firma EJP */}
            <button
              type="button"
              onClick={() => setFirmaActiva('ejp')}
              className={`flex items-center gap-2.5 w-full rounded-xl px-4 py-3
                         border transition-colors text-sm font-semibold
                         ${datosFirma.firmaEjpBase64
                           ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                           : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              {datosFirma.firmaEjpBase64 ? (
                <>
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Firma EJP capturada ✅</span>
                  <img
                    src={datosFirma.firmaEjpBase64}
                    alt="Firma EJP"
                    className="h-5 ml-auto rounded border border-emerald-200"
                  />
                </>
              ) : (
                <>
                  <PenTool className="h-4.5 w-4.5 shrink-0" />
                  <span>Tocar para firmar (EJP)</span>
                </>
              )}
            </button>
          </div>

          {/* ── Sección Subjefe ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Subjefe de Enfermería
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Nombre</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Nombre completo"
                  value={datosFirma.nombreSubjefe}
                  onChange={(e) => setDatosFirma((p) => ({ ...p, nombreSubjefe: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Matrícula</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Matrícula"
                  value={datosFirma.matriculaSubjefe}
                  onChange={(e) => setDatosFirma((p) => ({ ...p, matriculaSubjefe: e.target.value }))}
                />
              </div>
            </div>

            {/* Botón firma Subjefe */}
            <button
              type="button"
              onClick={() => setFirmaActiva('subjefe')}
              className={`flex items-center gap-2.5 w-full rounded-xl px-4 py-3
                         border transition-colors text-sm font-semibold
                         ${datosFirma.firmaSubjefeBase64
                           ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                           : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              {datosFirma.firmaSubjefeBase64 ? (
                <>
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Firma Subjefe capturada ✅</span>
                  <img
                    src={datosFirma.firmaSubjefeBase64}
                    alt="Firma Subjefe"
                    className="h-5 ml-auto rounded border border-emerald-200"
                  />
                </>
              ) : (
                <>
                  <PenTool className="h-4.5 w-4.5 shrink-0" />
                  <span>Tocar para firmar (Subjefe)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Botón Generar Excel ──────────────────────────────────────────── */}
        <button
          onClick={generarExcelMensual}
          disabled={exportando}
          className="flex items-center justify-center gap-2.5 w-full rounded-2xl
                     py-4 text-sm font-bold shadow-sm border-2 border-cyan-600
                     text-cyan-700 bg-white
                     hover:bg-cyan-50 active:scale-95 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="h-5 w-5" strokeWidth={2} />
          {exportando ? 'Generando…' : 'Generar Excel Mensual (26 al 25)'}
        </button>

        {/* ── Botón Borrar capturas (Nuevo Mes) ───────────────────────────── */}
        <button
          onClick={() => {
            if (window.confirm('⚠️ ¿Estás segura de borrar TODAS las capturas? Solo haz esto si ya generaste y guardaste tu Excel mensual.')) {
              limpiarCapturasRopa();
              alert('Memoria limpiada. Lista para el nuevo mes.');
            }
          }}
          className="flex items-center justify-center gap-2.5 w-full rounded-2xl
                     py-4 text-sm font-bold shadow-sm border-2 border-red-400
                     text-red-600 bg-white
                     hover:bg-red-50 active:scale-95 transition-all"
        >
          <Trash2 className="h-5 w-5" strokeWidth={2} />
          Borrar todas las capturas (Nuevo Mes)
        </button>

      </main>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL PANTALLA COMPLETA — FIRMA
          ════════════════════════════════════════════════════════════════════ */}
      {firmaActiva !== null && (
        <div className="fixed inset-0 z-60 bg-white flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-800">
              Firma de {firmaActiva === 'ejp' ? 'Enfermera Jefe de Piso' : 'Subjefe de Enfermería'}
            </h2>
            <button
              onClick={() => setFirmaActiva(null)}
              className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1">
            <SignatureCanvas
              ref={sigPad}
              canvasProps={{ className: 'w-full h-full bg-gray-50 border-y border-gray-200' }}
              backgroundColor="rgb(249,250,251)"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-4 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => sigPad.current?.clear()}
              className="flex items-center justify-center gap-2 flex-1 rounded-2xl
                         py-3.5 text-sm font-bold border-2 border-gray-300
                         text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Eraser className="h-4.5 w-4.5" />
              Limpiar
            </button>
            <button
              type="button"
              onClick={guardarFirma}
              className="flex items-center justify-center gap-2 flex-1 rounded-2xl
                         py-3.5 text-sm font-bold text-white
                         bg-cyan-600 hover:bg-cyan-700 active:scale-95 transition-all"
            >
              <CheckCircle className="h-4.5 w-4.5" />
              Guardar Firma
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
