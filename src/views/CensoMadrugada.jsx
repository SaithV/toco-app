import { useState, useCallback } from 'react';
import {
  ChevronLeft, Bed, X, Trash2, Save,
  UserRound, Syringe, ShieldAlert, FlaskConical, StickyNote,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportarCensoMadrugada } from '../utils/exportarMadrugada';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

// Camas de Ginecología: G01–G28
const CAMAS_GINE = Array.from({ length: 28 }, (_, i) =>
  `G${String(i + 1).padStart(2, '0')}`
);

// Camas de tránsito (sin cama asignada)
const CAMAS_TRANSITO = ['SIN CAMA 1', 'SIN CAMA 2'];

// Especialidades para camas prestadas
const ESPECIALIDADES = ['GINE', 'MI', 'T Y O', 'CIR', 'ONCOPEDIA', 'PEDIATRÍA'];

// Camas de Pediatría: L01–L10
const CAMAS_PED = Array.from({ length: 10 }, (_, i) =>
  `L${String(i + 1).padStart(2, '0')}`
);

// Dx rápidos para concatenar al textarea
const DIAGNOSTICOS_RAPIDOS = [
  'PQ',
  'P. FISIOLÓGICO',
  '+ OTB',
  '+ DIU',
  '+ RN HOMBRE',
  '+ RN MUJER',
];

