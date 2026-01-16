import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

let app: any;

async function bootstrap() {
  app = await NestFactory.create(AppModule, { bodyParser: true });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // CORS configuration - must be first middleware
  app.enableCors({
    origin: true, // Allow any origin for preflight to work
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length'],
    maxAge: 3600,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Handle OPTIONS requests explicitly for preflight
  app.use((req: any, res: any, next: any) => {
    res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,Content-Type,Authorization,Accept,X-Requested-With,Access-Control-Request-Method,Access-Control-Request-Headers');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '3600');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  if (!process.env.VERCEL) {
    await app.listen(configService.get('PORT') || 3001);
    logger.log(`Application is running on: ${await app.getUrl()}`);
  }

  return app;
}

// Start app
bootstrap();

// Export handler for Vercel serverless functions
export default async (req: any, res: any) => {
  if (!app) {
    await bootstrap();
  }
  return app.getHttpAdapter().getInstance()(req, res);
};