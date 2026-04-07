import { useState } from 'react';
import { useStore, AREAS_DEFAULT_IDS } from '../store/useStore';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Building2,
  MapPin,
} from 'lucide-react';

const areaVacia = { nombre: '', subAreas: [] };

export default function Areas({ onBack }) {
  const { areas, empleados, agregarArea, editarArea, eliminarArea } = useStore();

  // ── Estado del modal ──
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ nombre: '', subAreasTexto: '' });

  // ── Helpers ──
  const contarEmpleados = (areaId) =>
    empleados.filter((e) => e.areaId === areaId).length;

  const esDefault = (id) => AREAS_DEFAULT_IDS.includes(id);

  // ── Abrir modal: nuevo ──
  const handleNueva = () => {
    setEditandoId(null);
    setForm({ nombre: '', subAreasTexto: '' });
    setModalAbierto(true);
  };

  // ── Abrir modal: editar ──
  const handleEditar = (area) => {
    setEditandoId(area.id);
    setForm({
      nombre: area.nombre,
      subAreasTexto: (area.subAreas ?? []).join(', '),
    });
    setModalAbierto(true);
  };

  // ── Guardar ──
  const handleGuardar = () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      alert('El nombre del área es obligatorio.');
      return;
    }

    // Parsear sub-áreas desde texto separado por comas
    const subAreas = form.subAreasTexto
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editandoId) {
      editarArea(editandoId, { nombre, subAreas });
    } else {
      agregarArea({ nombre, subAreas });
    }
    setModalAbierto(false);
  };

  // ── Eliminar con confirmación ──
  const handleEliminar = (area) => {
    const cantidad = contarEmpleados(area.id);
    const advertencia = cantidad > 0
      ? `\n\n⚠️ Hay ${cantidad} empleado(s) asignados a esta área. Se les desvinculará automáticamente.`
      : '';

    if (
      window.confirm(
        `¿Eliminar el área "${area.nombre}"?${advertencia}\n\nEsta acción no se puede deshacer.`
      )
    ) {
      eliminarArea(area.id);
    }
  };

  // ══════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════
  return (
    <div className="max-w-md mx-auto pb-24">
      {/* ── Encabezado sticky ── */}
      <div className="sticky top-0 z-30 bg-gray-100 px-4 pt-4 pb-4 border-b border-gray-200 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200
                       active:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
            <span className="text-sm font-semibold text-gray-600">Regresar</span>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Áreas</h2>
          <span className="ml-auto text-sm text-gray-400 font-medium">
            {areas.length}
          </span>
        </div>
      </div>

      {/* ── Botón + Nueva Área ── */}
      <div className="px-1 mb-4">
        <button
          onClick={handleNueva}
          className="flex items-center justify-center gap-2 w-full bg-violet-600 text-white
                     font-bold py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          <Plus size={20} strokeWidth={2.5} />
          Nueva Área
        </button>
      </div>

      {/* ── Lista de áreas ── */}
      {areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Building2 size={48} strokeWidth={1.2} />
          <p className="mt-3 text-sm font-medium">No hay áreas registradas</p>
        </div>
      ) : (
        <div className="space-y-2 px-1">
          {areas.map((area) => {
            const cantidad = contarEmpleados(area.id);
            const porDefecto = esDefault(area.id);

            return (
              <div
                key={area.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Ícono */}
                  <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-violet-50 text-violet-600">
                    <Building2 size={20} strokeWidth={1.8} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 truncate">
                        {area.nombre}
                      </p>
                      {porDefecto && (
                        <span className="shrink-0 text-[10px] font-medium text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">
                          Base
                        </span>
                      )}
                    </div>

                    {/* Contador de empleados */}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cantidad} empleado{cantidad !== 1 ? 's' : ''}
                    </p>

                    {/* Sub-áreas */}
                    {area.subAreas && area.subAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {area.subAreas.map((sub) => (
                          <span
                            key={sub}
                            className="inline-flex items-center gap-1 bg-gray-100 text-gray-600
                                       text-[11px] font-medium px-2 py-0.5 rounded-full"
                          >
                            <MapPin size={10} className="text-gray-400" />
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleEditar(area)}
                      className="p-2 rounded-full bg-gray-50 active:scale-90 transition-transform"
                    >
                      <Pencil size={16} className="text-gray-500" />
                    </button>
                    {!porDefecto && (
                      <button
                        onClick={() => handleEliminar(area)}
                        className="p-2 rounded-full bg-red-50 active:scale-90 transition-transform"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
           MODAL — Crear / Editar área
         ══════════════════════════════════════ */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">
                {editandoId ? 'Editar Área' : 'Nueva Área'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-2 rounded-full bg-gray-100 active:scale-90 transition-transform"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Campos */}
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombre del Área *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Urgencias"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              {/* Sub-Áreas */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Sub-Áreas
                </label>
                <textarea
                  value={form.subAreasTexto}
                  onChange={(e) =>
                    setForm({ ...form, subAreasTexto: e.target.value })
                  }
                  rows={3}
                  placeholder="Separadas por comas, ej: Labor, Recuperación, Expulsión"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-violet-400 resize-y"
                />
                {/* Preview de chips */}
                {form.subAreasTexto.trim() && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.subAreasTexto
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((sub, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 bg-violet-50 text-violet-700
                                     text-[11px] font-medium px-2 py-0.5 rounded-full"
                        >
                          <MapPin size={10} />
                          {sub}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botón guardar */}
            <button
              onClick={handleGuardar}
              className="mt-6 w-full bg-violet-600 text-white font-bold py-3.5 rounded-2xl
                         active:scale-95 transition-transform shadow-md"
            >
              {editandoId ? 'Guardar Cambios' : 'Crear Área'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
