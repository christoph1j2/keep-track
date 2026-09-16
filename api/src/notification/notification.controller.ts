import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Unread notifications retrieved successfully.',
  })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.notificationService.findAllUnread(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully.',
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationService.remove(req.user.id, id);
  }
}
