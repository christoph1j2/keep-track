import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Metadata key used to identify role requirements for routes.
 *
 * This key is used by role-based guards to determine which roles are
 * allowed to access specific routes or controllers.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that assigns required roles to controller methods or classes.
 *
 * When applied to a route handler or controller, this decorator sets metadata that can
 * be read by guards to enforce RBAC. Only users with specified roles
 * will be allowed to access the decorated routes.
 *
 * @param roles - Array of role values that are allowed to access the decorated route or controller.
 * @returns A decorator function that sets the the ROLES_KEY metadata with the provided roles.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
