import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor';

let app: any;
const logger = new Logger('Bootstrap');

async function initializeApp() {
  if (app) return app;

  try {
    logger.log('Initializing NestJS application...');
    app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
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

    // Sanitize responses (BigInt -> safe JSON) globally
    app.useGlobalInterceptors(new SerializeInterceptor());

    // CORS must be enabled BEFORE global prefix
    app.enableCors({
      origin: '*',
      credentials: false,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      optionsSuccessStatus: 200,
    });

    app.setGlobalPrefix('/api');
    app.use((req: any, res: any, next: any) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'false');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
    await app.init();
    // Register socket.io adapter for realtime gateways
    app.useWebSocketAdapter(new IoAdapter(app));
    logger.log('NestJS application initialized successfully');

    if (!process.env.VERCEL) {
      const port = configService.get('PORT') || 3001;
      await app.listen(port);
      logger.log(`Application running on port ${port}`);
    } else {
      logger.log('Running on Vercel serverless');
    }

    return app;
  } catch (error) {
    logger.error('Failed to initialize app:', error instanceof Error ? error.message : error);
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
  const setCorsHeaders = () => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  };

  try {
    if (!app) {
      logger.log('Initializing app on first request');
      await initializeApp();
    }
    // Ensure CORS headers are present even for serverless errors
    setCorsHeaders();

    // Get the HTTP adapter and use it to handle the request
    const httpAdapter = app.getHttpAdapter();
    return httpAdapter.getInstance()(req, res);
  } catch (error) {
    logger.error('Error handling request:', error instanceof Error ? error.message : error);
    setCorsHeaders();

    // Use raw Node response methods for Vercel when Express response helpers may not exist.
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : error }));
  }
};

// For local/testing, also export the app initialization
export { initializeApp };