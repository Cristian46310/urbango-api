import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtValidationService } from './services/jwt-validation.service';
import { UserIdMappingService } from '@/shared/services/user-id-mapping.service';
import { SharedModule } from '@/shared/shared.module';
import { Person } from '@/shared/entities/person.entitie';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
      httpAgent: new Agent({
        keepAlive: true,
        maxSockets: 100,
        maxFreeSockets: 20,
        timeout: 10000,
      }),
      httpsAgent: new HttpsAgent({
        keepAlive: true,
        maxSockets: 100,
        maxFreeSockets: 20,
        timeout: 60000,
      }),
    }),
    TypeOrmModule.forFeature([Person]),
    SharedModule,
  ],
  providers: [JwtValidationService, UserIdMappingService],
  exports: [HttpModule, JwtValidationService, UserIdMappingService, SharedModule],
})
export class AuthModule {}
