import { SetMetadata } from '@nestjs/common';

export const IS_AUTHENTICATED_KEY = 'isAuthenticated';

/**
 * Requiere JWT válido y expone @CurrentUser(), pero no valida permisos RBAC en ms-security.
 * Útil para onboarding (citizen/driver) y catálogos de lectura (enterprise).
 */
export const Authenticated = () => SetMetadata(IS_AUTHENTICATED_KEY, true);
