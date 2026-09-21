import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../db/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, NotificationModule, EventsModule],
  controllers: [AdminController],
})
export class AdminModule {}