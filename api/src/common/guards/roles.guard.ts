import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { UsersService } from "../../users/users.service";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Role } from "@prisma/client";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private usersService: UsersService,
        private readonly logger: Logger,
    ) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        )
        this.logger.verbose('=== RolesGuard Debug ===');
        this.logger.verbose(`Required roles: ${requiredRoles}`);

        if (!requiredRoles) {
            this.logger.verbose('No roles required for this route. Access granted.');
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        this.logger.verbose(`User from request...`);

        if (!user) {
            this.logger.verbose('No user found in request. Access denied.');
            return false;
        }

        const fullUser = this.usersService.findOne(user.id);
        this.logger.verbose(`Full user from DB fetch...`);

        if (!fullUser) {
            this.logger.verbose('User not found in database. Access denied.');
            return false;
        }

        const hasRole = requiredRoles.includes(fullUser);

        return false;
    }
}