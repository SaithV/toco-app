import { ChevronLeft, CalendarDays, Info, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../store/useStore';
import { generarReporteRol } from '../utils/exportarExcel';
import { calcularSemanasRol } from '../utils/fechas';

// ─── Opciones del selector de semana (Personal de Base) ─────────────────────
const OPCIONES_SEMANA = ['', '1', '2', '3', '4', '5', '6', '7', '8', 'EJP', 'Cendis', 's/s'];

// ─── Opciones del selector de día (Cubre Descansos / Suplentes) ──────────────
const OPCIONES_DIA = ['', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HEADERS_DIA  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Colores visuales por valor para que la tabla se lea de un vistazo
const COLOR_VALOR = {
  '':       'bg-gray-50  text-gray-400',
  // semanas
  '1':      'bg-blue-50  text-blue-700',
  '2':      'bg-indigo-50 text-indigo-700',
  '3':      'bg-violet-50 text-violet-700',
  '4':      'bg-fuchsia-50 text-fuchsia-700',
  '5':      'bg-pink-50  text-pink-700',
  '6':      'bg-rose-50  text-rose-700',
  '7':      'bg-orange-50 text-orange-700',
  '8':      'bg-amber-50 text-amber-700',
  'EJP':    'bg-emerald-50 text-emerald-700',
  'Cendis': 'bg-teal-50  text-teal-700',
  's/s':    'bg-gray-200 text-gray-500',
  // días
  'Dom':    'bg-red-50   text-red-700',
  'Lun':    'bg-blue-50  text-blue-700',
  'Mar':    'bg-indigo-50 text-indigo-700',
  'Mié':    'bg-violet-50 text-violet-700',
  'Jue':    'bg-emerald-50 text-emerald-700',
  'Vie':    'bg-amber-50 text-amber-700',
  'Sáb':    'bg-orange-50 text-orange-700',
};

// ─── Sub-componente: celda select estilizado ─────────────────────────────────
function CeldaSemana({ empId, semanaIndex, valor, onChange, opciones = OPCIONES_SEMANA }) {
  const colorClass = COLOR_VALOR[valor] ?? 'bg-gray-50 text-gray-600';

  return (
    <td className="px-1 py-1 text-center min-w-17">
      <select
        value={valor}
        onChange={(e) => onChange(empId, semanaIndex, e.target.value)}
        className={`w-full rounded-lg border border-gray-200 px-1 py-1.5 text-xs font-semibold
                    text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400
                    transition-colors ${colorClass}`}
      >
        {opciones.map((op) => (
          <option key={op} value={op}>
            {op === '' ? '—' : op}
          </option>
        ))}
      </select>
    </td>
  );
}

// ─── Sub-componente: fila de empleado — Semanas (Base) ───────────────────────
function FilaEmpleadoBase({ emp, semanas, onChange }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="sticky left-0 z-10 bg-white border-r border-gray-200 px-3 py-2 min-w-40 max-w-45">
        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{emp.nombre}</p>
        {emp.categoria && (
          <p className="text-xs text-gray-400 truncate">{emp.categoria}</p>
        )}
      </td>
      {Array.from({ length: 8 }, (_, i) => (
        <CeldaSemana
          key={i}
          empId={emp.id}
          semanaIndex={i}
          valor={semanas[i] ?? ''}
          onChange={onChange}
          opciones={OPCIONES_SEMANA}
        />
      ))}
    </tr>
  );
}

// ─── Sub-componente: fila de empleado — Días (Suplentes) ─────────────────────
function FilaEmpleadoDia({ emp, semanas, onChange }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="sticky left-0 z-10 bg-white border-r border-gray-200 px-3 py-2 min-w-40 max-w-45">
        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{emp.nombre}</p>
        {emp.categoria && (
          <p className="text-xs text-gray-400 truncate">{emp.categoria}</p>
        )}
      </td>
      {Array.from({ length: 7 }, (_, i) => (
        <CeldaSemana
          key={i}
          empId={emp.id}
          semanaIndex={i}
          valor={semanas[i] ?? ''}
          onChange={onChange}
          opciones={OPCIONES_DIA}
        />
      ))}
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PlaneadorMensual({ onBack }) {
  const empleados            = useStore((s) => s.empleados);
  const planeacionMensual    = useStore((s) => s.planeacionMensual);
  const actualizarPlaneacion = useStore((s) => s.actualizarPlaneacion);
  const asistenciaDiaria     = useStore((s) => s.asistenciaDiaria);
  const periodoInicio        = useStore((s) => s.periodoInicio);
  const periodoFin           = useStore((s) => s.periodoFin);
  const servicioSeleccionado = useStore((s) => s.servicioSeleccionado);
  const turnoSeleccionado    = useStore((s) => s.turnoSeleccionado);
  const rolSemanal           = useStore((s) => s.rolSemanal);
  const configuracion        = useStore((s) => s.configuracion);

  const base      = empleados.filter((e) => !e.esSuplente);
  const suplentes = empleados.filter((e) =>  e.esSuplente);

  // ── Semanas dinámicas calculadas desde el periodo del store ──────────────
  const { mes1, mes2, semanas } = calcularSemanasRol(periodoInicio);

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
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200 px-4 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200
                       active:bg-gray-50 flex items-center gap-2 transition-colors"
            aria-label="Regresar"
          >
            <ChevronLeft size={18} className="text-gray-600" />
            <span className="text-sm font-semibold text-gray-600">Regresar</span>
          </button>
          <div className="flex items-center gap-2">
            <CalendarDays size={22} className="text-violet-600" />
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">Planeador Mensual</h1>
              <p className="text-xs text-gray-400 leading-none">Rol de actividades — 8 semanas</p>
            </div>
          </div>
          <div className="ml-auto text-xs text-gray-400 font-medium">
            {empleados.length} empleados
          </div>
        </div>
      </header>

      {/* ── Tabla con scroll horizontal ─────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4 pb-28">

        {/* ── Callout informativo ── */}
        <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 mb-4">
          <Info size={15} className="text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-800 leading-relaxed">
            Planeación a largo plazo. Asigna las áreas y actividades (Cendis, EJP, etc.) de las próximas 8 semanas. Esto llenará la hoja de <span className="font-semibold">Rol de Área y Actividad</span>.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
          {/* ── Tabla 1: Personal de Base — por Semanas ─────────────────── */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
              Personal de Base
              <span className="ml-2 font-normal normal-case text-gray-400">
                ({base.length} empleados · {mes1} – {mes2})
              </span>
            </p>
          </div>
          <table className="border-collapse text-sm w-full" style={{ minWidth: '700px' }}>
            <thead>
              {/* Fila 1: nombres de mes, cada uno abarca 4 semanas */}
              <tr className="bg-violet-50 border-y border-violet-100">
                <th className="sticky left-0 z-10 bg-violet-50 border-r border-violet-100
                               px-3 py-1 min-w-40" />
                <th colSpan={4}
                    className="text-center text-xs font-bold uppercase tracking-widest
                               text-violet-600 border-r border-violet-200 py-1.5">
                  {mes1}
                </th>
                <th colSpan={4}
                    className="text-center text-xs font-bold uppercase tracking-widest
                               text-violet-600 py-1.5">
                  {mes2}
                </th>
              </tr>
              {/* Fila 2: rangos de días DD-DD */}
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-3 py-2
                               text-left text-xs font-bold uppercase tracking-wide text-gray-500
                               min-w-40">
                  Empleado
                </th>
                {semanas.map((rango, i) => (
                  <th key={i} className="px-2 py-2 text-center text-xs font-bold
                                         text-gray-500 min-w-17 font-mono">
                    {rango}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {base.length > 0 ? base.map((emp) => (
                <FilaEmpleadoBase
                  key={emp.id}
                  emp={emp}
                  semanas={planeacionMensual[emp.id] ?? {}}
                  onChange={actualizarPlaneacion}
                />
              )) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-400 text-xs">
                    Sin empleados de base registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── Tabla 2: Cubre Descansos / Suplentes — por Días ─────────── */}
          <div className="px-4 pt-4 pb-1 border-t border-gray-100 mt-1">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-600">
              Cubre Descansos / Suplentes
              <span className="ml-2 font-normal normal-case text-gray-400">
                ({suplentes.length} empleados · Dom – Sáb)
              </span>
            </p>
          </div>
          <table className="border-collapse text-sm w-full" style={{ minWidth: '620px' }}>
            <thead>
              <tr className="bg-rose-50 border-y border-rose-100">
                <th className="sticky left-0 z-10 bg-rose-50 border-r border-rose-100 px-3 py-3
                               text-left text-xs font-bold uppercase tracking-wide text-rose-400
                               min-w-40">
                  Empleado
                </th>
                {HEADERS_DIA.map((dia) => (
                  <th key={dia} className="px-2 py-3 text-center text-xs font-bold uppercase
                                            tracking-wide text-rose-400 min-w-17">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suplentes.length > 0 ? suplentes.map((emp) => (
                <FilaEmpleadoDia
                  key={emp.id}
                  emp={emp}
                  semanas={planeacionMensual[emp.id] ?? {}}
                  onChange={actualizarPlaneacion}
                />
              )) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-400 text-xs">
                    Sin suplentes registrados. Marca un empleado como suplente en la sección Empleados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Leyenda de colores */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {OPCIONES_SEMANA.filter(Boolean).map((op) => (
            <span
              key={op}
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border border-transparent
                          ${COLOR_VALOR[op] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {op}
            </span>
          ))}
        </div>
      </div>

      {/* ── Barra de acciones flotante ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-3
                      bg-linear-to-t from-gray-100 via-gray-100/95 to-transparent
                      flex justify-center">
        <button
          onClick={handleExcel}
          className="flex items-center justify-center gap-2.5
                     w-full max-w-sm py-4 rounded-2xl
                     bg-emerald-600 hover:bg-emerald-700 active:scale-95
                     text-white text-base font-bold shadow-lg shadow-emerald-200
                     transition-all duration-150"
        >
          <FileSpreadsheet size={20} />
          Descargar Excel IMSS
        </button>
      </div>
    </div>
  );
}
