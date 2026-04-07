import { ChevronLeft, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';

// ─── Campo de formulario reutilizable ────────────────────────────────────────
function Campo({ label, ayuda, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {ayuda && <p className="text-xs text-gray-400">{ayuda}</p>}
    </div>
  );
}

// ─── Vista principal ─────────────────────────────────────────────────────────
export default function Configuracion({ onBack }) {
  const configuracion    = useStore((s) => s.configuracion);
  const setConfiguracion = useStore((s) => s.setConfiguracion);

  const handleChange = (campo, valor) => {
    setConfiguracion({ [campo]: valor });
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
            <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2} />
            <span className="text-sm font-semibold text-gray-600">Regresar</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-xl bg-gray-200 p-2">
              <Settings className="h-5 w-5 text-gray-600" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">
                Configuración del Formato
              </h1>
              <p className="text-xs text-gray-400">Datos que se imprimen en el Excel IMSS</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {/* Tarjeta del formulario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-5">

          <Campo label="Nombre de quien elabora">
            <input
              type="text"
              value={configuracion.elaboro}
              onChange={(e) => handleChange('elaboro', e.target.value)}
              placeholder="Ej. LIC. MARÍA LÓPEZ HERNÁNDEZ"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         text-sm text-gray-800 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            />
          </Campo>

          <div className="h-px bg-gray-100" />

          <Campo label="Nombre de quien autoriza">
            <input
              type="text"
              value={configuracion.autorizo}
              onChange={(e) => handleChange('autorizo', e.target.value)}
              placeholder="Ej. DR. CARLOS MENDOZA RUIZ"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         text-sm text-gray-800 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            />
          </Campo>

          <div className="h-px bg-gray-100" />

          <Campo
            label="Indicador IMSS"
            ayuda="Valor estándar: 3.5"
          >
            <input
              type="text"
              value={configuracion.indicador}
              onChange={(e) => handleChange('indicador', e.target.value)}
              placeholder="3.5"
              className="w-32 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                         text-sm text-gray-800 placeholder-gray-400 font-semibold
                         focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            />
          </Campo>

        </div>

        {/* Nota informativa */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Los cambios se guardan automáticamente en el dispositivo.
        </p>

      </main>
    </div>
  );
}
