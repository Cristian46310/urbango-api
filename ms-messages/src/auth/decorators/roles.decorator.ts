import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Exige al menos uno de los roles del JWT (vía ms-security validate-token). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
