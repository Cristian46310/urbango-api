import { SetMetadata } from '@nestjs/common';

export const IS_AUTHENTICATED_KEY = 'isAuthenticated';

/**
 * Requiere JWT válido sin validar permisos RBAC en ms-security.
 * Útil mientras se registran rutas de ms-messages en el sistema de permisos.
 */
export const Authenticated = () => SetMetadata(IS_AUTHENTICATED_KEY, true);
