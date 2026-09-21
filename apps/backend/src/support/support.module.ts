import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { PrismaModule } from '../db/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, NotificationModule, EventsModule],
  providers: [SupportService],
  controllers: [SupportController],
  exports: [SupportService],
})
export class SupportModule {}
