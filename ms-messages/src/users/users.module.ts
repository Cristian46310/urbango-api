import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SecurityUserClientService } from './services/security-user-client.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, SecurityUserClientService],
  exports: [SecurityUserClientService],
})
export class UsersModule {}
