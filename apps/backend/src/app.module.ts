import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './db/prisma.module';
import { MediaModule } from './media/media.module';
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';
import { BeatsModule } from './beats/beats.module';
import { NewsModule } from './news/news.module';
import { MediaInteractionModule } from './media-interaction/media-interaction.module';
import { MediaCommentModule } from './media-comment/media-comment.module';
import { FollowerModule } from './follower/follower.module';
import { PlaylistModule } from './playlist/playlist.module';
import { EventsModule } from './events/events.module';
import { ArtistsModule } from './artists/artists.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { KycModule } from './kyc/kyc.module';
import { AlbumsModule } from './albums/albums.module';
import { PricingModule } from './pricing/pricing.module';
import { SupportModule } from './support/support.module';
import { AdvertisingModule } from './advertising/advertising.module';

const logger = new Logger('AppModule');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV}`],
    }),
    PrismaModule,
    AuthModule,
    MediaModule,
    PaymentModule,
    BeatsModule,
    NewsModule,
    MediaInteractionModule,
    MediaCommentModule,
    FollowerModule,
    PlaylistModule,
    ArtistsModule,
    UserModule,
    NotificationModule,
    SubscriptionModule,
    EventsModule,
    KycModule,
    AlbumsModule,
    PricingModule,
    SupportModule,
    AdvertisingModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (config: ConfigService) => {
        try {
          const privateKey = config.get('FIREBASE_PRIVATE_KEY');
          const projectId = config.get('FIREBASE_PROJECT_ID');
          const clientEmail = config.get('FIREBASE_CLIENT_EMAIL');
          
          if (!privateKey || !projectId || !clientEmail) {
            logger.warn('Firebase credentials missing, skipping Firebase initialization');
            return null;
          }

          const app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: typeof privateKey === 'string' ? privateKey.replace(/\\n/g, '\n') : undefined,
            }),
            storageBucket: config.get('FIREBASE_STORAGE_BUCKET'),
          });
          
          logger.log('Firebase Admin initialized successfully');
          return app;
        } catch (error) {
          logger.error('Failed to initialize Firebase Admin:', error instanceof Error ? error.message : error);
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}