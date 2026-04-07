import { useState } from 'react'
import {
  ClipboardList, Users, Building2, CalendarDays, Settings,
  Stethoscope, ClipboardCheck, Bed, Activity, Shirt,
  SlidersHorizontal, X, Eye, EyeOff,
} from 'lucide-react'
import { useStore } from '../store/useStore'

// 1. Agregamos un 'id' a cada objeto para saber a qué pantalla navegar
const menuItems = [
  {
    id: 'tomar-lista',
    title: 'Tomar Lista',
    description: 'Iniciar el recorrido',
    icon: ClipboardList,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'planeador',
    title: 'Planeador Mensual',
    description: 'Rol de actividades — 8 semanas',
    icon: CalendarDays,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    id: 'rol-semanal',
    title: 'Rol Semanal (Cirugía)',
    description: 'Asignación diaria Dom–Sáb',
    icon: Stethoscope,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    id: 'evaluaciones',
    title: 'Evaluaciones (Enlace)',
    description: 'Cédula de enlace de turno',
    icon: ClipboardCheck,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 'censo-madrugada',
    title: 'Censo de Pacientes',
    description: 'Control de camas — madrugada',
    icon: Bed,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    id: 'datamart',
    title: 'DataMart (Procedimientos)',
    description: 'Bitácora de procedimientos del turno',
    icon: Activity,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    id: 'informe-ropa',
    title: 'Informe de Ropa',
    description: 'Control diario de ropería',
    icon: Shirt,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    id: 'empleados',
    title: 'Empleados',
    description: 'Gestionar el personal',
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 'areas',
    title: 'Áreas',
    description: 'Gestionar las zonas del hospital',
    icon: Building2,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    description: 'Elaboró, autorizó e indicador',
    icon: Settings,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
]

// 2. Recibimos la función onNavigate como propiedad
export default function MainMenu({ onNavigate }) {
  const menuOcultos      = useStore((s) => s.menuOcultos)
  const toggleMenuOculto = useStore((s) => s.toggleMenuOculto)

  const [modalConfigOpen, setModalConfigOpen] = useState(false)

  // Ítems visibles (excluye los ocultos)
  const itemsVisibles = menuItems.filter((item) => !menuOcultos.includes(item.id))

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      {/* Header */}
      <header className="mb-8 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 leading-tight">
              Sistema de Reportes
            </h1>
            <h2 className="text-lg font-semibold text-gray-500">Tococirugía</h2>
          </div>
          <button
            onClick={() => setModalConfigOpen(true)}
            className="flex items-center justify-center rounded-xl bg-white p-3
                       shadow-sm border border-gray-200 active:bg-gray-50
                       transition-colors"
            aria-label="Personalizar menú"
          >
            <SlidersHorizontal className="h-5 w-5 text-gray-500" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        {itemsVisibles.map(({ id, title, description, icon: Icon, color, bg }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="flex items-center gap-4 w-full rounded-2xl bg-white p-5 shadow-sm
                       transition-transform duration-150 active:scale-95 active:shadow-inner
                       focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {/* Icon container */}
            <div className={`flex shrink-0 items-center justify-center rounded-xl ${bg} p-4`}>
              <Icon className={`${color} h-8 w-8`} strokeWidth={1.8} />
            </div>

            {/* Text */}
            <div className="text-left">
              <span className="block text-lg font-semibold text-gray-800">
                {title}
              </span>
              <span className="block text-sm text-gray-400">
                {description}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Modal: Personalizar Menú ─────────────────────────────────────── */}
      {modalConfigOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
                        flex flex-col justify-end sm:items-center sm:justify-center">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl
                          flex flex-col max-h-[85dvh] shadow-2xl overflow-hidden
                          animate-slide-up">

            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4
                            border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-gray-100 p-2.5">
                  <SlidersHorizontal className="h-5 w-5 text-gray-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 leading-tight">
                    Personalizar Menú
                  </h2>
                  <p className="text-xs text-gray-400">
                    Oculta las secciones que no uses
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalConfigOpen(false)}
                className="rounded-xl p-2 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Lista de ítems */}
            <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1">
              {menuItems.map(({ id, title, icon: Icon, color, bg }) => {
                const oculto = menuOcultos.includes(id)
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors
                                ${oculto ? 'opacity-50' : ''}`}
                  >
                    {/* Ícono de la sección */}
                    <div className={`flex shrink-0 items-center justify-center rounded-xl
                                    ${oculto ? 'bg-gray-100' : bg} p-2.5`}>
                      <Icon className={`h-5 w-5 ${oculto ? 'text-gray-400' : color}`}
                            strokeWidth={1.8} />
                    </div>

                    {/* Nombre */}
                    <span className={`flex-1 text-sm font-semibold
                                     ${oculto ? 'text-gray-400' : 'text-gray-800'}`}>
                      {title}
                    </span>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleMenuOculto(id)}
                      className={`flex items-center justify-center rounded-xl p-2.5
                                  transition-colors
                                  ${oculto
                                    ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                  }`}
                      aria-label={oculto ? `Mostrar ${title}` : `Ocultar ${title}`}
                    >
                      {oculto
                        ? <EyeOff className="h-4.5 w-4.5" strokeWidth={2} />
                        : <Eye    className="h-4.5 w-4.5" strokeWidth={2} />
                      }
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Pie del modal */}
            <div className="shrink-0 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setModalConfigOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-2xl
                           bg-gray-800 py-3.5 text-sm font-semibold text-white shadow-sm
                           hover:bg-gray-900 active:scale-95 transition-all"
              >
                Listo
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}