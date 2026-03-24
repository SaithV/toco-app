import { useState } from 'react';
import { ChevronLeft, ClipboardList, Info, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { generarReporteRol } from '../utils/exportarExcel';
import { calcularSemanasRol } from '../utils/fechas';

// ─── Opciones del selector para celdas de día ────────────────────────────────
const OPCIONES_DIA = ['', '1', '2', '3', '4', '5', '6', '7', '8', 'HEMO', 's/s'];

// Cabeceras de los 7 días
const HEADERS_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Colores por valor para lectura rápida
const COLOR_VALOR = {
  '':     'bg-gray-50  text-gray-400',
  '1':    'bg-blue-50  text-blue-700',
  '2':    'bg-indigo-50 text-indigo-700',
  '3':    'bg-violet-50 text-violet-700',
  '4':    'bg-fuchsia-50 text-fuchsia-700',
  '5':    'bg-pink-50  text-pink-700',
  '6':    'bg-rose-50  text-rose-700',
  '7':    'bg-orange-50 text-orange-700',
  '8':    'bg-amber-50 text-amber-700',
  'HEMO': 'bg-red-100  text-red-700',
  's/s':  'bg-gray-200 text-gray-500',
};

// ─── Celda con input libre + opciones rápidas en select ──────────────────────
function CeldaDia({ empId, semanaIndex, diaIndex, valor, onChange }) {
  const colorClass = COLOR_VALOR[valor] ?? 'bg-gray-50 text-gray-600';

  return (
    <td className="px-1 py-1 text-center min-w-17">
      <select
        value={valor}
        onChange={(e) => onChange(empId, semanaIndex, diaIndex, e.target.value)}
        className={`w-full rounded-lg border border-gray-200 px-1 py-1.5 text-xs font-semibold
                    text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400
                    transition-colors ${colorClass}`}
      >
        {OPCIONES_DIA.map((op) => (
          <option key={op} value={op}>
            {op === '' ? '—' : op}
          </option>
        ))}
      </select>
    </td>
  );
}

// ─── Fila de empleado ─────────────────────────────────────────────────────────
function FilaEmpleado({ emp, semanaIndex, diasEmp, onChange, bgRow = 'bg-white' }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className={`sticky left-0 z-10 ${bgRow} border-r border-gray-200 px-3 py-2 min-w-40 max-w-45`}>
        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{emp.nombre}</p>
        {emp.categoria && (
          <p className="text-xs text-gray-400 truncate">{emp.categoria}</p>
        )}
      </td>
      {Array.from({ length: 7 }, (_, i) => (
        <CeldaDia
          key={i}
          empId={emp.id}
          semanaIndex={semanaIndex}
          diaIndex={i}
          valor={diasEmp[i] ?? ''}
          onChange={onChange}
        />
      ))}
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RolSemanal({ onBack }) {
  const empleados            = useStore((s) => s.empleados);
  const rolSemanal           = useStore((s) => s.rolSemanal);
  const actualizarRolSemanal = useStore((s) => s.actualizarRolSemanal);
  const autoLlenarSemana     = useStore((s) => s.autoLlenarSemana);
  const asistenciaDiaria     = useStore((s) => s.asistenciaDiaria);
  const periodoInicio        = useStore((s) => s.periodoInicio);
  const periodoFin           = useStore((s) => s.periodoFin);
  const servicioSeleccionado = useStore((s) => s.servicioSeleccionado);
  const turnoSeleccionado    = useStore((s) => s.turnoSeleccionado);
  const planeacionMensual    = useStore((s) => s.planeacionMensual);
  const configuracion        = useStore((s) => s.configuracion);

  // ── Semanas calculadas desde el período activo ──────────────────────────
  const { semanas } = calcularSemanasRol(periodoInicio);

  // ── Semana activa (índice 0-7) ───────────────────────────────────────────
  const [semanaActiva, setSemanaActiva] = useState(0);

  const base      = empleados.filter((e) => !e.esSuplente);
  const suplentes = empleados.filter((e) =>  e.esSuplente);

  // Datos de la semana activa — guardia para datos legacy con estructura vieja
  const datosSemana = (() => {
    const raw = rolSemanal[semanaActiva];
    // Si el primer valor no es un objeto, era la estructura antigua → ignorar
    if (raw && typeof Object.values(raw)[0] !== 'object') return {};
    return raw ?? {};
  })();

  const handleExcel = () => {
    generarReporteRol(
      empleados,
      asistenciaDiaria,
      periodoInicio,
      periodoFin,
      servicioSeleccionado,
      turnoSeleccionado,
      planeacionMensual,
      rolSemanal,
      configuracion,
      semanaActiva,
    );
  };

  const handleAutoLlenar = () => {
    autoLlenarSemana(semanaActiva);
  };

  // ─── Thead compartido ──────────────────────────────────────────────────────
  const Thead = ({ colorClass = 'bg-gray-50', textClass = 'text-gray-500', borderClass = 'border-gray-200' }) => (
    <thead>
      <tr className={`${colorClass} border-b ${borderClass}`}>
        <th className={`sticky left-0 z-10 ${colorClass} border-r ${borderClass} px-3 py-2 text-left text-xs font-semibold ${textClass} uppercase tracking-wide min-w-40`}>
          Empleado
        </th>
        {HEADERS_DIA.map((d) => (
          <th key={d} className={`px-1 py-2 text-center text-xs font-semibold ${textClass} uppercase tracking-wide min-w-17`}>
            {d}
          </th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center rounded-xl p-2 text-gray-500
                     hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Regresar"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-xl bg-teal-50 p-2">
            <ClipboardList className="h-5 w-5 text-teal-600" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">
              Rol Semanal (Cirugía)
            </h1>
            <p className="text-xs text-gray-400">Asignación por día de la semana</p>
          </div>
        </div>
      </header>

      {/* ── Callout informativo ─────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <div className="flex items-start gap-2.5 rounded-xl bg-teal-50 border border-teal-100 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" strokeWidth={2} />
          <p className="text-xs text-teal-700 leading-relaxed">
            <span className="font-semibold">Asignación diaria.</span>{' '}
            Escribe el número de módulo/camas (ej. 1, 2, 3), área especial (<span className="font-mono font-semibold">HEMO</span>) o{' '}
            <span className="font-mono font-semibold">s/s</span>.
            Esto llenará la hoja de Cirugía en el Excel IMSS.
          </p>
        </div>
      </div>

      {/* ── Selector de semana + Auto-llenado ──────────────────────────── */}
      <div className="px-4 pt-3 flex items-center gap-2">
        {/* Select de semana */}
        <select
          value={semanaActiva}
          onChange={(e) => setSemanaActiva(Number(e.target.value))}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5
                     text-sm font-semibold text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors"
        >
          {semanas.map((rango, i) => (
            <option key={i} value={i}>
              Semana {i + 1}: {rango}
            </option>
          ))}
        </select>

        {/* Botón Sincronizar con Planeador */}
        <button
          onClick={handleAutoLlenar}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5
                     text-xs font-semibold text-white shrink-0
                     hover:bg-blue-700 active:scale-95 transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
          title="Copia los valores del Planeador Mensual para esta semana"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} />
          Sincronizar
        </button>
      </div>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-4 pb-28 overflow-x-auto">

        {/* ── Tabla 1: Personal de Base ──────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Personal de Base
            </span>
            <span className="text-xs text-gray-400">({base.length})</span>
          </div>
          {base.length === 0 ? (
            <div className="rounded-2xl bg-white border border-gray-100 px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Sin personal de base registrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
              <table className="min-w-full bg-white text-sm border-collapse">
                <Thead />
                <tbody>
                  {base.map((emp) => (
                    <FilaEmpleado
                      key={emp.id}
                      emp={emp}
                      semanaIndex={semanaActiva}
                      diasEmp={datosSemana[emp.id] ?? {}}
                      onChange={actualizarRolSemanal}
                      bgRow="bg-white"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Tabla 2: Suplentes ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-rose-500">
              Suplentes
            </span>
            <span className="text-xs text-gray-400">({suplentes.length})</span>
          </div>
          {suplentes.length === 0 ? (
            <div className="rounded-2xl bg-white border border-gray-100 px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Sin suplentes registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-rose-100">
              <table className="min-w-full bg-white text-sm border-collapse">
                <Thead colorClass="bg-rose-50" textClass="text-rose-400" borderClass="border-rose-100" />
                <tbody>
                  {suplentes.map((emp) => (
                    <FilaEmpleado
                      key={emp.id}
                      emp={emp}
                      semanaIndex={semanaActiva}
                      diasEmp={datosSemana[emp.id] ?? {}}
                      onChange={actualizarRolSemanal}
                      bgRow="bg-white"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* ── Barra flotante inferior — Descargar Excel ────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
        <div className="h-28 bg-linear-to-t from-gray-100 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 flex justify-center pb-6 pointer-events-auto">
          <button
            onClick={handleExcel}
            className="flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-6 py-3.5 shadow-lg
                       text-white text-sm font-semibold
                       hover:bg-emerald-700 active:scale-95 transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <FileSpreadsheet className="h-5 w-5" strokeWidth={1.8} />
            Descargar Excel IMSS
          </button>
        </div>
      </div>

    </div>
  );
}
