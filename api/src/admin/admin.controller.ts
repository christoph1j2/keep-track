import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '.prisma/client/edge';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    // Implementation for fetching admin statistics
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers() {
    // Implementation for fetching all users
    return this.adminService.getUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Body('userId') userId: string,
    @Body('newRole') newRole: Role,
  ) {
    // Implementation for updating user role
    return this.adminService.updateUserRole(userId, newRole);
  }

  @Delete('users/:id')
  deleteUser(
    @Body('userId') userId: string,
  ) {
    // Implementation for deleting a user
    return this.adminService.deleteUser(userId);
  }

}
