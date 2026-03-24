import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Estados principales — se muestran como botones directos en el picker
export const ESTADOS_PRINCIPALES = ['Pendiente', 'Asistencia', 'Falta', 'txt', 'T. Extra'];

// Estados secundarios IMSS — se muestran bajo el botón "+ Más..."
export const ESTADOS_SECUNDARIOS = [
  'Vacaciones', 'Incapacidad', 'Licencia', 'Nivelacion',
  'Convenio', 'Cambio Adsc', 'Otro Servicio', 'Permuta',
  'Cambio Turno', 'Festivo', 'Comision',
];

// Todos los estados combinados (para validaciones)
export const TODOS_LOS_ESTADOS = [...ESTADOS_PRINCIPALES, ...ESTADOS_SECUNDARIOS];

// Alias de compatibilidad — mantiene imports existentes sin romper nada
export const ESTADOS_ASISTENCIA = TODOS_LOS_ESTADOS;

// Estructura por defecto para un registro de asistencia diaria
const asistenciaDefault = () => ({
  estado: 'Pendiente',
  pacientes: 0,
  cubreA: '',
  nota: '',
  // area y subArea se enriquecen al leer desde el store (via empleado)
});

/** Devuelve la fecha actual en formato YYYY-MM-DD usando la hora LOCAL del sistema */
export const getFechaHoy = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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
      // 2. ESTADO DIARIO (Indexado por fecha YYYY-MM-DD)
      // ==========================================
      // Estructura: { [fecha]: { [empleadoId]: { estado, pacientes, cubreA, nota } } }
      asistenciaDiaria: {},

      // ==========================================
      // 2b. CONFIGURACIÓN DEL REPORTE (editable por la Jefa de Piso)
      // ==========================================
      servicioSeleccionado: 'HOSPITALIZACION CIRUGIA',
      turnoSeleccionado:    'NOCTURNO',
      periodoInicio:        '2026-03-16',
      periodoFin:           '2026-04-15',

      // ==========================================
      // 2c. PLANEACIÓN MENSUAL (8 semanas por empleado)
      // ==========================================
      // Estructura: { [empId]: { [semanaIndex]: valor } }
      // semanaIndex: 0-7 (Semana 1 a Semana 8)
      // valor: '' | '1'..'8' | 'EJP' | 'Cendis' | 's/s'
      planeacionMensual: {},

      // ==========================================
      // 2d. ROL SEMANAL OPERATIVO (Hoja CIRUGIA)
      // ==========================================
      // Estructura: { [semanaIndex]: { [empId]: { [diaIndex]: valor } } }
      // semanaIndex: 0-7 (una entrada por cada semana del periodo)
      // diaIndex: 0-6 (0=Dom … 6=Sáb)
      rolSemanal: {},

      // ==========================================
      // 2e. CONFIGURACIÓN DE FIRMAS / INDICADOR
      // ==========================================
      configuracion: {
        indicador: '3.5',
        elaboro:   '',
        autorizo:  '',
      },

      // ==========================================
      // 2f. CENSO DE MADRUGADA
      // ==========================================
      // Diccionario indexado por idCama (ej. 'G01', 'T02').
      // Cada valor es un objeto de paciente/cama con la siguiente forma:
      //
      // {
      //   idCama:           'G01',
      //   especialidad:     'OBST',           // 'OBST' | 'GIN' | 'QXGEN' | etc.
      //   ingreso:          { fecha: '', hora: '' },
      //   paciente:         { nombre: '', nss: '', genero: 'F', edad: '' },
      //   dxMedico:         '',
      //   egreso:           { fecha: '', hora: '' },
      //   causaNoOcupacion: '',               // si la cama está vacía
      //   invasivos: {
      //     cvc:   { tipo: '', fecha: '' },   // ej. tipo: 'CPIZQ'
      //     sonda: { tipo: '', fecha: '' },   // ej. tipo: 'CU'
      //   },
      //   riesgos: { caidas: '', upp: '', aislamiento: 'E' },
      //   tratamiento: {
      //     higiene: '', soluciones: '', hemoderivados: '',
      //     laboratorios: '', gabinete: '',
      //   },
      //   traslado:     '',
      //   observaciones: '',
      // }
      censoMadrugada: {},

      // ==========================================
      // 2g. DATAMART — Bitácora de Procedimientos
      // ==========================================
      // Array de registros de procedimientos realizados durante el turno.
      // Cada registro tiene la forma:
      // {
      //   id:        string (uuid),
      //   fecha:     string,
      //   nombre:    string,
      //   hosp:      string,   // cama / hospitalización
      //   origen:    string,   // 'De la Unidad' | 'De otra unidad'
      //   vma, cpap, cardioversion, cvc, vesical, sng, sog,
      //   pleural, curaciones, tenckhoff, interconsultas,
      //   paracentesis, toracocentesis, artrocentesis,
      //   lumbar, drenaje, suturas, npt: string
      // }
      registrosDatamart: [],

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
          // Limpia el registro de asistencia del empleado en todas las fechas
          asistenciaDiaria: Object.fromEntries(
            Object.entries(state.asistenciaDiaria).map(([fecha, diaData]) => {
              const copia = { ...diaData };
              delete copia[id];
              return [fecha, copia];
            })
          ),
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
       * Actualiza la asistencia de un empleado en la fecha indicada (por defecto hoy).
       * Ejemplo:
       *   actualizarAsistencia(5, { estado: 'Asistencia', pacientes: 3 })
       *   actualizarAsistencia(5, { cubreA: 'Eva Montoya' }, '2026-03-21')
       */
      actualizarAsistencia: (empleadoId, datos, fecha = getFechaHoy()) =>
        set((state) => {
          const diaActual = state.asistenciaDiaria[fecha] ?? {};
          return {
            asistenciaDiaria: {
              ...state.asistenciaDiaria,
              [fecha]: {
                ...diaActual,
                [empleadoId]: {
                  ...asistenciaDefault(),
                  ...diaActual[empleadoId],
                  ...datos,
                },
              },
            },
          };
        }),

      /** Vacía el reporte de una fecha específica (por defecto hoy) */
      limpiarReporteDiario: (fecha = getFechaHoy()) =>
        set((state) => ({
          asistenciaDiaria: {
            ...state.asistenciaDiaria,
            [fecha]: {},
          },
        })),

      // ==========================================
      // 6. ACCIONES — Configuración del reporte
      // ==========================================

      /** Cambia el servicio que aparece en el encabezado del Excel */
      setServicio: (valor) => set({ servicioSeleccionado: valor }),

      /** Cambia el turno que aparece en el encabezado del Excel */
      setTurno: (valor) => set({ turnoSeleccionado: valor }),

      /**
       * Cambia el periodo del reporte.
       * @param {string} inicio  - 'YYYY-MM-DD'
       * @param {string} fin     - 'YYYY-MM-DD'
       */
      setPeriodo: (inicio, fin) => set({ periodoInicio: inicio, periodoFin: fin }),

      // ==========================================
      // 7. ACCIONES — Planeación mensual
      // ==========================================

      /**
       * Actualiza la asignación de semana de un empleado.
       * @param {number|string} empId       - id del empleado
       * @param {number}        semanaIndex - 0-7 (Semana 1 = 0, Semana 8 = 7)
       * @param {string}        valor       - '' | '1'..'8' | 'EJP' | 'Cendis' | 's/s'
       */
      actualizarPlaneacion: (empId, semanaIndex, valor) =>
        set((state) => ({
          planeacionMensual: {
            ...state.planeacionMensual,
            [empId]: {
              ...(state.planeacionMensual[empId] ?? {}),
              [semanaIndex]: valor,
            },
          },
        })),

      // ==========================================
      // 8. ACCIONES — Rol Semanal Operativo
      // ==========================================

      /**
       * Actualiza la asignación de un día del rol semanal para un empleado en una semana.
       * @param {number|string} empId       - id del empleado
       * @param {number}        semanaIndex - 0-7 (semana del período)
       * @param {number}        diaIndex    - 0-6 (0=Dom … 6=Sáb)
       * @param {string}        valor       - área/actividad asignada ese día
       */
      actualizarRolSemanal: (empId, semanaIndex, diaIndex, valor) =>
        set((state) => {
          const semanaActual = state.rolSemanal[semanaIndex] ?? {};
          const empActual    = semanaActual[empId] ?? {};
          return {
            rolSemanal: {
              ...state.rolSemanal,
              [semanaIndex]: {
                ...semanaActual,
                [empId]: { ...empActual, [diaIndex]: valor },
              },
            },
          };
        }),

      /**
       * Auto-llena una semana del rolSemanal copiando el valor del planeador mensual.
       * Para cada empleado que tenga asignación en planeacionMensual[empId][semanaIndex],
       * copia ese valor a los 7 días de rolSemanal[semanaIndex][empId], dejando en ''
       * los días que correspondan a su diasDescanso.
       * @param {number} semanaIndex - 0-7
       */
      autoLlenarSemana: (semanaIndex) =>
        set((state) => {
          const semanaActual = state.rolSemanal[semanaIndex] ?? {};
          const nuevaSemana  = { ...semanaActual };

          state.empleados.forEach((emp) => {
            const valorSemana = state.planeacionMensual[emp.id]?.[semanaIndex];
            if (valorSemana === undefined || valorSemana === '') return;

            const diasDescanso = Array.isArray(emp.diasDescanso) ? emp.diasDescanso : [];
            const diasEmp = {};
            for (let d = 0; d < 7; d++) {
              diasEmp[d] = diasDescanso.includes(d) ? '' : valorSemana;
            }
            nuevaSemana[emp.id] = diasEmp;
          });

          return {
            rolSemanal: {
              ...state.rolSemanal,
              [semanaIndex]: nuevaSemana,
            },
          };
        }),

      // ==========================================
      // 9. ACCIONES — Configuración de firmas
      // ==========================================

      /**
       * Actualiza los campos de configuración del reporte (indicador, firmas).
       * @param {{ indicador?: string, elaboro?: string, autorizo?: string }} nuevosDatos
       */
      setConfiguracion: (nuevosDatos) =>
        set((state) => ({
          configuracion: { ...state.configuracion, ...nuevosDatos },
        })),

      // ==========================================
      // 10. ACCIONES — Censo de Madrugada
      // ==========================================

      /**
       * Crea o actualiza los datos de una cama con merge profundo de un nivel.
       * Solo sobreescribe los campos que se pasen; el resto se conserva intacto.
       *
       * @param {string} idCama        - Identificador de la cama, ej. 'G01'
       * @param {Object} datosPaciente - Campos parciales o completos del modelo de cama
       *
       * Ejemplo de uso:
       *   actualizarCama('G01', { paciente: { nombre: 'Ana López' } })
       *   actualizarCama('G01', { riesgos: { caidas: 'ALTO', upp: 'MEDIO' } })
       */
      actualizarCama: (idCama, datosPaciente) =>
        set((state) => {
          const camaActual = state.censoMadrugada[idCama] ?? {};
          // Merge profundo de un nivel: combina sub-objetos como invasivos, riesgos, etc.
          const camaMerged = { ...camaActual };
          Object.entries(datosPaciente).forEach(([clave, valor]) => {
            if (
              valor !== null &&
              typeof valor === 'object' &&
              !Array.isArray(valor) &&
              typeof camaActual[clave] === 'object' &&
              camaActual[clave] !== null
            ) {
              // Sub-objeto → merge de un nivel más
              camaMerged[clave] = { ...camaActual[clave], ...valor };
            } else {
              // Valor primitivo o campo nuevo → asignación directa
              camaMerged[clave] = valor;
            }
          });
          return {
            censoMadrugada: {
              ...state.censoMadrugada,
              [idCama]: camaMerged,
            },
          };
        }),

      /**
       * Libera una cama del censo (egreso / alta del paciente).
       * Elimina la entrada del diccionario censoMadrugada.
       *
       * @param {string} idCama - Identificador de la cama, ej. 'G01'
       */
      limpiarCama: (idCama) =>
        set((state) => {
          const copia = { ...state.censoMadrugada };
          delete copia[idCama];
          return { censoMadrugada: copia };
        }),

      // ==========================================
      // 11. ACCIONES — DataMart (Bitácora de Procedimientos)
      // ==========================================

      /**
       * Agrega un registro de procedimientos al DataMart.
       * Se genera un UUID automáticamente.
       *
       * @param {Object} registro - Campos del procedimiento (fecha, nombre, hosp, origen, …)
       */
      agregarRegistroDatamart: (registro) =>
        set((state) => ({
          registrosDatamart: [
            { id: crypto.randomUUID(), ...registro },
            ...state.registrosDatamart,
          ],
        })),

      /**
       * Elimina un registro del DataMart por su id.
       *
       * @param {string} id - UUID del registro a eliminar
       */
      eliminarRegistroDatamart: (id) =>
        set((state) => ({
          registrosDatamart: state.registrosDatamart.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'reportes-toco-storage-v2', // Nombre en el localStorage
    }
  )
);