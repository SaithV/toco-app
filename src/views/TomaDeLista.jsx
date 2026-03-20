import { useState } from 'react';
import { useStore, ESTADOS_ASISTENCIA } from '../store/useStore';
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
} from 'lucide-react';

// ── Configuración visual por estado ──────────────────────────────────────────
const ESTADO_CONFIG = {
  Pendiente:   { icon: Clock,        color: 'text-gray-300',   bg: 'bg-gray-50',    label: 'Pendiente'  },
  Asistencia:  { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Asistencia' },
  Falta:       { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-50',     label: 'Falta'      },
  txt:         { icon: RefreshCw,    color: 'text-orange-400', bg: 'bg-orange-50',  label: 'TxT'        },
  'T. Extra':  { icon: Star,         color: 'text-amber-400',  bg: 'bg-amber-50',   label: 'T. Extra'   },
};

export default function TomaDeLista({ onBack }) {
  const { areas, empleados, asistenciaDiaria, actualizarAsistencia } = useStore();

  // ── Día actual (0 = Dom, 1 = Lun … 6 = Sáb) ──
  const diaActual = new Date().getDay();

  // ── Estado local ──
  const [mostrarDescansos, setMostrarDescansos] = useState(false);
  // id del empleado cuyo picker de estado está abierto (null = ninguno)
  const [pickerAbierto, setPickerAbierto] = useState(null);

  // ── Helper: ¿hoy es día de descanso del empleado? ──
  const esDiaDescanso = (emp) =>
    Array.isArray(emp.diasDescanso) && emp.diasDescanso.includes(diaActual);

  // ── Seleccionar estado (deja el picker abierto para editar detalles) ──
  const handleSeleccionarEstado = (empId, estado) => {
    actualizarAsistencia(empId, { estado });
    // NO cerramos el picker para que el usuario pueda editar pacientes/cubreA
  };

  // ── Generar mensaje WhatsApp ──────────────────────────────────────────────
  const generarWhatsApp = () => {
    const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const fechaStr = new Date().toLocaleDateString('es-MX', opcionesFecha);
    const fechaCapitalizada = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);

    let mensaje = `*${fechaCapitalizada}*\n\n`;

    // Helper: formatea una línea individual según el estado del empleado
    const formatearLinea = (emp) => {
      const reg = asistenciaDiaria[emp.id];
      const estado = reg?.estado ?? 'Pendiente';
      const pacientes = reg?.pacientes ?? 0;
      const cubreA = reg?.cubreA ?? '';
      const extra = emp.extra ? ` ${emp.extra}` : '';

      switch (estado) {
        case 'Falta':
          return `~Falta ${emp.nombre}~`;
        case 'Asistencia':
          return pacientes > 0
            ? `(${pacientes}) ${emp.nombre}${extra}`
            : `${emp.nombre}${extra}`;
        case 'T. Extra':
          return pacientes > 0
            ? `(${pacientes}) ${emp.nombre}${extra} (T. Extra)`
            : `${emp.nombre}${extra} (T. Extra)`;
        case 'txt':
          return pacientes > 0
            ? `(${pacientes}) ${emp.nombre}${extra} (txt por ${cubreA})`
            : `${emp.nombre}${extra} (txt por ${cubreA})`;
        default:
          return null; // 'Pendiente' → omitir
      }
    };

    areas.forEach((area) => {
      // Solo empleados con estado distinto a Pendiente en esta área
      const empEnArea = empleados.filter(
        (emp) =>
          emp.areaId === area.id &&
          (asistenciaDiaria[emp.id]?.estado ?? 'Pendiente') !== 'Pendiente'
      );
      if (empEnArea.length === 0) return;

      mensaje += `*${area.nombre}*\n`;

      // Agrupar por sub-área
      const subAreasMap = {};
      empEnArea.forEach((emp) => {
        const sub = emp.subArea || 'General';
        if (!subAreasMap[sub]) subAreasMap[sub] = [];
        subAreasMap[sub].push(emp);
      });

      Object.keys(subAreasMap).forEach((subArea) => {
        const lineas = subAreasMap[subArea]
          .map(formatearLinea)
          .filter(Boolean);
        if (lineas.length === 0) return;

        if (subArea === 'General') {
          mensaje += `${lineas.join(', ')}\n`;
        } else {
          mensaje += `${subArea}: ${lineas.join(', ')}\n`;
        }
      });

      mensaje += '\n';
    });

    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
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
                  const registro = asistenciaDiaria[emp.id];
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
                        <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                          <p className="text-[11px] text-gray-400 font-medium pt-2 pb-1.5">
                            Seleccionar estado:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {ESTADOS_ASISTENCIA.map((estado) => {
                              const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.Pendiente;
                              const Ic = cfg.icon;
                              const activo = estadoActual === estado;
                              return (
                                <button
                                  key={estado}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSeleccionarEstado(emp.id, estado);
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                                    transition-all active:scale-95 border
                                    ${activo
                                      ? `${cfg.bg} ${cfg.color} border-current shadow-sm`
                                      : 'bg-white text-gray-500 border-gray-200'
                                    }`}
                                >
                                  <Ic size={13} />
                                  {estado}
                                </button>
                              );
                            })}
                            {/* Cerrar picker */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPickerAbierto(null);
                              }}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-gray-400 bg-white border border-gray-200 active:scale-95"
                            >
                              <X size={12} />
                            </button>
                          </div>

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

      {/* ── Botón flotante WhatsApp ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-gray-100 via-gray-100 to-transparent flex justify-center">
        <button
          onClick={generarWhatsApp}
          className="bg-emerald-600 text-white px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-transform w-full max-w-md justify-center"
        >
          <Send size={20} />
          Generar WhatsApp
        </button>
      </div>
    </div>
  );
}