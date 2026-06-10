import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@/shared/filters/http-exception.filter';
import { applySwaggerBearerAuth } from '@/shared/swagger/apply-swagger-bearer-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MS Messages API')
    .setDescription(
      'Mensajería directa y grupal. JWT desde ms-security. WebSocket Socket.IO en el mismo puerto.',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3001', 'Local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT obtenido desde ms-security (POST /api/public/security/login)',
      },
      'bearer',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  applySwaggerBearerAuth(app, swaggerDocument, 'bearer');
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'MS Messages API Docs',
  });

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
