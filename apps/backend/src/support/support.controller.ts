import { Body, Controller, Post, BadRequestException, Get, Query, Param, Patch, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('v1/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  async create(@Body() body: CreateSupportDto) {
    if (!body || !body.email || !body.message) {
      throw new BadRequestException('email and message are required');
    }
    const ticket = await this.supportService.createTicket(body as CreateSupportDto);
    return { ok: true, ticketId: ticket.ticketId };
  }

  @UseGuards(FirebaseAuthGuard)
  @Get()
  async list(@Query('limit') limit = '50', @Query('skip') skip = '0', @Query('q') q = '', @Query('status') status = '', @Req() req: any) {
    // Only allow staff roles
    const role = req.user?.role;
    if (!['ADMIN', 'MODERATOR', 'CONTENT_MANAGER'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const l = Number(limit) || 50;
    const s = Number(skip) || 0;
    const qStr = typeof q === 'string' && q.trim() !== '' ? q : undefined;
    const statusStr = typeof status === 'string' && status.trim() !== '' ? status : undefined;
    return this.supportService.listTickets(l, s, qStr, statusStr);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string, @Req() req: any) {
    const role = req.user?.role;
    if (!['ADMIN', 'MODERATOR', 'CONTENT_MANAGER'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const ticketId = Number(id);
    return this.supportService.getTicket(ticketId);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateSupportDto, @Req() req: any) {
    const role = req.user?.role;
    if (!['ADMIN', 'MODERATOR', 'CONTENT_MANAGER'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const ticketId = Number(id);
    return this.supportService.updateTicket(ticketId, body as any);
  }
}
