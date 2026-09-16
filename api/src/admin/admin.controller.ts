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

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get application statistics' })
  @ApiResponse({
    status: 200,
    description: 'Application statistics retrieved successfully.',
  })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get list of all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:id/details')
  @ApiOperation({ summary: 'Get detailed information for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully.',
  })
  getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  updateUserRole(
    @Param('id') userId: string,
    @Body('newRole', new ParseEnumPipe(Role)) newRole: Role,
  ) {
    return this.adminService.updateUserRole(userId, newRole);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Post('broadcast-notification')
  @ApiOperation({ summary: 'Broadcast notification to users' })
  @ApiResponse({
    status: 201,
    description: 'Notification broadcasted successfully.',
  })
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
  @ApiOperation({ summary: 'Cleanup old import jobs' })
  @ApiResponse({
    status: 201,
    description: 'Old import jobs cleaned up successfully.',
  })
  cleanupOldImportJobs() {
    return this.adminService.cleanupOldImportJobs();
  }
}
