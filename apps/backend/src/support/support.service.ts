import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { NotificationService } from '../notification/notification.service';
import axios from 'axios';

export function normalizeSupportRequest(dto: Partial<CreateSupportDto> & { metadata?: Record<string, unknown> }) {
  const rawType = (dto.type || dto.metadata?.contactType || dto.metadata?.type || 'GENERAL') as string;
  const cleanedType = rawType.toString().trim().toUpperCase();

  const metadata = {
    ...(dto.metadata || {}),
    subject: dto.metadata?.subject || dto.metadata?.reason || dto.metadata?.title || 'General enquiry',
    source: dto.source || dto.metadata?.source || 'website-help-support',
    channel: dto.metadata?.channel || 'web',
    contactType: cleanedType,
    page: dto.metadata?.page || null,
  };

  return {
    name: String(dto.name || 'Guest').trim() || 'Guest',
    email: String(dto.email || '').trim(),
    message: String(dto.message || '').trim(),
    source: String(dto.source || metadata.source || 'website-help-support'),
    type: String(cleanedType || 'GENERAL'),
    metadata,
  };
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  constructor(private readonly prisma: PrismaService, private readonly notificationService: NotificationService) {}

  async createTicket(dto: CreateSupportDto) {
    const normalized = normalizeSupportRequest(dto);

    if (!normalized.email || !normalized.message) {
      throw new Error('email and message are required');
    }

    const record = await this.prisma.supportTicket.create({
      data: {
        name: normalized.name,
        email: normalized.email,
        message: normalized.message,
        source: normalized.source,
        type: normalized.type,
        metadata: normalized.metadata as any,
      },
    });
    this.logger.log(`Created support ticket ${record.ticketId} for ${record.email}`);
    // Notify admins in-app
    try {
      const admins = await this.prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MODERATOR', 'CONTENT_MANAGER'] } }, select: { id: true, email: true } });
      const notifications = admins.map(a => ({ userId: a.id, title: 'New support ticket', message: `Ticket ${record.ticketId}: ${record.message.substring(0, 80)}`, type: 'SYSTEM' as any, metadata: { ticketId: record.ticketId, source: record.source, type: record.type } }));
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
          htmlContent: `<p>A new support ticket was submitted:</p><p><strong>From:</strong> ${record.name || record.email}</p><p><strong>Type:</strong> ${record.type || 'GENERAL'}</p><p><strong>Source:</strong> ${record.source || 'website'}</p><p><strong>Message:</strong> ${record.message}</p><p>Ticket ID: ${record.ticketId}</p>`,
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

  async getTicketSummary() {
    const items = await this.prisma.supportTicket.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const summary = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      UNASSIGNED: 0,
    };

    for (const item of items) {
      const key = item.status?.toUpperCase();
      if (key && key in summary) summary[key as keyof typeof summary] = item._count.status;
      else if (item.status) summary.UNASSIGNED += item._count.status;
    }

    return {
      total: await this.prisma.supportTicket.count(),
      ...summary,
    };
  }

  async getTicket(id: number) {
    return this.prisma.supportTicket.findUnique({ where: { id } });
  }

  async updateTicket(id: number, data: Partial<CreateSupportDto & { status?: string }>) {
    // Prisma's JSON typing is strict; cast to any for flexible updates from DTO
    return this.prisma.supportTicket.update({ where: { id }, data: (data as any) });
  }
}
