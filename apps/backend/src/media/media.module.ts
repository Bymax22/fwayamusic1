import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { CoverAdminController } from './admin.controller';
import { PrismaModule } from '../db/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NotificationModule } from '../notification/notification.module';
import { EventsModule } from '../events/events.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    PricingModule,
    EventsModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 200 * 1024 * 1024,
      },
    }),
  ],
  controllers: [MediaController, CoverAdminController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
 