import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

let app: any;
const logger = new Logger('Bootstrap');

async function initializeApp() {
  if (app) return app;

  try {
    app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Add global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        skipMissingProperties: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      })
    );

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
      const port = configService.get('PORT') || 3001;
      await app.listen(port);
      logger.log(`Application running on port ${port}`);
    } else {
      logger.log('Running on Vercel serverless');
    }

    return app;
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    throw error;
  }
}

// For local development
if (!process.env.VERCEL) {
  initializeApp().catch(err => {
    logger.error('Fatal error:', err);
    process.exit(1);
  });
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