// Objeto vacío base para una cama nueva (evita undefined en campos anidados)
const CAMA_VACIA = () => ({
  especialidad:     'GINE',
  ingreso:          { fecha: '', hora: '' },
  paciente:         { nombre: '', nss: '', genero: 'F', edad: '' },
  dxMedico:         '',
  egreso:           { fecha: '', hora: '' },
  causaNoOcupacion: '',
  invasivos: {
    cvc:   { tipo: '', fecha: '' },
    sonda: { tipo: '', fecha: '' },
  },
  riesgos:    { caidas: '', upp: '', aislamiento: '' },
  tratamiento: {
    higiene: '', soluciones: '', hemoderivados: '',
    laboratorios: '', gabinete: '',
  },
  traslado:     '',
  observaciones: '',
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: merge profundo de un nivel para el formulario
// ─────────────────────────────────────────────────────────────────────────────
function mergeForm(base, override) {
  const resultado = { ...base };
  Object.entries(override ?? {}).forEach(([k, v]) => {
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      typeof base[k] === 'object' &&
      base[k] !== null
    ) {
      resultado[k] = { ...base[k], ...v };
    } else {
      resultado[k] = v;
    }
  });
  return resultado;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: botón de cama en la cuadrícula
// ─────────────────────────────────────────────────────────────────────────────
function TarjetaCama({ idCama, datos, onClick }) {
  const ocupada = !!(datos?.paciente?.nombre);
  const nombreCorto = ocupada
    ? datos.paciente.nombre.split(' ').slice(0, 2).join(' ')
    : null;
  const dx = datos?.dxMedico?.trim()
    ? datos.dxMedico.split(' ').slice(0, 3).join(' ')
    : null;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-2xl
                  px-2 py-3 gap-1 transition-all active:scale-95 focus:outline-none
                  border-2 min-h-20
                  ${ocupada
                    ? 'bg-blue-50 border-blue-200 hover:border-blue-400'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
    >
      <span className={`text-xs font-bold tracking-wide
                        ${ocupada ? 'text-blue-700' : 'text-gray-400'}`}>
        {idCama}
      </span>
      {ocupada ? (
        <>
          <span className="text-xs font-semibold text-blue-800
                           leading-tight truncate w-full px-1 text-center">
            {nombreCorto}
          </span>
          {dx && (
            <span className="text-[10px] text-blue-500 leading-tight truncate
                             w-full px-1 text-center">
              {dx}
            </span>
          )}
        </>
      ) : (
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
          Vacía
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: campo de formulario reutilizable
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

const inputCls = `rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                  text-gray-800 placeholder-gray-400 focus:outline-none
                  focus:ring-2 focus:ring-blue-400 transition-colors w-full`;

const selectCls = `rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                   text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400
                   transition-colors w-full`;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function CensoMadrugada({ onBack }) {
  const censoMadrugada = useStore((s) => s.censoMadrugada);
  const actualizarCama = useStore((s) => s.actualizarCama);
  const limpiarCama    = useStore((s) => s.limpiarCama);

  const [filtroArea, setFiltroArea]   = useState('GINE');
  const [camaActiva, setCamaActiva]   = useState(null);
  const [form, setForm]               = useState(null);

  const camas = filtroArea === 'GINE' ? CAMAS_GINE : CAMAS_PED;

  // ── Abrir modal ─────────────────────────────────────────────────────────
  const abrirCama = useCallback((idCama) => {
    const base    = CAMA_VACIA();
    const existente = censoMadrugada[idCama];
    setForm(mergeForm(base, existente));
    setCamaActiva(idCama);
  }, [censoMadrugada]);

  // ── Cerrar modal ────────────────────────────────────────────────────────
  const cerrarModal = () => {
    setCamaActiva(null);
    setForm(null);
  };

  // ── Setters de campos anidados ───────────────────────────────────────────
  const setField = (campo, valor) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const setNested = (grupo, campo, valor) =>
    setForm((prev) => ({
      ...prev,
      [grupo]: { ...prev[grupo], [campo]: valor },
    }));

  const setDeepNested = (grupo, subgrupo, campo, valor) =>
    setForm((prev) => ({
      ...prev,
      [grupo]: {
        ...prev[grupo],
        [subgrupo]: { ...prev[grupo][subgrupo], [campo]: valor },
      },
    }));

  // ── Concatenar diagnóstico rápido ────────────────────────────────────────
  const agregarDxRapido = (texto) =>
    setForm((prev) => ({
      ...prev,
      dxMedico: prev.dxMedico
        ? prev.dxMedico.trimEnd() + ' ' + texto
        : texto,
    }));

  // ── Guardar ─────────────────────────────────────────────────────────────
  const guardar = () => {
    actualizarCama(camaActiva, { ...form, idCama: camaActiva });
    cerrarModal();
  };

  // ── Dar de alta ─────────────────────────────────────────────────────────
  const darDeAlta = () => {
    const nombre = form?.paciente?.nombre || camaActiva;
    if (!window.confirm(`¿Confirmas dar de alta y limpiar la cama ${camaActiva}?\n\nPaciente: ${nombre}`)) return;
    limpiarCama(camaActiva);
    cerrarModal();
  };

  // ── Ocupación rápida ────────────────────────────────────────────────────
  const totalOcupadas = Object.keys(censoMadrugada).filter(
    (id) => censoMadrugada[id]?.paciente?.nombre
  ).length;

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200 px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
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
            <div className="flex items-center justify-center rounded-xl bg-indigo-50 p-2">
              <Bed className="h-5 w-5 text-indigo-600" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">
                Censo de Pacientes
              </h1>
              <p className="text-xs text-gray-400">
                {totalOcupadas} cama{totalOcupadas !== 1 ? 's' : ''} ocupada{totalOcupadas !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs de área */}
        <div className="flex gap-2">
          {[
            { key: 'GINE', label: 'Ginecología', count: CAMAS_GINE.length },
            { key: 'PED',  label: 'Pediatría',   count: CAMAS_PED.length  },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFiltroArea(key)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all
                          ${filtroArea === key
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
            >
              {label}
              <span className={`ml-1.5 text-xs font-normal
                               ${filtroArea === key ? 'text-indigo-200' : 'text-gray-400'}`}>
                ({count})
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Cuadrícula de camas ──────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-4 pb-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {camas.map((idCama) => (
            <TarjetaCama
              key={idCama}
              idCama={idCama}
              datos={censoMadrugada[idCama]}
              onClick={() => abrirCama(idCama)}
            />
          ))}
          {/* Camas de tránsito — solo en vista GINE */}
          {filtroArea === 'GINE' && CAMAS_TRANSITO.map((idCama) => (
            <TarjetaCama
              key={idCama}
              idCama={idCama}
              datos={censoMadrugada[idCama]}
              onClick={() => abrirCama(idCama)}
            />
          ))}
        </div>
      </main>

      {/* ── Modal: Panel de edición de cama ──────────────────────────────── */}
      {camaActiva !== null && form !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
                        flex flex-col justify-end sm:items-center sm:justify-center">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl
                          flex flex-col max-h-[92dvh] shadow-2xl overflow-hidden">

            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4
                            border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-indigo-100 p-2.5">
                  <Bed className="h-5 w-5 text-indigo-600" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Cama
                  </p>
                  <h2 className="text-xl font-bold text-gray-800 leading-tight">
                    {camaActiva}
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

              {/* ── Sección: Datos del paciente ─────────────────────────── */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-indigo-500" strokeWidth={2} />
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Datos del Paciente
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Fecha ingreso">
                    <input type="date" className={inputCls}
                      value={form.ingreso.fecha}
                      onChange={(e) => setNested('ingreso', 'fecha', e.target.value)} />
                  </Campo>
                  <Campo label="Hora ingreso">
                    <input type="time" className={inputCls}
                      value={form.ingreso.hora}
                      onChange={(e) => setNested('ingreso', 'hora', e.target.value)} />
                  </Campo>
                </div>

                <Campo label="Nombre completo">
                  <input type="text" className={inputCls}
                    placeholder="Apellido Apellido, Nombre"
                    value={form.paciente.nombre}
                    onChange={(e) => setNested('paciente', 'nombre', e.target.value)} />
                </Campo>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="NSS">
                    <input type="text" className={inputCls}
                      placeholder="NSS"
                      value={form.paciente.nss}
                      onChange={(e) => setNested('paciente', 'nss', e.target.value)} />
                  </Campo>
                  <Campo label="Edad">
                    <input type="number" className={inputCls}
                      placeholder="Años"
                      min={0} max={120}
                      value={form.paciente.edad}
                      onChange={(e) => setNested('paciente', 'edad', e.target.value)} />
                  </Campo>
                </div>

                <Campo label="Género">
                  <select className={selectCls}
                    value={form.paciente.genero}
                    onChange={(e) => setNested('paciente', 'genero', e.target.value)}>
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </Campo>

                <Campo label="Especialidad a cargo">
                  <select className={selectCls}
                    value={form.especialidad}
                    onChange={(e) => setField('especialidad', e.target.value)}>
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </Campo>
              </section>

              {/* ── Sección: Diagnóstico ─────────────────────────────────── */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-violet-500" strokeWidth={2} />
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                    Diagnóstico Médico
                  </p>
                </div>

                <textarea
                  rows={3}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5
                             text-sm text-gray-800 placeholder-gray-400 resize-none
                             focus:outline-none focus:ring-2 focus:ring-violet-400
                             transition-colors w-full"
                  placeholder="Escribir diagnóstico..."
                  value={form.dxMedico}
                  onChange={(e) => setField('dxMedico', e.target.value)}
                />

                {/* Botones rápidos de diagnóstico */}
                <div className="flex flex-wrap gap-1.5">
                  {DIAGNOSTICOS_RAPIDOS.map((dx) => (
                    <button
                      key={dx}
                      onClick={() => agregarDxRapido(dx)}
                      className="rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-1
                                 text-xs font-semibold text-violet-700
                                 hover:bg-violet-100 active:scale-95 transition-all"
                    >
                      + {dx}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Sección: Invasivos ──────────────────────────────────── */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-rose-500" strokeWidth={2} />
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-600">
                    Invasivos
                  </p>
                </div>

                {/* CVC */}
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-rose-700">
                    CVC — Catéter Venoso Central
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Campo label="Tipo (ej. CPIZQ)">
                      <input type="text" className={inputCls}
                        placeholder="CPIZQ / CPDER / YUCO..."
                        value={form.invasivos.cvc.tipo}
                        onChange={(e) => setDeepNested('invasivos', 'cvc', 'tipo', e.target.value)} />
                    </Campo>
                    <Campo label="Fecha instalación">
                      <input type="date" className={inputCls}
                        value={form.invasivos.cvc.fecha}
                        onChange={(e) => setDeepNested('invasivos', 'cvc', 'fecha', e.target.value)} />
                    </Campo>
                  </div>
                </div>

                {/* Sonda */}
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-rose-700">
                    Sonda Vesical
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Campo label="Tipo (ej. CU)">
                      <input type="text" className={inputCls}
                        placeholder="CU / CUS..."
                        value={form.invasivos.sonda.tipo}
                        onChange={(e) => setDeepNested('invasivos', 'sonda', 'tipo', e.target.value)} />
                    </Campo>
                    <Campo label="Fecha instalación">
                      <input type="date" className={inputCls}
                        value={form.invasivos.sonda.fecha}
                        onChange={(e) => setDeepNested('invasivos', 'sonda', 'fecha', e.target.value)} />
                    </Campo>
                  </div>
                </div>
              </section>

              {/* ── Sección: Riesgos ────────────────────────────────────── */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" strokeWidth={2} />
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                    Riesgos
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Campo label="Caídas">
                    <select className={selectCls}
                      value={form.riesgos.caidas}
                      onChange={(e) => setNested('riesgos', 'caidas', e.target.value)}>
                      <option value="">—</option>
                      <option value="ALTO">Alto</option>
                      <option value="MEDIO">Medio</option>
                      <option value="BAJO">Bajo</option>
                    </select>
                  </Campo>
                  <Campo label="UPP">
                    <select className={selectCls}
                      value={form.riesgos.upp}
                      onChange={(e) => setNested('riesgos', 'upp', e.target.value)}>
                      <option value="">—</option>
                      <option value="ALTO">Alto</option>
                      <option value="MEDIO">Medio</option>
                      <option value="BAJO">Bajo</option>
                    </select>
                  </Campo>
                  <Campo label="Aislamiento">
                    <select className={selectCls}
                      value={form.riesgos.aislamiento}
                      onChange={(e) => setNested('riesgos', 'aislamiento', e.target.value)}>
                      <option value="">—</option>
                      <option value="E">Estándar</option>
                      <option value="C">Contacto</option>
                      <option value="G">Gota</option>
                    </select>
                  </Campo>
                </div>
              </section>

              {/* ── Sección: Tratamiento y Observaciones ────────────────── */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-teal-500" strokeWidth={2} />
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-600">
                    Tratamiento y Observaciones
                  </p>
                </div>

                <Campo label="Soluciones IV">
                  <textarea rows={2}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5
                               text-sm text-gray-800 placeholder-gray-400 resize-none
                               focus:outline-none focus:ring-2 focus:ring-teal-400 w-full"
                    placeholder="SSF 0.9% 1000 ml + oxitocina..."
                    value={form.tratamiento.soluciones}
                    onChange={(e) => setNested('tratamiento', 'soluciones', e.target.value)} />
                </Campo>

                <Campo label="Observaciones">
                  <textarea rows={3}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5
                               text-sm text-gray-800 placeholder-gray-400 resize-none
                               focus:outline-none focus:ring-2 focus:ring-teal-400 w-full"
                    placeholder="Notas importantes del turno..."
                    value={form.observaciones}
                    onChange={(e) => setField('observaciones', e.target.value)} />
                </Campo>
              </section>

            </div>
            {/* Fin formulario scrollable */}

            {/* Botones de acción — fijos en la parte inferior */}
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex flex-col gap-2">
              {/* Guardar */}
              <button
                onClick={guardar}
                className="flex items-center justify-center gap-2 w-full rounded-2xl
                           bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm
                           hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Save className="h-4 w-4" />
                Guardar Paciente
              </button>

              <div className="flex gap-2">
                {/* Dar de alta */}
                <button
                  onClick={darDeAlta}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl
                             border-2 border-red-200 bg-red-50 py-3 text-sm font-semibold
                             text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  Dar de Alta
                </button>

                {/* Cancelar */}
                <button
                  onClick={cerrarModal}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl
                             border-2 border-gray-200 bg-white py-3 text-sm font-semibold
                             text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Barra flotante inferior ──────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
        <div className="h-28 bg-linear-to-t from-gray-100 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 flex justify-center pb-6 pointer-events-auto">
          <button
            onClick={async () => { await exportarCensoMadrugada(censoMadrugada); }}
            className="flex items-center gap-2.5 rounded-2xl bg-indigo-600 px-6 py-3.5 shadow-lg
                       text-white text-sm font-semibold
                       hover:bg-indigo-700 active:scale-95 transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <FileSpreadsheet className="h-5 w-5" strokeWidth={1.8} />
            Generar Censo Excel
          </button>
        </div>
      </div>

    </div>
  );
}
