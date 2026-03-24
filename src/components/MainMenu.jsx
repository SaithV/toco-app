import { ClipboardList, Users, Building2, CalendarDays, Settings, Stethoscope, ClipboardCheck, Bed, Activity } from 'lucide-react'

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
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 leading-tight">
          Sistema de Reportes
        </h1>
        <h2 className="text-lg font-semibold text-gray-500">Tococirugía</h2>
      </header>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        {menuItems.map(({ id, title, description, icon: Icon, color, bg }) => (
          <button
            key={title}
            onClick={() => onNavigate(id)} // 3. ¡Aquí conectamos el botón!
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
    </div>
  )
}