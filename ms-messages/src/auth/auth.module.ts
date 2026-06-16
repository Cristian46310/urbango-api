import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { JwtValidationService } from './services/jwt-validation.service';

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
  ],
  providers: [JwtValidationService],
  exports: [HttpModule, JwtValidationService],
})
export class AuthModule {}
