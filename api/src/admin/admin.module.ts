import { Logger, Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, UsersService, Logger],
})
export class AdminModule {}
