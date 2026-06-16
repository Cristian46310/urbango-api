import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtValidationService } from './services/jwt-validation.service';
import { ProfileContextService } from './services/profile-context.service';
import { Person } from '@/shared/entities/person.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { Driver } from '@/driver/entities/driver.entity';

@Global()
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
    TypeOrmModule.forFeature([Person, Citizen, Driver]),
  ],
  providers: [JwtValidationService, ProfileContextService],
  exports: [HttpModule, JwtValidationService, ProfileContextService],
})
export class AuthModule {}
