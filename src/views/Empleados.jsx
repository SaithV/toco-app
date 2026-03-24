import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  ArrowLeft,
  Upload,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

// ── Días de la semana (0 = Domingo … 6 = Sábado) ──
const DIAS = [
  { valor: 1, label: 'Lun' },
  { valor: 2, label: 'Mar' },
  { valor: 3, label: 'Mié' },
  { valor: 4, label: 'Jue' },
  { valor: 5, label: 'Vie' },
  { valor: 6, label: 'Sáb' },
  { valor: 0, label: 'Dom' },
];

const empleadoVacio = {
  nombre: '',
  categoria: '',
  matricula: '',
  plaza: '',
  areaId: '',
  subArea: '',
  diasDescanso: [],
  esSuplente: false,
};

export default function Empleados({ onBack }) {
  const {
    empleados,
    areas,
    importarEmpleados,
    agregarEmpleado,
    editarEmpleado,
    eliminarEmpleado,
  } = useStore();

  // ── Estado del panel de importar ──
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [jsonTexto, setJsonTexto] = useState('');

  // ── Estado del modal de formulario ──
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = crear, id = editar
  const [form, setForm] = useState({ ...empleadoVacio });

  // ── Validación: perfil incompleto ──
  const esPerfilIncompleto = (emp) =>
    !emp.categoria?.trim() ||
    !emp.matricula?.trim() ||
    !emp.diasDescanso?.length;

  // Retorna lista de etiquetas de campos faltantes en el form actual
  const camposIncompletos = () => {
    const faltantes = [];
    if (!form.categoria?.trim()) faltantes.push('categoria');
    if (!form.matricula?.trim()) faltantes.push('matricula');
    if (!form.diasDescanso?.length) faltantes.push('diasDescanso');
    return faltantes;
  };

  // ── Helpers ──
  const getNombreArea = (areaId) => {
    const area = areas.find((a) => a.id === areaId);
    return area ? area.nombre : areaId;
  };

  const getSubAreas = (areaId) => {
    const area = areas.find((a) => a.id === areaId);
    return area?.subAreas ?? [];
  };

  // ── Importar JSON ──
  const handleCargarJSON = () => {
    try {
      const parsed = JSON.parse(jsonTexto);
      if (!Array.isArray(parsed)) {
        alert('El JSON debe ser un arreglo [ … ]');
        return;
      }
      importarEmpleados(parsed);
      setJsonTexto('');
      setMostrarImportar(false);
      alert(`✅ Se importaron ${parsed.length} empleados correctamente.`);
    } catch {
      alert('❌ JSON inválido. Revisa el formato e intenta de nuevo.');
    }
  };

  // ── Abrir modal: nuevo ──
  const handleNuevo = () => {
    setEditandoId(null);
    setForm({ ...empleadoVacio });
    setModalAbierto(true);
  };

  // ── Abrir modal: editar ──
  const handleEditar = (emp) => {
    setEditandoId(emp.id);
    setForm({
      nombre:      emp.nombre      ?? '',
      categoria:   emp.categoria   ?? '',
      matricula:   emp.matricula   ?? '',
      plaza:       emp.plaza       ?? '',
      areaId:      emp.areaId      ?? '',
      subArea:     emp.subArea     ?? '',
      diasDescanso: emp.diasDescanso ?? [],
      esSuplente:  emp.esSuplente  ?? false,
    });
    setModalAbierto(true);
  };

  // ── Guardar (crear o editar) ──
  const handleGuardar = () => {
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }
    if (editandoId) {
      editarEmpleado(editandoId, { ...form });
    } else {
      agregarEmpleado({ ...form });
    }
    setModalAbierto(false);
  };

  // ── Eliminar con confirmación ──
  const handleEliminar = (emp) => {
    if (window.confirm(`¿Eliminar a "${emp.nombre}"? Esta acción no se puede deshacer.`)) {
      eliminarEmpleado(emp.id);
    }
  };

  // ── Toggle día de descanso ──
  const toggleDia = (dia) => {
    setForm((prev) => ({
      ...prev,
      diasDescanso: prev.diasDescanso.includes(dia)
        ? prev.diasDescanso.filter((d) => d !== dia)
        : [...prev.diasDescanso, dia],
    }));
  };

  // ── Cambiar campo genérico ──
  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // ── Nombres cortos de días para la tarjeta ──
  const diasLabel = (diasArr) => {
    if (!diasArr || diasArr.length === 0) return null;
    return diasArr
      .map((d) => DIAS.find((x) => x.valor === d)?.label)
      .filter(Boolean)
      .join(', ');
  };

  // ══════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════
  return (
    <div className="max-w-md mx-auto pb-24">
      {/* ── Encabezado sticky ── */}
      <div className="flex items-center mb-4 bg-white p-4 rounded-2xl shadow-sm sticky top-0 z-20">
        <button
          onClick={onBack}
          className="p-2 mr-3 bg-gray-100 rounded-full active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Empleados</h2>
        <span className="ml-auto text-sm text-gray-400 font-medium">
          {empleados.length}
        </span>
      </div>

      {/* ── Botón + Nuevo Empleado ── */}
      <div className="px-1 mb-3">
        {/* Contador de perfiles incompletos */}
        {(() => {
          const count = empleados.filter(esPerfilIncompleto).length;
          return count > 0 ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 font-medium">
                {count} perfil{count !== 1 ? 'es' : ''} incompleto{count !== 1 ? 's' : ''}
              </p>
            </div>
          ) : null;
        })()}
        <button
          onClick={handleNuevo}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white
                     font-bold py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          <Plus size={20} strokeWidth={2.5} />
          Nuevo Empleado
        </button>
      </div>

      {/* ── Importar Datos (Admin) — secundario ── */}
      <div className="px-1 mb-4">
        <button
          onClick={() => setMostrarImportar(!mostrarImportar)}
          className="flex items-center justify-between w-full rounded-xl px-4 py-2.5 text-left
                     text-sm text-gray-500 active:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Upload size={15} className="text-gray-400" />
            Importar Datos (Admin)
          </span>
          {mostrarImportar ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {mostrarImportar && (
          <div className="mt-2 bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-600">
              Pega aquí el arreglo JSON de empleados:
            </label>
            <textarea
              value={jsonTexto}
              onChange={(e) => setJsonTexto(e.target.value)}
              rows={5}
              placeholder='[{ "id":1, "nombre":"…", "areaId":"toco" }]'
              className="w-full rounded-xl border border-gray-200 p-3 text-sm font-mono
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
            />
            <button
              onClick={handleCargarJSON}
              disabled={!jsonTexto.trim()}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl
                         active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
            >
              Cargar JSON
            </button>
          </div>
        )}
      </div>

      {/* ── Lista de empleados ── */}
      {empleados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users size={48} strokeWidth={1.2} />
          <p className="mt-3 text-sm font-medium">No hay empleados cargados</p>
          <p className="text-xs">Presiona "+ Nuevo Empleado" para comenzar</p>
        </div>
      ) : (
        <div className="space-y-2 px-1">
          {empleados.map((emp) => (
            <div
              key={emp.id}
              className="relative flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm"
            >
              {/* Badge de perfil incompleto */}
              {esPerfilIncompleto(emp) && (
                <span className="absolute top-3 right-14 inline-flex items-center gap-1
                                 bg-amber-100 text-amber-700 text-[10px] font-bold
                                 px-1.5 py-0.5 rounded-full border border-amber-300">
                  <AlertTriangle size={9} />
                  Faltan Datos
                </span>
              )}
              {/* Avatar */}
              <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm">
                {emp.nombre?.charAt(0).toUpperCase() ?? '?'}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate">{emp.nombre}</p>
                <p className="text-xs text-gray-400 truncate">
                  {getNombreArea(emp.areaId)}
                  {emp.subArea ? ` · ${emp.subArea}` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                  {emp.categoria && (
                    <span className="text-[11px] font-medium text-indigo-600">{emp.categoria}</span>
                  )}
                  {emp.matricula && (
                    <span className="text-[11px] text-gray-400 font-mono">Mat. {emp.matricula}</span>
                  )}
                  {emp.plaza && (
                    <span className="text-[11px] text-gray-400">Plaza: {emp.plaza}</span>
                  )}
                  {emp.esSuplente && (
                    <span className="inline-flex items-center text-[10px] font-bold
                                     text-rose-600 bg-rose-50 border border-rose-200
                                     px-1.5 py-0.5 rounded-full">
                      Suplente
                    </span>
                  )}
                </div>
                {diasLabel(emp.diasDescanso) && (
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    Desc: {diasLabel(emp.diasDescanso)}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => handleEditar(emp)}
                  className="p-2 rounded-full bg-gray-50 active:scale-90 transition-transform"
                >
                  <Pencil size={16} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleEliminar(emp)}
                  className="p-2 rounded-full bg-red-50 active:scale-90 transition-transform"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
           MODAL — Crear / Editar empleado
         ══════════════════════════════════════ */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">
                {editandoId ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-2 rounded-full bg-gray-100 active:scale-90 transition-transform"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Banner de campos faltantes dentro del modal */}
            {editandoId && camposIncompletos().length > 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-1">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium">
                  Faltan completar:{' '}
                  {camposIncompletos()
                    .map((c) =>
                      c === 'categoria' ? 'Categoría' :
                      c === 'matricula' ? 'Matrícula' :
                      'Días de Descanso'
                    )
                    .join(', ')}
                </p>
              </div>
            )}

            {/* Campos */}
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: María López Pérez"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Categoría y Matrícula en fila */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${!form.categoria?.trim() ? 'text-amber-600' : 'text-gray-600'}`}>
                    Categoría {!form.categoria?.trim() && <span className="text-amber-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    placeholder="Ej: EJP, EG"
                    className={`w-full rounded-xl border px-4 py-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-400
                               ${!form.categoria?.trim() ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${!form.matricula?.trim() ? 'text-amber-600' : 'text-gray-600'}`}>
                    Matrícula {!form.matricula?.trim() && <span className="text-amber-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={form.matricula}
                    onChange={(e) => handleChange('matricula', e.target.value)}
                    placeholder="123456"
                    className={`w-full rounded-xl border px-4 py-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-400
                               ${!form.matricula?.trim() ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                  />
                </div>
              </div>

              {/* Plaza */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  No. de Plaza
                </label>
                <input
                  type="text"
                  value={form.plaza}
                  onChange={(e) => handleChange('plaza', e.target.value)}
                  placeholder="Ej. 6110"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Número de 4 a 5 dígitos asignado por el IMSS. Déjalo en blanco si es suplente.
                </p>
              </div>

              {/* Tipo de Contrato (Base / Suplente) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Tipo de Contrato
                </label>
                <select
                  value={form.esSuplente ? 'suplente' : 'base'}
                  onChange={(e) =>
                    handleChange('esSuplente', e.target.value === 'suplente')
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-indigo-400
                               ${form.esSuplente
                                 ? 'border-rose-300 bg-rose-50 text-rose-800'
                                 : 'border-violet-300 bg-violet-50 text-violet-800'}`}
                >
                  <option value="base">👤 Personal de Base</option>
                  <option value="suplente">🔄 Suplente / Cubre Descansos</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {form.esSuplente
                    ? 'Se mostrará en el cuadro de Cubre Descansos del Planeador Mensual.'
                    : 'Se mostrará en el cuadro de Personal de Base del Planeador Mensual.'}
                </p>
              </div>

              {/* Área (select) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Área
                </label>
                <select
                  value={form.areaId}
                  onChange={(e) => {
                    handleChange('areaId', e.target.value);
                    handleChange('subArea', ''); // reset subárea al cambiar
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">— Seleccionar área —</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Área (si aplica) */}
              {getSubAreas(form.areaId).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Sub-Área
                  </label>
                  <select
                    value={form.subArea}
                    onChange={(e) => handleChange('subArea', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">— Seleccionar sub-área —</option>
                    {getSubAreas(form.areaId).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Días de Descanso */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${!form.diasDescanso?.length ? 'text-amber-600' : 'text-gray-600'}`}>
                  Días de Descanso {!form.diasDescanso?.length && <span className="text-amber-500">*</span>}
                </label>
                <div className={`flex gap-1.5 rounded-xl p-1 ${!form.diasDescanso?.length ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}>
                  {DIAS.map(({ valor, label }) => {
                    const activo = form.diasDescanso.includes(valor);
                    return (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => toggleDia(valor)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors
                          ${
                            activo
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <button
              onClick={handleGuardar}
              className="mt-6 w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl
                         active:scale-95 transition-transform shadow-md"
            >
              {editandoId ? 'Guardar Cambios' : 'Crear Empleado'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
