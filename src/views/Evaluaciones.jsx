import { useState, useRef, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  ChevronLeft, ClipboardCheck, FileSpreadsheet, X,
  Trash2, UserPlus, Search, PenLine, CheckCircle2, Smartphone,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportarCedulaEvaluacion } from '../utils/exportarEvaluacion';
import { CRITERIOS } from '../data/criteriosEvaluacion';

const TURNOS = ['Matutino', 'Vespertino', 'Nocturno'];

const BTN_CAL = {
  2: {
    active: 'bg-emerald-500 text-white',
    base:   'bg-white text-gray-400 hover:bg-emerald-50 hover:text-emerald-600',
  },
  1: {
    active: 'bg-amber-400 text-white',
    base:   'bg-white text-gray-400 hover:bg-amber-50 hover:text-amber-600',
  },
  0: {
    active: 'bg-red-500 text-white',
    base:   'bg-white text-gray-400 hover:bg-red-50 hover:text-red-600',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CeldaCalificacion — segmented control compacto (ahorra espacio horizontal)
// ─────────────────────────────────────────────────────────────────────────────
function CeldaCalificacion({ valor, onChange }) {
  return (
    <td className="px-2 py-2 text-center align-middle">
      <div className="flex w-full max-w-30 mx-auto rounded-lg overflow-hidden
                      border border-gray-300 shadow-sm">
        {[2, 1, 0].map((v, i) => {
          const isActive = valor === v;
          return (
            <button
              key={v}
              onClick={() => onChange(isActive ? null : v)}
              className={`flex-1 py-3 text-lg font-bold transition-colors
                          focus:outline-none active:opacity-80
                          ${i < 2 ? 'border-r border-gray-300' : ''}
                          ${isActive ? BTN_CAL[v].active : BTN_CAL[v].base}`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ModalFirma — pantalla completa para privacidad
// ─────────────────────────────────────────────────────────────────────────────
function ModalFirma({ titulo, sigRef, onGuardar, onCerrar }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-gray-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
            Firma requerida
          </p>
          <h2 className="text-xl font-bold text-gray-800 leading-tight">{titulo}</h2>
        </div>
        <button
          onClick={onCerrar}
          className="rounded-xl p-2 hover:bg-gray-100 transition-colors"
          aria-label="Cancelar"
        >
          <X className="h-6 w-6 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-3">
        <p className="text-sm text-gray-400">Firma en el recuadro de abajo</p>
        <div className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50
                        overflow-hidden touch-none">
          <SignatureCanvas
            ref={sigRef}
            penColor="#1e293b"
            canvasProps={{
              style: { width: '100%', height: '260px', display: 'block' },
            }}
          />
        </div>
      </div>

      <div className="px-5 pb-10 flex gap-3">
        <button
          onClick={() => sigRef.current?.clear()}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl
                     border-2 border-gray-200 bg-white py-4 text-sm font-semibold text-gray-600
                     hover:bg-gray-50 active:scale-95 transition-all"
        >
          <Trash2 className="h-4 w-4" />
          Limpiar
        </button>
        <button
          onClick={onGuardar}
          className="flex-2 flex items-center justify-center gap-2 rounded-2xl
                     bg-amber-500 py-4 text-sm font-semibold text-white shadow-lg
                     hover:bg-amber-600 active:scale-95 transition-all"
        >
          <CheckCircle2 className="h-5 w-5" />
          Guardar Firma
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function Evaluaciones({ onBack }) {
  const empleados     = useStore((s) => s.empleados);
  const configuracion = useStore((s) => s.configuracion);

  const [mesEvaluacion, setMesEvaluacion]         = useState('');
  const [servicio, setServicio]                   = useState('');
  const [turno, setTurno]                         = useState('Nocturno');
  const [empleadosSeleccionados, setEmpleadosSel] = useState([]);
  const [calificaciones, setCalificaciones]       = useState({});
  const [observaciones, setObservaciones]         = useState(['', '', '', '']);
  const [firmasEvaluados, setFirmasEvaluados]     = useState({});
  const [firmaEvaluador, setFirmaEvaluador]       = useState(null);
  const [firmaActiva, setFirmaActiva]             = useState(null);
  const [modalEmpleados, setModalEmpleados]       = useState(false);
  const [busquedaEmpleado, setBusquedaEmpleado]   = useState('');

  const sigModalRef = useRef(null);

  const empleadosDisponibles = empleados
    .filter((e) => !empleadosSeleccionados.includes(e.id))
    .filter((e) =>
      busquedaEmpleado === '' ||
      e.nombre.toLowerCase().includes(busquedaEmpleado.toLowerCase()) ||
      (e.categoria ?? '').toLowerCase().includes(busquedaEmpleado.toLowerCase())
    );

  const agregarEmpleado = (empId) => {
    setEmpleadosSel((prev) => {
      if (prev.includes(empId) || prev.length >= 4) return prev;
      return [...prev, empId];
    });
    setBusquedaEmpleado('');
    setModalEmpleados(false);
  };

  const quitarEmpleado = (empId) => {
    setEmpleadosSel((prev) => prev.filter((id) => id !== empId));
    setCalificaciones((prev) => {
      const copia = { ...prev };
      Object.keys(copia).forEach((k) => {
        const fila = { ...copia[k] };
        delete fila[empId];
        copia[k] = fila;
      });
      return copia;
    });
    setFirmasEvaluados((prev) => {
      const copia = { ...prev };
      delete copia[empId];
      return copia;
    });
  };

  const setCalificacion = useCallback((pregIdx, empId, valor) => {
    setCalificaciones((prev) => ({
      ...prev,
      [pregIdx]: { ...(prev[pregIdx] ?? {}), [empId]: valor },
    }));
  }, []);

  const getCalificacion = (pregIdx, empId) =>
    calificaciones[pregIdx]?.[empId] ?? null;

  const totalEmp = (empId) =>
    CRITERIOS.reduce((sum, _, i) => sum + (getCalificacion(i, empId) ?? 0), 0);

  const setObservacion = (idx, valor) =>
    setObservaciones((prev) => prev.map((v, i) => (i === idx ? valor : v)));

  const abrirFirma = (key) => {
    setFirmaActiva(key);
    setTimeout(() => sigModalRef.current?.clear(), 50);
  };

  const guardarFirma = () => {
    if (!sigModalRef.current) return;
    if (sigModalRef.current.isEmpty()) {
      setFirmaActiva(null);
      return;
    }
    const dataUrl = sigModalRef.current.toDataURL('image/png');
    if (firmaActiva === 'EVALUADOR') {
      setFirmaEvaluador(dataUrl);
    } else {
      setFirmasEvaluados((prev) => ({ ...prev, [firmaActiva]: dataUrl }));
    }
    setFirmaActiva(null);
  };

  const nombreFirmaActiva = () => {
    if (firmaActiva === 'EVALUADOR') return 'Jefa de Piso / Evaluador';
    const emp = empleados.find((e) => e.id === firmaActiva);
    return emp?.nombre ?? '';
  };

  const empObjs = empleadosSeleccionados
    .map((id) => empleados.find((e) => e.id === id))
    .filter(Boolean);

  const handleGenerarCedula = async () => {
    await exportarCedulaEvaluacion({
      empleadosSeleccionados,
      empleadosObjs: empObjs,
      calificaciones,
      firmasEvaluados,
      firmaEvaluador,
      mesEvaluacion,
      servicio,
      turno,
      observaciones,
    });
  };

  // ─────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Encabezado */}
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
            <div className="flex items-center justify-center rounded-xl bg-amber-50 p-2">
              <ClipboardCheck className="h-5 w-5 text-amber-600" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">
                Evaluación de Enlace
              </h1>
              <p className="text-xs text-gray-400">Cédula de evaluación de turno</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-4 py-4 pb-36 flex flex-col gap-4 max-w-4xl mx-auto w-full">

        {/* ── Datos de la cédula ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Datos de la cédula
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Mes de evaluación</label>
              <input
                type="text"
                value={mesEvaluacion}
                onChange={(e) => setMesEvaluacion(e.target.value)}
                placeholder="Ej. Marzo / Abril"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                           text-gray-800 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Turno</label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                           text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400
                           transition-colors"
              >
                {TURNOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Servicio</label>
              <input
                type="text"
                value={servicio}
                onChange={(e) => setServicio(e.target.value)}
                placeholder="Ej. HOSPITALIZACION CIRUGIA"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                           text-gray-800 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ── Empleados a evaluar ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Empleados a evaluar
              <span className="ml-1.5 font-normal text-gray-300">
                ({empleadosSeleccionados.length}/4)
              </span>
            </p>
            {empleadosSeleccionados.length < 4 && (
              <button
                onClick={() => { setBusquedaEmpleado(''); setModalEmpleados(true); }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5
                           text-xs font-semibold text-white
                           hover:bg-amber-600 active:scale-95 transition-all"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Agregar
              </button>
            )}
          </div>

          {empleadosSeleccionados.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">
              Selecciona hasta 4 empleados para evaluar.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {empObjs.map((emp) => (
                <div key={emp.id}
                  className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200
                             px-3 py-1.5">
                  <span className="text-sm font-semibold text-amber-800 max-w-36 truncate">
                    {emp.nombre}
                  </span>
                  <button
                    onClick={() => quitarEmpleado(emp.id)}
                    className="text-amber-400 hover:text-red-500 transition-colors"
                    aria-label={`Quitar ${emp.nombre}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabla de criterios ────────────────────────────────────────── */}
        {empleadosSeleccionados.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Banner de rotación — solo visible en portrait */}
            <div className="landscape:hidden bg-gray-100 text-gray-600 text-xs
                            px-3 py-2 flex items-center gap-2 border-b border-gray-200">
              <Smartphone className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={1.8} />
              <span>
                Gira tu teléfono en horizontal para ver a todos los empleados al mismo tiempo.
              </span>
            </div>

            <div className="overflow-x-auto w-full pb-4">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-100">
                    <th className="sticky left-0 z-10 bg-amber-50 border-r border-amber-100
                                   px-3 py-3 text-left text-xs font-semibold text-amber-700
                                   uppercase tracking-wide min-w-50 sm:min-w-62.5
                                   shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Criterio
                    </th>
                    {empObjs.map((emp) => (
                      <th key={emp.id}
                          className="px-3 py-3 text-center text-xs font-semibold text-amber-700
                                     uppercase tracking-wide min-w-35">
                        <span className="block truncate max-w-32.5 mx-auto" title={emp.nombre}>
                          {emp.nombre.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIOS.map((criterio, pregIdx) => (
                    <tr key={pregIdx}
                        className={`border-b border-gray-100
                                    ${pregIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="sticky left-0 z-10 border-r border-gray-100 px-3 py-3
                                     min-w-50 sm:min-w-62.5 whitespace-normal
                                     text-sm leading-relaxed text-gray-700 text-left bg-inherit
                                     shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {criterio}
                      </td>
                      {empObjs.map((emp) => (
                        <CeldaCalificacion
                          key={emp.id}
                          valor={getCalificacion(pregIdx, emp.id)}
                          onChange={(val) => setCalificacion(pregIdx, emp.id, val)}
                        />
                      ))}
                    </tr>
                  ))}

                  {/* Fila de totales */}
                  <tr className="bg-amber-50 border-t-2 border-amber-200">
                    <td className="sticky left-0 z-10 bg-amber-50 border-r border-amber-100
                                   px-3 py-3 text-sm font-bold text-amber-700 uppercase tracking-wide
                                   shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Total&nbsp;
                      <span className="font-normal text-amber-400 text-xs">
                        (máx. {CRITERIOS.length * 2})
                      </span>
                    </td>
                    {empObjs.map((emp) => (
                      <td key={emp.id} className="px-3 py-3 text-center">
                        <span className={`inline-block rounded-xl px-3 py-1.5 text-sm font-bold
                          ${totalEmp(emp.id) >= CRITERIOS.length * 1.5
                            ? 'bg-emerald-100 text-emerald-700'
                            : totalEmp(emp.id) >= CRITERIOS.length
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                          {totalEmp(emp.id)}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Observaciones ─────────────────────────────────────────────── */}
        {empleadosSeleccionados.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Observaciones
            </p>
            <div className="flex flex-col gap-2">
              {observaciones.map((obs, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Observación {idx + 1}
                  </label>
                  <input
                    type="text"
                    value={obs}
                    onChange={(e) => setObservacion(idx, e.target.value)}
                    placeholder={`Escribe una observación...`}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                               text-gray-800 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Firmas ────────────────────────────────────────────────────── */}
        {empleadosSeleccionados.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Firmas
            </p>
            <div className="flex flex-col gap-2">
              {empObjs.map((emp) => {
                const firmado = !!firmasEvaluados[emp.id];
                return (
                  <button
                    key={emp.id}
                    onClick={() => abrirFirma(emp.id)}
                    className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5
                               border-2 transition-all active:scale-95
                               ${firmado
                                 ? 'border-emerald-200 bg-emerald-50'
                                 : 'border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50'
                               }`}
                  >
                    <div className="flex items-center gap-3">
                      <PenLine className={`h-5 w-5 shrink-0 ${firmado ? 'text-emerald-500' : 'text-gray-400'}`}
                               strokeWidth={1.8} />
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${firmado ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {emp.nombre}
                        </p>
                        <p className="text-xs text-gray-400">
                          {firmado ? 'Firmado — toca para re-firmar' : 'Toca para firmar'}
                        </p>
                      </div>
                    </div>
                    {firmado && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" strokeWidth={2} />
                    )}
                  </button>
                );
              })}

              <div className="h-px bg-gray-100 my-1" />

              {/* Evaluador */}
              <button
                onClick={() => abrirFirma('EVALUADOR')}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5
                           border-2 transition-all active:scale-95
                           ${firmaEvaluador
                             ? 'border-emerald-200 bg-emerald-50'
                             : 'border-amber-200 bg-amber-50/50 hover:border-amber-400'
                           }`}
              >
                <div className="flex items-center gap-3">
                  <PenLine className={`h-5 w-5 shrink-0 ${firmaEvaluador ? 'text-emerald-500' : 'text-amber-500'}`}
                           strokeWidth={1.8} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${firmaEvaluador ? 'text-emerald-700' : 'text-amber-700'}`}>
                      Jefa de Piso / Evaluador
                    </p>
                    <p className="text-xs text-gray-400">
                      {firmaEvaluador ? 'Firmado — toca para re-firmar' : 'Toca para firmar'}
                    </p>
                  </div>
                </div>
                {firmaEvaluador && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ── Barra flotante inferior ──────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
        <div className="h-28 bg-linear-to-t from-gray-100 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 flex justify-center pb-6 pointer-events-auto">
          <button
            onClick={handleGenerarCedula}
            disabled={empleadosSeleccionados.length === 0}
            className="flex items-center gap-2.5 rounded-2xl bg-amber-500 px-6 py-3.5 shadow-lg
                       text-white text-sm font-semibold
                       hover:bg-amber-600 active:scale-95 transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-amber-400
                       disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileSpreadsheet className="h-5 w-5" strokeWidth={1.8} />
            Generar Cédula Excel
          </button>
        </div>
      </div>

      {/* ── Modal: Selector de empleados ─────────────────────────────────── */}
      {modalEmpleados && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalEmpleados(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl pb-8 pt-4 px-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700">Seleccionar empleado</p>
              <button
                onClick={() => setModalEmpleados(false)}
                className="rounded-xl p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Buscador */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50
                            px-3 py-2 mb-3">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="search"
                value={busquedaEmpleado}
                onChange={(e) => setBusquedaEmpleado(e.target.value)}
                placeholder="Buscar por nombre o categoría..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400
                           focus:outline-none"
                autoFocus
              />
            </div>

            {/* Lista */}
            {empleadosDisponibles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {empleados.filter((e) => !empleadosSeleccionados.includes(e.id)).length === 0
                  ? 'No hay más empleados disponibles.'
                  : 'Sin resultados para esa búsqueda.'}
              </p>
            ) : (
              <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {empleadosDisponibles.map((emp) => (
                  <li key={emp.id}>
                    <button
                      onClick={() => agregarEmpleado(emp.id)}
                      className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5
                                 text-left hover:bg-amber-50 active:bg-amber-100 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center
                                      rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                        {emp.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{emp.nombre}</p>
                        {emp.categoria && (
                          <p className="text-xs text-gray-400">{emp.categoria}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Ir a Empleados */}
            <button
              onClick={onBack}
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-2xl
                         border-2 border-dashed border-gray-200 py-3 text-sm font-semibold
                         text-gray-500 hover:border-amber-300 hover:text-amber-600 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Ir a Empleados para registrar uno nuevo
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Firma a pantalla completa ─────────────────────────────── */}
      {firmaActiva !== null && (
        <ModalFirma
          titulo={nombreFirmaActiva()}
          sigRef={sigModalRef}
          onGuardar={guardarFirma}
          onCerrar={() => setFirmaActiva(null)}
        />
      )}

    </div>
  );
}