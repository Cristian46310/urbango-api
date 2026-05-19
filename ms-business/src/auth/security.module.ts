import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { SecurityGuard } from './guards/security.guard';

@Module({
  imports: [HttpModule, ConfigModule, AuthModule],
  providers: [
    SecurityGuard,
    {
      provide: APP_GUARD,
      useExisting: SecurityGuard,
    },
  ],
})
export class SecurityModule {}