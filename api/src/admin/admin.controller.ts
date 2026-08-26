import { Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '.prisma/client/edge';

@UseGuards(RolesGuard, JwtAuthGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    // Implementation for fetching admin statistics
  }

  @Get('users')
  async getUsers() {
    // Implementation for fetching all users
  }

  @Patch('users/:id/role')
  async updateUserRole() {
    // Implementation for updating user role
  }

  @Delete('users/:id')
  async deleteUser() {
    // Implementation for deleting a user
  }


}
