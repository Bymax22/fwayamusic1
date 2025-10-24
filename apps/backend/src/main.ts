import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',    // Frontend
      'http://localhost',         // Local testing
      'https://fwaya-music.com'   // Production
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Start application
  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  logger.log(`Application running on ${await app.getUrl()}`);
}

bootstrap();