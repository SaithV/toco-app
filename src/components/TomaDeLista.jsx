import { generarReporteRol } from '../utils/exportarExcel';

// Adentro de tu componente...
const handleDescargar = () => {
  // Simulando datos de Zustand
  const base = [{ categoria: 'EJP', nombre: 'Pérez López', matricula: '123', diasDescanso: 'S-D' }];
  const suplentes = [{ categoria: 'EG', nombre: 'Gómez Ruiz', matricula: '456' }];
  
  generarReporteRol(base, suplentes, "GINECOLOGIA Y OBSTETRICIA");
};

// En tu JSX
<button onClick={handleDescargar} className="bg-green-600 text-white p-2 rounded">
   Descargar Reporte IMSS
</button>