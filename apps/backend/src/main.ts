import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Configure CORS - must allow all origins for Vercel serverless
  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Handle preflight requests explicitly
  app.use((req: any, res: any, next: any) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'false');
      return res.sendStatus(200);
    }
    next();
  });

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