import { ClipboardList, Users, Building2 } from 'lucide-react'

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