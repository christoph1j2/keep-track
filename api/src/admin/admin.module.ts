import { Logger, Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, UsersService, Logger, JwtAuthGuard, RolesGuard],
})
export class AdminModule {}
