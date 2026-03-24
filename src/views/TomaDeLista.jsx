import { generarReporteRol } from '../utils/exportarExcel';
import { useState } from 'react';
import { useStore, ESTADOS_PRINCIPALES, ESTADOS_SECUNDARIOS, getFechaHoy } from '../store/useStore';
import { formatearMensajeWhatsApp } from '../utils/formatearWhatsApp';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Star,
  Moon,
  ChevronDown,
  X,
  FileSpreadsheet,
  FileText,
  Info,
} from 'lucide-react';

// ── Configuración visual por estado ──────────────────────────────────────────
const ESTADO_CONFIG = {
  // ── Principales ──
  Pendiente:      { icon: Clock,        color: 'text-gray-300',    bg: 'bg-gray-50',    label: 'Pendiente'   },
  Asistencia:     { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Asistencia'  },
  Falta:          { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-50',     label: 'Falta'       },
  txt:            { icon: RefreshCw,    color: 'text-orange-400',  bg: 'bg-orange-50',  label: 'TxT'         },
  'T. Extra':     { icon: Star,         color: 'text-amber-400',   bg: 'bg-amber-50',   label: 'T. Extra'    },
  // ── Secundarios IMSS ──
  Vacaciones:     { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Vacaciones'    },
  Incapacidad:    { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Incapacidad'   },
  Licencia:       { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Licencia'      },
  Nivelacion:     { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Nivelacion'    },
  Convenio:       { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Convenio'      },
  'Cambio Adsc':  { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Cambio Adsc'   },
  'Otro Servicio':{ icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Otro Servicio' },
  Permuta:        { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Permuta'       },
  'Cambio Turno': { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Cambio Turno'  },
  Festivo:        { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Festivo'       },
  Comision:       { icon: FileText, color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Comisión'      },
};

export default function TomaDeLista({ onBack }) {
  const {
    areas, empleados, asistenciaDiaria, actualizarAsistencia,
    servicioSeleccionado, turnoSeleccionado, periodoInicio, periodoFin,
    planeacionMensual, rolSemanal, configuracion,
  } = useStore();

  // ── Fecha de hoy como clave del diccionario ──
  const fechaHoy = getFechaHoy();                        // "2026-03-21"
  const registrosDia = asistenciaDiaria[fechaHoy] ?? {}; // { [empId]: { estado, ... } }

  // ── Día actual (0 = Dom, 1 = Lun … 6 = Sáb) ──
  const diaActual = new Date().getDay();

  // ── Estado local ──
  const [mostrarDescansos, setMostrarDescansos] = useState(false);
  // id del empleado cuyo picker de estado está abierto (null = ninguno)
  const [pickerAbierto, setPickerAbierto] = useState(null);
  // id del empleado cuyo sub-panel "Más estados" está expandido
  const [masAbierto, setMasAbierto] = useState(null);

  // ── Helper: ¿hoy es día de descanso del empleado? ──
  const esDiaDescanso = (emp) =>
    Array.isArray(emp.diasDescanso) && emp.diasDescanso.includes(diaActual);

  // ── Seleccionar estado (deja el picker abierto para editar detalles) ──
  const handleSeleccionarEstado = (empId, estado) => {
    actualizarAsistencia(empId, { estado });
    // NO cerramos el picker para que el usuario pueda editar pacientes/cubreA
  };

  // ── Enviar reporte por WhatsApp ───────────────────────────────────────────
  const handleWhatsApp = () => {
    const texto = formatearMensajeWhatsApp({ areas, empleados, registrosDia });
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // ── Exportar Excel IMSS ────────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-md mx-auto pb-36">
      {/* ── Encabezado sticky ── */}
      <div className="flex items-center mb-6 bg-white p-4 rounded-2xl shadow-sm sticky top-0 z-20">
        <button
          onClick={onBack}
          className="p-2 mr-3 bg-gray-100 rounded-full active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Pase de Lista</h2>
      </div>

      {/* ── Callout informativo ── */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4">
        <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800 leading-relaxed">
          Registro diario. Selecciona la asistencia del turno actual. Los datos se guardarán automáticamente para el reporte del IMSS.
        </p>
      </div>

      {/* ── Lista de áreas y empleados ── */}
      <div className="space-y-4">
        {areas.map((area) => {
          // Todos los empleados de esta área
          const todosEnArea = empleados.filter((emp) => emp.areaId === area.id);
          // Filtrar según toggle de descansos
          const empleadosArea = mostrarDescansos
            ? todosEnArea
            : todosEnArea.filter((emp) => !esDiaDescanso(emp));

          if (empleadosArea.length === 0) return null;

          return (
            <div key={area.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Cabecera del área */}
              <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100">
                <h3 className="font-bold text-indigo-800 uppercase text-sm tracking-wider">
                  {area.nombre}
                </h3>
              </div>

              {/* Empleados */}
              <div className="divide-y divide-gray-100">
                {empleadosArea.map((emp) => {
                  const registro = registrosDia[emp.id];
                  const estadoActual = registro?.estado ?? 'Pendiente';
                  const config = ESTADO_CONFIG[estadoActual] ?? ESTADO_CONFIG.Pendiente;
                  const IconoEstado = config.icon;
                  const enDescanso = esDiaDescanso(emp);
                  const abierto = pickerAbierto === emp.id;

                  return (
                    <div key={emp.id}>
                      {/* ── Fila del empleado ── */}
                      <div
                        onClick={() =>
                          setPickerAbierto(abierto ? null : emp.id)
                        }
                        className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-gray-50 transition-colors"
                      >
                        {/* Info */}
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800">
                              {emp.nombre}
                            </p>
                            {enDescanso && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                                <Moon size={9} />
                                Descanso
                              </span>
                            )}
                          </div>
                          {(emp.subArea || emp.extra) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {emp.subArea}
                              {emp.extra && (
                                <span className="font-medium text-indigo-500 ml-1">
                                  ({emp.extra})
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Estado + chevron */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          <div className={`flex items-center gap-1 ${config.bg} px-2 py-1 rounded-full`}>
                            <IconoEstado size={16} className={config.color} />
                            <span className={`text-[11px] font-semibold ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`text-gray-400 transition-transform duration-150 ${abierto ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>

                      {/* ── Picker de estado (inline desplegable) ── */}
                      {abierto && (
                        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">

                          {/* ── Encabezado del picker ── */}
                          <div className="flex items-center gap-2 pt-3 pb-2">
                            <Send size={16} className="text-emerald-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">
                              Seleccionar estado (para WhatsApp)
                            </span>
                          </div>

                          {/* ── Fila 1: estados principales — tarjetas grandes ── */}
                          <div className="flex flex-wrap gap-3">
                            {ESTADOS_PRINCIPALES.map((estado) => {
                              const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.Pendiente;
                              const activo = estadoActual === estado;
                              return (
                                <button
                                  key={estado}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSeleccionarEstado(emp.id, estado);
                                  }}
                                  className={`px-5 py-3.5 rounded-2xl text-base font-bold
                                    transition-all active:scale-95
                                    ${activo
                                      ? `${cfg.bg} ${cfg.color} border-2 border-current shadow-md`
                                      : 'bg-white text-gray-600 border border-gray-200'
                                    }`}
                                >
                                  {cfg.label}
                                </button>
                              );
                            })}

                            {/* Botón Más... */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMasAbierto(masAbierto === emp.id ? null : emp.id);
                              }}
                              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-base font-bold
                                transition-all active:scale-95 border
                                ${masAbierto === emp.id
                                  ? 'bg-gray-800 text-white border-gray-800'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                            >
                              Más…
                              <ChevronDown
                                size={18}
                                className={`transition-transform duration-150 ${masAbierto === emp.id ? 'rotate-180' : ''}`}
                              />
                            </button>

                            {/* Cerrar picker */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPickerAbierto(null);
                                setMasAbierto(null);
                              }}
                              className="flex items-center justify-center w-14 py-3.5 rounded-2xl bg-white text-gray-400 border border-gray-200 active:scale-95"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          {/* ── Sub-panel de estados secundarios IMSS ── */}
                          {masAbierto === emp.id && (
                            <div
                              className="mt-3 grid grid-cols-3 gap-2 p-3 bg-white rounded-2xl border border-blue-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ESTADOS_SECUNDARIOS.map((estado) => {
                                const cfg = ESTADO_CONFIG[estado] ?? { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: estado };
                                const Ic = cfg.icon;
                                const activo = estadoActual === estado;
                                return (
                                  <button
                                    key={estado}
                                    onClick={() => handleSeleccionarEstado(emp.id, estado)}
                                    className={`flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold
                                      transition-all active:scale-95 border justify-center text-center
                                      ${activo
                                        ? `${cfg.bg} ${cfg.color} border-current shadow-sm`
                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                      }`}
                                  >
                                    <Ic size={12} className="shrink-0" />
                                    <span className="leading-tight">{cfg.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* ── Inputs de detalle condicionales ── */}
                          {['Asistencia', 'T. Extra', 'txt'].includes(estadoActual) && (
                            <div
                              className="mt-3 flex flex-wrap gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Input Pacientes */}
                              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
                                <span className="text-xs text-gray-400 font-medium">Pacientes</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={registro?.pacientes ?? 0}
                                  onChange={(e) =>
                                    actualizarAsistencia(emp.id, {
                                      pacientes: Math.max(0, Number(e.target.value)),
                                    })
                                  }
                                  className="w-12 text-center text-sm font-bold text-gray-700 focus:outline-none"
                                />
                              </div>

                              {/* Input Cubre a — solo si estado es 'txt' */}
                              {estadoActual === 'txt' && (
                                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex-1 min-w-35">
                                  <span className="text-xs text-gray-400 font-medium shrink-0">Cubre a:</span>
                                  <input
                                    type="text"
                                    value={registro?.cubreA ?? ''}
                                    onChange={(e) =>
                                      actualizarAsistencia(emp.id, { cubreA: e.target.value })
                                    }
                                    placeholder="Nombre..."
                                    className="flex-1 text-sm text-gray-700 focus:outline-none min-w-0"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toggle mostrar descansos ── */}
      <div className="flex justify-center mt-6 mb-2">
        <button
          onClick={() => setMostrarDescansos((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors active:scale-95
            ${mostrarDescansos
              ? 'bg-red-50 text-red-500 border-red-200'
              : 'bg-white text-gray-500 border-gray-200'
            }`}
        >
          <Moon size={15} />
          {mostrarDescansos ? 'Ocultar personal en descanso' : 'Mostrar personal en descanso'}
        </button>
      </div>

      {/* ── Barra de acciones flotante ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-gray-100 via-gray-100 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          {/* Botón Excel */}
          <button
            onClick={handleExcel}
            className="flex items-center justify-center gap-2 flex-1 bg-white text-emerald-700
                       font-bold py-4 rounded-2xl shadow-sm border border-emerald-200
                       active:scale-95 transition-transform"
          >
            <FileSpreadsheet size={20} />
            <span className="text-sm">Excel IMSS</span>
          </button>

          {/* Botón WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 flex-2 bg-emerald-600
                       text-white font-bold py-4 rounded-2xl shadow-lg
                       active:scale-95 transition-transform"
          >
            <Send size={20} />
            <span className="text-sm">Reporte WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}