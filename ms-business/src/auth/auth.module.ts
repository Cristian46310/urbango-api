import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { HttpModule } from '@nestjs/axios;
import { Module } from '@nestjs/common';

import { JwtValidationService } from './services/jwt-validation.service';
import { SharedModule } from '@/shared/shared.module';

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
    SharedModule,
  ],
  providers: [JwtValidationService],
  exports: [HttpModule, JwtValidationService, SharedModule],
})
export class AuthModule {}
