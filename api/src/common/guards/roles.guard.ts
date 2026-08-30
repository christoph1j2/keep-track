import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Guard that implements RBAC for routes and controllers.
 *
 * This guard is used to restrict access to specific routes based on the user's role.
 * Works with conjuction with the @Roles() decorator to restrict access
 * to specific routes based on the user's role. It uses NestJS' Reflector to
 * examine metadata and determine what roles are required for a given endpoint.
 *
 * @example
 * Globally
 * providers: [
 *  {
 *      provide: APP_GUARD,
 *      useClass: RolesGuard
 *  }
 * ]
 *
 * OR Specifically
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * @Controller('admin')
 * export class AdminController { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
    private readonly logger: Logger,
  ) {}

  /**
   * Determines whether a request has the necessary roles to proceed.
   *
   * The method checks if the user making the request has the required roles
   * to access a specific handler of a class.
   * It retrieves the roles from metadata using the Reflector service and
   * verifies them against the user's roles obtained from the UsersService.
   *
   * @param context - The execution context of the request, which provides
   * access to the handler and class metadata.
   * @returns A promise that resolves to a boolean indicating whether the
   * user has the required roles.
   *
   * Logs various debug information via the Logger service, including
   * required roles, user information, and access decisions.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Retrieve the required roles for the current route handler and class
    const requiredRoles: Role[] | undefined = this.reflector.getAllAndOverride<
      Role[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    // Format bc of TS
    const formattedRoles = requiredRoles ? requiredRoles.join(', ') : 'None';

    this.logger.verbose('=== RolesGuard Debug ===');
    this.logger.verbose(`Required roles: ${formattedRoles}`);

    // If no roles are required, grant access
    if (!requiredRoles) {
      this.logger.verbose('No roles required for this route. Access granted.');
      return true;
    }

    // Extract the user from the request object
    const request: { user?: { id: string } } = context
      .switchToHttp()
      .getRequest();
    const user = request.user;

    this.logger.verbose(`User from request...`);

    // If no user is found in the request, deny access
    if (!user) {
      this.logger.verbose('No user found in request. Access denied.');
      return false;
    }

    // Fetch the full user details from the database using the UsersService
    const fullUser = await this.usersService.findOne(user.id);
    this.logger.verbose(`Full user from DB fetch...`);

    // If the user is not found in the database, deny access
    if (!fullUser) {
      this.logger.verbose('User not found in database. Access denied.');
      return false;
    }

    // Check if the user's role matches any of the required roles
    const hasRole = requiredRoles.includes(fullUser.role);

    this.logger.debug(
      `Required roles: ${formattedRoles}\nUser role: ${fullUser.role}\nHas required role: ${hasRole}`,
    );
    this.logger.debug(
      `Access ${hasRole ? 'granted' : 'denied'} for user with role: ${fullUser.role}`,
    );

    this.logger.verbose('=== End of RolesGuard Debug ===');

    // Return whether the user has the required role(s)
    return hasRole;
  }
}
