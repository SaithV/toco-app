import { useState } from 'react'
import MainMenu from './components/MainMenu'
import TomaDeLista from './views/TomaDeLista'
import Empleados from './views/Empleados'
import Areas from './views/Areas'

export default function App() {
  // Aquí guardamos en qué pantalla estamos. Por defecto, en el 'menu'
  const [vistaActual, setVistaActual] = useState('menu')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Si la vista es 'menu', mostramos el MainMenu y le pasamos la función para cambiar de vista */}
      {vistaActual === 'menu' && (
        <MainMenu onNavigate={(vista) => setVistaActual(vista)} />
      )}
      
      {/* Si la vista es 'tomar-lista', mostramos la lista y le pasamos la función para regresar */}
      {vistaActual === 'tomar-lista' && (
        <TomaDeLista onBack={() => setVistaActual('menu')} />
      )}

      {/* Si la vista es 'empleados', mostramos la gestión de personal */}
      {vistaActual === 'empleados' && (
        <Empleados onBack={() => setVistaActual('menu')} />
      )}

      {/* Si la vista es 'areas', mostramos la gestión de áreas */}
      {vistaActual === 'areas' && (
        <Areas onBack={() => setVistaActual('menu')} />
      )}
    </div>
  )
}