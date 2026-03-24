import { useState } from 'react';
import {
  ChevronLeft, Activity, Plus, Trash2, FileSpreadsheet, X, ClipboardList,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportarExcelDatamart } from '../utils/exportarDatamart';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

/** Definición de todos los procedimientos — label visible + key en el objeto */
const PROCEDIMIENTOS = [
  { key: 'vma',            label: 'VMA'              },
  { key: 'cpap',           label: 'CPAP'             },
  { key: 'cardioversion',  label: 'Cardioversión'    },
  { key: 'cvc',            label: 'CVC'              },
  { key: 'vesical',        label: 'Sonda Vesical'    },
  { key: 'sng',            label: 'SNG (Nasogástrica)'},
  { key: 'sog',            label: 'SOG (Orogástrica)'},
  { key: 'pleural',        label: 'Pleural'          },
  { key: 'curaciones',     label: 'Curaciones'       },
  { key: 'tenckhoff',      label: 'Tenckhoff'        },
  { key: 'interconsultas', label: 'Interconsultas'   },
  { key: 'paracentesis',   label: 'Paracentesis'     },
  { key: 'toracocentesis', label: 'Toracocentesis'   },
  { key: 'artrocentesis',  label: 'Artrocentesis'    },
  { key: 'lumbar',         label: 'P. Lumbar'        },
  { key: 'drenaje',        label: 'Drenaje'          },
  { key: 'suturas',        label: 'Suturas'          },
  { key: 'npt',            label: 'NPT'              },
];

/** Objeto con todos los procedimientos vacíos para inicializar el form */
const PROCS_VACIOS = Object.fromEntries(PROCEDIMIENTOS.map(({ key }) => [key, '']));

