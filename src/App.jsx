import { useState } from 'react'
import MainMenu from './components/MainMenu'
import TomaDeLista from './views/TomaDeLista'
import Empleados from './views/Empleados'
import Areas from './views/Areas'
import PlaneadorMensual from './views/PlaneadorMensual'
import RolSemanal from './views/RolSemanal'
import Configuracion from './views/Configuracion'
import Evaluaciones from './views/Evaluaciones'
import CensoMadrugada from './views/CensoMadrugada'
import DataMart from './views/DataMart'

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

      {/* Si la vista es 'planeador', mostramos el planeador mensual */}
      {vistaActual === 'planeador' && (
        <PlaneadorMensual onBack={() => setVistaActual('menu')} />
      )}

      {/* Si la vista es 'rol-semanal', mostramos el rol semanal de cirugía */}
      {vistaActual === 'rol-semanal' && (
        <RolSemanal onBack={() => setVistaActual('menu')} />
      )}

      {/* Si la vista es 'configuracion', mostramos los ajustes del formato */}
      {vistaActual === 'configuracion' && (
        <Configuracion onBack={() => setVistaActual('menu')} />
      )}

      {/* Si la vista es 'evaluaciones', mostramos la cédula de enlace de turno */}
      {vistaActual === 'evaluaciones' && (
        <Evaluaciones onBack={() => setVistaActual('menu')} />
      )}

      {/* Si la vista es 'censo-madrugada', mostramos el censo de camas */}
      {vistaActual === 'censo-madrugada' && (
        <CensoMadrugada onBack={() => setVistaActual('menu')} />
      )}

      {/* Si la vista es 'datamart', mostramos la bitácora de procedimientos */}
      {vistaActual === 'datamart' && (
        <DataMart onBack={() => setVistaActual('menu')} />
      )}
    </div>
  )
}