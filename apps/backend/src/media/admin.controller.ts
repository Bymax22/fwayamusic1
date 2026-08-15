import { Controller, Get, Post, Param, UseGuards, Body, Req, Logger } from '@nestjs/common';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { MediaService } from './media.service';

@Controller('v1/admin/covers')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class CoverAdminController {
  private readonly logger = new Logger(CoverAdminController.name);
  constructor(private readonly mediaService: MediaService) {}

  @Get('pending')
  async listPending() {
    return this.mediaService.listPendingCovers();
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    this.logger.log(`Admin ${user.id} approving cover ${id}`);
    return this.mediaService.approveCover(Number(id), user.id);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { reason?: string }, @Req() req: any) {
    const user = req.user;
    this.logger.log(`Admin ${user.id} rejecting cover ${id}: ${body.reason || 'no reason'}`);
    return this.mediaService.rejectCover(Number(id), user.id, body.reason || 'Rejected by admin');
  }
}
