import { SetMetadata } from '@nestjs/common';

export const REQUIRES_DRIVER_KEY = 'requiresDriver';

/** Exige perfil de conductor registrado en PostgreSQL (`persons`, type=driver). */
export const RequiresDriver = () => SetMetadata(REQUIRES_DRIVER_KEY, true);
