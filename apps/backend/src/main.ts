import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Configure CORS
  // Read allowed origins from environment variable ALLOWED_ORIGINS (comma-separated)
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map(s => s.trim())
    : [
        'http://localhost:3000', // Frontend dev
        'http://localhost', // Local testing
        'https://fwaya-music.com',
        'https://www.fwayainnovations.com', // add your production frontend domain here
      ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Origin not allowed'), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Start application
  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  logger.log(`Application running on ${await app.getUrl()}`);
}

bootstrap();