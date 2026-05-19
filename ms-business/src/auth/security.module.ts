import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SecurityGuard } from './guards/security.guard';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SecurityGuard,
    },
  ],
})
export class SecurityModule {}
