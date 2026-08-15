import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { NotificationService } from '../notification/notification.service';
import axios from 'axios';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  constructor(private readonly prisma: PrismaService, private readonly notificationService: NotificationService) {}

  async createTicket(dto: CreateSupportDto) {
    const record = await this.prisma.supportTicket.create({
      data: {
        name: dto.name,
        email: dto.email,
        message: dto.message,
        source: dto.source,
        type: dto.type,
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
      },
    });
    this.logger.log(`Created support ticket ${record.ticketId} for ${record.email}`);
    // Notify admins in-app
    try {
      const admins = await this.prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MODERATOR', 'CONTENT_MANAGER'] } }, select: { id: true, email: true } });
      const notifications = admins.map(a => ({ userId: a.id, title: 'New support ticket', message: `Ticket ${record.ticketId}: ${record.message.substring(0, 80)}`, type: 'SYSTEM' as any, metadata: { ticketId: record.ticketId } }));
      await this.notificationService.createMany(notifications);

      // Send email to admins if Brevo configured
      const apiKey = process.env.BREVO_API_KEY;
      const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@fwaya.net';
      if (apiKey && admins.length > 0) {
        const to = admins.map(a => ({ email: a.email }));
        const payload = {
          sender: { email: fromEmail, name: 'Fwaya Support' },
          to,
          subject: `New support ticket ${record.ticketId}`,
          htmlContent: `<p>A new support ticket was submitted:</p><p><strong>From:</strong> ${record.name || record.email}</p><p><strong>Message:</strong> ${record.message}</p><p>Ticket ID: ${record.ticketId}</p>`,
        };
        try {
          await axios.post('https://api.brevo.com/v3/smtp/email', payload, { headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }, timeout: 10000 });
        } catch (err) {
          this.logger.warn('Failed to send admin email for new ticket: ' + (err instanceof Error ? err.message : String(err)));
        }
      }
    } catch (err) {
      this.logger.warn('Error while notifying admins about support ticket: ' + (err instanceof Error ? err.message : String(err)));
    }

    return record;
  }

  async listTickets(limit = 50, skip = 0, q?: string, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { message: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { ticketId: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip });
  }

  async getTicket(id: number) {
    return this.prisma.supportTicket.findUnique({ where: { id } });
  }

  async updateTicket(id: number, data: Partial<CreateSupportDto & { status?: string }>) {
    // Prisma's JSON typing is strict; cast to any for flexible updates from DTO
    return this.prisma.supportTicket.update({ where: { id }, data: (data as any) });
  }
}
