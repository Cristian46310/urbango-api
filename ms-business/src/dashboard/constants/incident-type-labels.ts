import { IncidentType } from '@/incident/enums/incident.enum';

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  [IncidentType.MECHANICAL]: 'Mecánico',
  [IncidentType.ACCIDENT]: 'Accidente',
  [IncidentType.DELAY]: 'Retraso',
  [IncidentType.PASSENGER]: 'Problemas con pasajeros',
  [IncidentType.OTHER]: 'Otros',
};

export const INCIDENT_TYPE_ORDER: IncidentType[] = [
  IncidentType.MECHANICAL,
  IncidentType.ACCIDENT,
  IncidentType.DELAY,
  IncidentType.PASSENGER,
  IncidentType.OTHER,
];
