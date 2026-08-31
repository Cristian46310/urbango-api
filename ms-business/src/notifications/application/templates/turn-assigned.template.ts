export function asString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

export function renderTurnAssigned(data: Record<string, unknown>): {
  subject: string;
  body: string;
} {
  const driverName = asString(data.driverName, 'conductor');
  const plate = asString(data.plate, 'N/A');
  const date = asString(data.date, 'N/A');
  const startTime = asString(data.startTime, 'N/A');
  const endTime = asString(data.endTime, 'N/A');
  const status = asString(data.status, 'N/A');

  return {
    subject: 'Se te ha asignado un nuevo turno',
    body: [
      `Hola, ${driverName}.`,
      '',
      'Se te ha asignado un nuevo turno.',
      '',
      'Detalles:',
      '',
      `Bus: ${plate}`,
      `Fecha: ${date}`,
      `Inicio: ${startTime}`,
      `Fin: ${endTime}`,
      `Estado: ${status}`,
      '',
      'Por favor, asegúrate de presentarte a tiempo y revisar la aplicación para cualquier actualización.',
      '',
      'Gracias.',
    ].join('\n'),
  };
}
