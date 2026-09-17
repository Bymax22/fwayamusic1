import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { getAdminStats } from '../db/admin';

@Controller('v1/admin')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminController {
  @Get('dashboard/stats')
  async getDashboardStats() {
    return getAdminStats();
  }
}