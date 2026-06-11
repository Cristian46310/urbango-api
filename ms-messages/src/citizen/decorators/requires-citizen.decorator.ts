import { SetMetadata } from '@nestjs/common';

export const REQUIRES_CITIZEN_KEY = 'requiresCitizen';

/** Exige perfil de ciudadano registrado en PostgreSQL (`persons`, type=citizen). */
export const RequiresCitizen = () => SetMetadata(REQUIRES_CITIZEN_KEY, true);
