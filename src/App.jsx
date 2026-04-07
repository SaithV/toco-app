import { useState, useEffect, useCallback } from 'react'
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
import InformeRopa from './views/InformeRopa'

export default function App() {
  const [vistaActual, setVistaActual] = useState('menu')

  // ── Navegar hacia una vista (push a history) ──────────────────────────
  const handleNavigate = useCallback((nuevaVista) => {
    if (nuevaVista !== 'menu') {
      window.history.pushState({ vista: nuevaVista }, '', '?v=' + nuevaVista)
    }
    setVistaActual(nuevaVista)
  }, [])

  // ── Botón "Atrás" del navegador / celular ─────────────────────────────
  useEffect(() => {
    const onPopState = (e) => {
      setVistaActual(e.state?.vista ?? 'menu')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // ── Función onBack que usan las vistas ────────────────────────────────
  const handleBack = useCallback(() => {
    window.history.back()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {vistaActual === 'menu' && (
        <MainMenu onNavigate={handleNavigate} />
      )}
      
      {vistaActual === 'tomar-lista' && (
        <TomaDeLista onBack={handleBack} />
      )}

      {vistaActual === 'empleados' && (
        <Empleados onBack={handleBack} />
      )}

      {vistaActual === 'areas' && (
        <Areas onBack={handleBack} />
      )}

      {vistaActual === 'planeador' && (
        <PlaneadorMensual onBack={handleBack} />
      )}

      {vistaActual === 'rol-semanal' && (
        <RolSemanal onBack={handleBack} />
      )}

      {vistaActual === 'configuracion' && (
        <Configuracion onBack={handleBack} />
      )}

      {vistaActual === 'evaluaciones' && (
        <Evaluaciones onBack={handleBack} />
      )}

      {vistaActual === 'censo-madrugada' && (
        <CensoMadrugada onBack={handleBack} />
      )}

      {vistaActual === 'datamart' && (
        <DataMart onBack={handleBack} />
      )}

      {vistaActual === 'informe-ropa' && (
        <InformeRopa onBack={handleBack} />
      )}
    </div>
  )
}