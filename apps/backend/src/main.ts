import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

let app: any;
const logger = new Logger('Bootstrap');

async function initializeApp() {
  if (app) return app;

  app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS must be enabled BEFORE global prefix
  app.enableCors({
    origin: (origin: any, callback: any) => {
      // Allow all origins
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    optionsSuccessStatus: 200,
  });

  app.setGlobalPrefix('api');
  await app.init();

  if (!process.env.VERCEL) {
    await app.listen(configService.get('PORT') || 3001);
    logger.log(`Application running on port ${configService.get('PORT') || 3001}`);
  }

  return app;
}

// For local development
if (!process.env.VERCEL) {
  initializeApp().catch(err => logger.error('Failed to initialize app:', err));
}

// Export for Vercel serverless
export default async (req: any, res: any) => {
  try {
    if (!app) {
      await initializeApp();
    }
    return app.getHttpAdapter().getInstance()(req, res);
  } catch (error) {
    logger.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};