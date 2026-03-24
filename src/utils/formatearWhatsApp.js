/**
 * Genera el texto en formato Markdown de WhatsApp para el reporte del día.
 *
 * @param {Object} params
 * @param {Array}  params.areas          - Catálogo de áreas del store
 * @param {Array}  params.empleados      - Catálogo de empleados del store
 * @param {Object} params.registrosDia   - asistenciaDiaria[fechaHoy] → { [empId]: { estado, pacientes, cubreA, nota } }
 * @returns {string} Texto listo para encodeURIComponent
 */
export function formatearMensajeWhatsApp({ areas, empleados, registrosDia }) {
  // ── Título con fecha en español ──────────────────────────────────────────
  const opcionesFecha = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const fechaStr = new Date().toLocaleDateString('es-MX', opcionesFecha);
  const fechaCapitalizada = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);

  let mensaje = `*${fechaCapitalizada}*\n\n`;

  // ── Formateador por empleado ─────────────────────────────────────────────
  const formatearLinea = (emp) => {
    const reg = registrosDia[emp.id];
    const estado = reg?.estado ?? 'Pendiente';
    const pacientes = reg?.pacientes ?? 0;
    const cubreA = reg?.cubreA?.trim() ?? '';
    const nota = reg?.nota?.trim() ?? '';
    const extra = emp.extra?.trim() ? ` ${emp.extra.trim()}` : '';

    const prefijoPacientes = pacientes > 0 ? `(${pacientes}) ` : '';

    switch (estado) {
      case 'Pendiente':
        return null; // sin registro confirmado → omitir

      case 'Falta':
        return `~Falta ${emp.nombre}~`;

      case 'Asistencia':
        return `${prefijoPacientes}${emp.nombre}${extra}${nota ? ` (${nota})` : ''}`;

      case 'T. Extra':
        return `${prefijoPacientes}${emp.nombre}${extra} (T. Extra)${nota ? ` (${nota})` : ''}`;

      case 'txt': {
        const cubreParte = cubreA ? ` (txt por ${cubreA})` : ' (txt)';
        return `${prefijoPacientes}${emp.nombre}${extra}${cubreParte}`;
      }

      default:
        // Estados secundarios IMSS: muestra el nombre + estado entre paréntesis
        return `${prefijoPacientes}${emp.nombre}${extra} (${estado})`;
    }
  };

  // ── Iterar por área ───────────────────────────────────────────────────────
  areas.forEach((area) => {
    const empEnArea = empleados.filter(
      (emp) =>
        emp.areaId === area.id &&
        (registrosDia[emp.id]?.estado ?? 'Pendiente') !== 'Pendiente'
    );
    if (empEnArea.length === 0) return;

    mensaje += `*${area.nombre}*\n`;

    // Agrupar por sub-área
    const subAreasMap = {};
    empEnArea.forEach((emp) => {
      const sub = emp.subArea?.trim() || 'General';
      if (!subAreasMap[sub]) subAreasMap[sub] = [];
      subAreasMap[sub].push(emp);
    });

    Object.keys(subAreasMap).forEach((subArea) => {
      const lineas = subAreasMap[subArea].map(formatearLinea).filter(Boolean);
      if (lineas.length === 0) return;

      if (subArea === 'General') {
        mensaje += `${lineas.join(', ')}\n`;
      } else {
        mensaje += `${subArea}: ${lineas.join(', ')}\n`;
      }
    });

    mensaje += '\n';
  });

  return mensaje.trimEnd();
}
