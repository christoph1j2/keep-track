import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:id/details')
  getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') userId: string,
    @Body('newRole', new ParseEnumPipe(Role)) newRole: Role,
  ) {
    return this.adminService.updateUserRole(userId, newRole);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Post('broadcast-notification')
  broadcastNotification(
    @Body('title') title: string,
    @Body('message') message?: string,
    @Body('type') type?: string,
    @Body('targetUserIds') targetUserIds?: string[],
  ) {
    return this.adminService.broadcastNotification(
      title,
      message,
      type,
      targetUserIds,
    );
  }

  @Post('maintenance/cleanup-jobs')
  cleanupOldImportJobs() {
    return this.adminService.cleanupOldImportJobs();
  }
}
