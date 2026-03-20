import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Estados válidos de asistencia
export const ESTADOS_ASISTENCIA = [
  'Pendiente',
  'Asistencia',
  'Falta',
  'txt',
  'T. Extra',
];

// Estructura por defecto para un registro de asistencia diaria
const asistenciaDefault = () => ({
  estado: 'Pendiente',
  pacientes: 0,
  cubreA: '',
  nota: '',
});

// IDs de áreas por defecto (no se pueden eliminar, solo editar)
export const AREAS_DEFAULT_IDS = [
  'admision', 'toco', 'ucia', 'ucin', 'gineco',
  'pediatria', 'prematuros', 'patologicos', 'rn',
];

export const useStore = create(
  persist(
    (set) => ({
      // ==========================================
      // 1. CATÁLOGOS BASE
      // ==========================================
      areas: [
        { id: 'admision', nombre: 'Admisión', subAreas: [] },
        { id: 'toco', nombre: 'Tococirugía', subAreas: ['Labor', 'Recuperación', 'Transición', 'Expulsión', 'Quirófano', 'Ceye'] },
        { id: 'ucia', nombre: 'UCIA', subAreas: [] },
        { id: 'ucin', nombre: 'UCIN', subAreas: [] },
        { id: 'gineco', nombre: 'Ginecología', subAreas: ['1ra Isla', '2da Isla', '3er Isla', 'Cendys'] },
        { id: 'pediatria', nombre: 'Pediatría', subAreas: [] },
        { id: 'prematuros', nombre: 'Prematuros', subAreas: [] },
        { id: 'patologicos', nombre: 'Patológicos', subAreas: [] },
        { id: 'rn', nombre: 'R/N (Recién Nacidos)', subAreas: [] },
      ],

      // Arreglo vacío — se llena con importarEmpleados o agregarEmpleado
     empleados: [
        { id: 101, nombre: "Sonia Escobar", areaId: "admision", subArea: "", categoria: "", plaza: "", matricula: "", extra: "T extra", diasDescanso: [] },
        { id: 102, nombre: "Erendida Angulo", areaId: "toco", subArea: "Labor", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 103, nombre: "Karla López", areaId: "toco", subArea: "Recuperación", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 104, nombre: "Daniela Zabala", areaId: "toco", subArea: "Transición", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 105, nombre: "Edelmira Osuna", areaId: "toco", subArea: "Expulsión", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 106, nombre: "Jemina Ayala", areaId: "toco", subArea: "Quirófano", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 107, nombre: "Mirla Giron", areaId: "toco", subArea: "Quirófano", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 108, nombre: "Lourdes Villa", areaId: "toco", subArea: "Ceye", categoria: "", plaza: "", matricula: "", extra: "pte", diasDescanso: [] },
        { id: 109, nombre: "Sandra Urias", areaId: "ucia", subArea: "", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 110, nombre: "Dagoberto Rodríguez", areaId: "ucia", subArea: "", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 111, nombre: "Eva Montoya", areaId: "ucin", subArea: "", categoria: "", plaza: "", matricula: "", extra: "TxT por kikey", diasDescanso: [] },
        { id: 112, nombre: "Rosalía Manjarrez", areaId: "ucin", subArea: "", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 113, nombre: "Julia Marín", areaId: "gineco", subArea: "1ra Isla", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 114, nombre: "Siria Robles", areaId: "gineco", subArea: "1ra Isla", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 115, nombre: "Eduardo Lizarraga", areaId: "gineco", subArea: "Cendys", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 116, nombre: "Ilse monzón", areaId: "pediatria", subArea: "", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] },
        { id: 117, nombre: "David", areaId: "patologicos", subArea: "", categoria: "", plaza: "", matricula: "", extra: "", diasDescanso: [] }
      ],

      // ==========================================
      // 2. ESTADO DIARIO (El reporte que se limpia cada turno)
      // ==========================================
      // Diccionario { [empleadoId]: { estado, pacientes, cubreA, nota } }
      asistenciaDiaria: {},

      // ==========================================
      // 3. ACCIONES — Empleados
      // ==========================================

      /** Reemplaza todo el catálogo de empleados con un arreglo JSON */
      importarEmpleados: (arregloJSON) => set({ empleados: arregloJSON }),

      /** Agrega un solo empleado (genera id con Date.now) */
      agregarEmpleado: (nuevoEmpleado) =>
        set((state) => ({
          empleados: [...state.empleados, { ...nuevoEmpleado, id: Date.now() }],
        })),

      /** Edita un empleado existente por id */
      editarEmpleado: (id, datosActualizados) =>
        set((state) => ({
          empleados: state.empleados.map((emp) =>
            emp.id === id ? { ...emp, ...datosActualizados } : emp
          ),
        })),

      /** Elimina un empleado por id */
      eliminarEmpleado: (id) =>
        set((state) => ({
          empleados: state.empleados.filter((emp) => emp.id !== id),
          // También limpiamos su registro de asistencia si existe
          asistenciaDiaria: (() => {
            const copia = { ...state.asistenciaDiaria };
            delete copia[id];
            return copia;
          })(),
        })),

      // ==========================================
      // 4. ACCIONES — Áreas
      // ==========================================

      /** Agrega una nueva área. Genera id a partir del nombre (slug). */
      agregarArea: (nuevaArea) =>
        set((state) => {
          const slug = nuevaArea.nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')   // quitar acentos
            .replace(/[^a-z0-9]+/g, '-')       // no-alfanuméricos → guión
            .replace(/^-|-$/g, '');             // trim guiones
          // Si el slug ya existe, le añadimos un timestamp
          const idFinal = state.areas.some((a) => a.id === slug)
            ? `${slug}-${Date.now()}`
            : slug;
          return {
            areas: [...state.areas, { ...nuevaArea, id: idFinal }],
          };
        }),

      /** Edita una área existente por id */
      editarArea: (id, datosActualizados) =>
        set((state) => ({
          areas: state.areas.map((a) =>
            a.id === id ? { ...a, ...datosActualizados } : a
          ),
        })),

      /** Elimina un área por id y desvincula empleados que la tenían */
      eliminarArea: (id) =>
        set((state) => ({
          areas: state.areas.filter((a) => a.id !== id),
          empleados: state.empleados.map((emp) =>
            emp.areaId === id ? { ...emp, areaId: '', subArea: '' } : emp
          ),
        })),

      // ==========================================
      // 5. ACCIONES — Asistencia diaria
      // ==========================================

      /**
       * Actualiza la asistencia de un empleado.
       * Si el empleado no tiene registro aún, lo crea con los valores por defecto
       * y luego aplica los datos recibidos.
       *
       * Ejemplo de uso:
       *   actualizarAsistencia(5, { estado: 'Asistencia', pacientes: 3 })
       *   actualizarAsistencia(5, { cubreA: 'Eva Montoya', nota: 'Cubre por incapacidad' })
       */
      actualizarAsistencia: (empleadoId, datos) =>
        set((state) => ({
          asistenciaDiaria: {
            ...state.asistenciaDiaria,
            [empleadoId]: {
              ...asistenciaDefault(),           // valores base
              ...state.asistenciaDiaria[empleadoId], // valores previos (si existen)
              ...datos,                          // nuevos valores
            },
          },
        })),

      /** Vacía por completo el reporte diario (deseleccionar todo) */
      limpiarReporteDiario: () => set({ asistenciaDiaria: {} }),
    }),
    {
      name: 'reportes-toco-storage-v2', // Nombre en el localStorage
    }
  )
);