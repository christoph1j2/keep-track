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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Získat všechny nepřečtené notifikace' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.notificationService.findAllUnread(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Označit notifikaci jako přečtenou' })
  markAsRead(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Smazat notifikaci' })
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationService.remove(req.user.id, id);
  }
}
