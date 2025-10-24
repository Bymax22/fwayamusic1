import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import * as admin from 'firebase-admin';
import { PrismaModule } from './db/prisma.module';
import { MediaModule } from './media/media.module';
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';
import { BeatsModule } from './beats/beats.module';
import { NewsModule } from './news/news.module';
import { MediaInteractionModule } from './media-interaction/media-interaction.module';
import { FollowerModule } from './follower/follower.module';
import {PlaylistModule} from './playlist/playlist.module';
import {ArtistsModule} from './artists/artists.module';
import {UserModule} from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV}`],
    }),
    PrismaModule,
    MulterModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        dest: config.get<string>('UPLOAD_DIR', './uploads'),
        limits: {
          fileSize: config.get<number>('MAX_FILE_SIZE_MB', 100) * 1024 * 1024,
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    MediaModule,
    PaymentModule,
    BeatsModule,
    NewsModule,
    MediaInteractionModule,
    FollowerModule,
    PlaylistModule,
    ArtistsModule,
    UserModule,
  ],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (config: ConfigService) => {
        const privateKey = config.get('FIREBASE_PRIVATE_KEY');
        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.get('FIREBASE_PROJECT_ID'),
            clientEmail: config.get('FIREBASE_CLIENT_EMAIL'),
            privateKey: typeof privateKey === 'string' ? privateKey.replace(/\\n/g, '\n') : undefined,
          }),
          storageBucket: config.get('FIREBASE_STORAGE_BUCKET'),
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}