/** Form vacío completo */
const FORM_VACIO = () => ({
  fecha:   new Date().toISOString().split('T')[0],
  nombre:  '',
  hosp:    '',
  origen:  'De la Unidad',
  ...PROCS_VACIOS,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de estilo
// ─────────────────────────────────────────────────────────────────────────────
const inputCls = `rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                  text-gray-800 placeholder-gray-400 focus:outline-none
                  focus:ring-2 focus:ring-rose-400 transition-colors w-full`;

const selectCls = `rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                   text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400
                   transition-colors w-full`;

const inputProcCls = `rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm
                      text-gray-800 placeholder-gray-300 focus:outline-none text-center
                      focus:ring-2 focus:ring-rose-300 transition-colors w-full`;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Campo con label
// ─────────────────────────────────────────────────────────────────────────────
function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Tarjeta de registro en la lista
// ─────────────────────────────────────────────────────────────────────────────
function TarjetaRegistro({ registro, onEliminar }) {
  // Muestra solo los procedimientos que tengan valor
  const procsActivos = PROCEDIMIENTOS.filter(({ key }) => registro[key]?.trim());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">
            {registro.nombre || '—'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{registro.fecha}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs font-medium text-rose-500 bg-rose-50
                             px-2 py-0.5 rounded-full">
              {registro.hosp || 'Sin cama'}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{registro.origen}</span>
          </div>
        </div>
        <button
          onClick={onEliminar}
          className="shrink-0 flex items-center justify-center rounded-xl p-2
                     text-red-400 hover:bg-red-50 active:scale-95 transition-all"
          aria-label="Eliminar registro"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Chips de procedimientos */}
      {procsActivos.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {procsActivos.map(({ key, label }) => (
            <span
              key={key}
              className="text-[11px] font-semibold bg-rose-50 text-rose-700
                         border border-rose-100 px-2 py-0.5 rounded-full"
            >
              {label}: {registro[key]}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Sin procedimientos registrados</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function DataMart({ onBack }) {
  const registrosDatamart        = useStore((s) => s.registrosDatamart);
  const agregarRegistroDatamart  = useStore((s) => s.agregarRegistroDatamart);
  const eliminarRegistroDatamart = useStore((s) => s.eliminarRegistroDatamart);
  const censoMadrugada           = useStore((s) => s.censoMadrugada);
  const configuracion            = useStore((s) => s.configuracion);

  const [modalAbierto,       setModalAbierto]       = useState(false);
  const [form,               setForm]               = useState(FORM_VACIO());
  const [periodoExportacion, setPeriodoExportacion] = useState('');
  const [egresosMes,         setEgresosMes]         = useState('');
  const [servicioDatamart,   setServicioDatamart]   = useState(
    configuracion.servicioSeleccionado || 'GINECOLOGÍA'
  );

  // ── Camas ocupadas para el selector inteligente ─────────────────────────
  const camasOcupadas = Object.entries(censoMadrugada).filter(
    ([, datos]) => datos?.paciente?.nombre
  );

  // ── Setters ─────────────────────────────────────────────────────────────
  const setField = (campo, valor) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  // Al elegir una cama del censo, auto-rellena nombre y cama
  const handleSeleccionarCama = (e) => {
    const idCama = e.target.value;
    if (!idCama) {
      setField('nombre', '');
      setField('hosp', '');
      return;
    }
    const datos = censoMadrugada[idCama];
    setForm((prev) => ({
      ...prev,
      nombre: datos?.paciente?.nombre ?? '',
      hosp:   idCama,
    }));
  };

  // ── Guardar ─────────────────────────────────────────────────────────────
  const guardar = () => {
    if (!form.nombre.trim()) return;
    agregarRegistroDatamart({ ...form });
    setForm(FORM_VACIO());
    setModalAbierto(false);
  };

  // ── Cerrar modal ─────────────────────────────────────────────────────────
  const cerrarModal = () => {
    setForm(FORM_VACIO());
    setModalAbierto(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-xl p-2 text-gray-500
                       hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Regresar"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-xl bg-rose-50 p-2">
              <Activity className="h-5 w-5 text-rose-600" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">
                DataMart
              </h1>
              <p className="text-xs text-gray-400">
                Bitácora de Procedimientos
                {registrosDatamart.length > 0 && (
                  <span className="ml-1.5">
                    · {registrosDatamart.length} registro{registrosDatamart.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenido principal ─────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-4 pb-56 flex flex-col gap-3">

        {/* Botón nueva entrada */}
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center justify-center gap-2.5 w-full rounded-2xl
                     bg-rose-600 py-4 text-sm font-bold text-white shadow-sm
                     hover:bg-rose-700 active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Nuevo Procedimiento
        </button>

        {/* Lista de registros */}
        {registrosDatamart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <ClipboardList className="h-10 w-10 text-gray-300 mx-auto" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-gray-400">Sin registros aún</p>
            <p className="text-xs text-gray-300 max-w-xs">
              Presiona "Nuevo Procedimiento" para agregar el primer registro del turno.
            </p>
          </div>
        ) : (
          registrosDatamart.map((reg) => (
            <TarjetaRegistro
              key={reg.id}
              registro={reg}
              onEliminar={() => {
                if (window.confirm(`¿Eliminar el registro de "${reg.nombre}"?`)) {
                  eliminarRegistroDatamart(reg.id);
                }
              }}
            />
          ))
        )}
      </main>

      {/* ── Modal: Nuevo Registro ────────────────────────────────────────── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
                        flex flex-col justify-end sm:items-center sm:justify-center">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl
                          flex flex-col max-h-[94dvh] shadow-2xl overflow-hidden">

            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4
                            border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-rose-100 p-2.5">
                  <Activity className="h-5 w-5 text-rose-600" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    DataMart
                  </p>
                  <h2 className="text-xl font-bold text-gray-800 leading-tight">
                    Nuevo Registro
                  </h2>
                </div>
              </div>
              <button
                onClick={cerrarModal}
                className="rounded-xl p-2 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Formulario scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

              {/* ── Selector inteligente desde Censo ─────────────────────── */}
              {camasOcupadas.length > 0 && (
                <section className="flex flex-col gap-2">
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                    <p className="text-xs font-bold uppercase tracking-widest
                                  text-rose-600 mb-2">
                      Importar desde Censo de Madrugada
                    </p>
                    <select
                      className={selectCls}
                      defaultValue=""
                      onChange={handleSeleccionarCama}
                    >
                      <option value="">— Seleccionar paciente —</option>
                      {camasOcupadas.map(([idCama, datos]) => (
                        <option key={idCama} value={idCama}>
                          {idCama} — {datos.paciente.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>
              )}

              {/* ── Datos básicos ─────────────────────────────────────────── */}
              <section className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Datos Generales
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Fecha">
                    <input
                      type="date"
                      className={inputCls}
                      value={form.fecha}
                      onChange={(e) => setField('fecha', e.target.value)}
                    />
                  </Campo>
                  <Campo label="Cama / Hosp.">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="G01, L03…"
                      value={form.hosp}
                      onChange={(e) => setField('hosp', e.target.value)}
                    />
                  </Campo>
                </div>

                <Campo label="Nombre del paciente">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="Apellido Apellido, Nombre"
                    value={form.nombre}
                    onChange={(e) => setField('nombre', e.target.value)}
                  />
                </Campo>

                <Campo label="Origen">
                  <select
                    className={selectCls}
                    value={form.origen}
                    onChange={(e) => setField('origen', e.target.value)}
                  >
                    <option value="De la Unidad">De la Unidad</option>
                    <option value="De otra unidad">De otra unidad</option>
                  </select>
                </Campo>
              </section>

              {/* ── Procedimientos ────────────────────────────────────────── */}
              <section className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Procedimientos realizados
                </p>
                <p className="text-xs text-gray-400 -mt-1">
                  Escribe el número, "X" o texto descriptivo (ej. "HX").
                  Deja en blanco si no aplica.
                </p>

                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                  {PROCEDIMIENTOS.map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-gray-400
                                        uppercase tracking-wide leading-tight">
                        {label}
                      </label>
                      <input
                        type="text"
                        className={inputProcCls}
                        placeholder="—"
                        value={form[key]}
                        onChange={(e) => setField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>

            </div>
            {/* Fin formulario scrollable */}

            {/* Botones — fijos en la parte inferior */}
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex flex-col gap-2">
              <button
                onClick={guardar}
                disabled={!form.nombre.trim()}
                className="flex items-center justify-center gap-2 w-full rounded-2xl
                           bg-rose-600 py-3.5 text-sm font-semibold text-white shadow-sm
                           hover:bg-rose-700 active:scale-95 transition-all
                           disabled:opacity-40 disabled:pointer-events-none"
              >
                <ClipboardList className="h-4 w-4" />
                Guardar Registro
              </button>
              <button
                onClick={cerrarModal}
                className="flex items-center justify-center gap-2 w-full rounded-2xl
                           border-2 border-gray-200 bg-white py-3 text-sm font-semibold
                           text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Tarjeta de configuración de exportación ─────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
        <div className="h-36 bg-linear-to-t from-gray-100 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 pointer-events-auto px-4 pb-4 flex flex-col gap-2">

          {/* Inputs de periodo, egresos y servicio */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100
                          px-4 py-3 flex flex-col gap-2.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Configurar exportación
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Periodo
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Ej. 16 MAR AL 15 ABR 2026"
                  value={periodoExportacion}
                  onChange={(e) => setPeriodoExportacion(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Egresos del mes
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder="Ej. 134"
                  value={egresosMes}
                  onChange={(e) => setEgresosMes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Servicio
              </label>
              <select
                className={selectCls}
                value={servicioDatamart}
                onChange={(e) => setServicioDatamart(e.target.value)}
              >
                {['GINECOLOGÍA', 'MEDICINA INTERNA', 'PEDIATRÍA', 'CIRUGÍA'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón exportar */}
          <button
            onClick={async () => {
              await exportarExcelDatamart({
                registros: registrosDatamart,
                periodo:   periodoExportacion,
                egresos:   Number(egresosMes) || 0,
                servicio:  servicioDatamart,
              });
            }}
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl
                       bg-rose-600 py-3.5 shadow-lg text-white text-sm font-semibold
                       hover:bg-rose-700 active:scale-95 transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <FileSpreadsheet className="h-5 w-5" strokeWidth={1.8} />
            Generar Excel DataMart
          </button>

        </div>
      </div>

    </div>
  );
}
