import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtValidationService } from './services/jwt-validation.service';
import { SharedModule } from '@/shared/shared.module';
import * as http from 'http';
import * as https from 'https';

@Module({
  imports: [
    HttpModule.register({
  timeout: 60000,
  maxRedirects: 5,
  httpAgent: new http.Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 20,
    timeout: 10000,
  }),
  httpsAgent: new https.Agent({
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
