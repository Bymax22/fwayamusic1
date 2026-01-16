import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Configure CORS - more permissive for Vercel serverless
  app.enableCors({
    origin: '*', // Allow all origins for now, Vercel needs this
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: false, // Set to false when using origin: '*'
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  await app.init();

  // For Vercel, return the Express instance
  if (process.env.VERCEL) {
    return app.getHttpAdapter().getInstance();
  }

  // For local development, start listening
  await app.listen(configService.get('PORT') || 3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

// For Vercel serverless
let vercelApp: any;
if (process.env.VERCEL) {
  bootstrap().then(app => {
    vercelApp = app;
  });
}

// Export for Vercel
export default vercelApp;

// For local development
if (!process.env.VERCEL) {
  bootstrap();
}