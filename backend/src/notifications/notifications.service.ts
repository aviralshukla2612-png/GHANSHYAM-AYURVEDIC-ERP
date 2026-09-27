import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async findAll(role?: string) {
    const where: any = {};
    if (role && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      where.OR = [{ recipientRole: role }, { recipientRole: null }];
    }
    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { success: true, data: notifications };
  }

  async createNotification(data: {
    type: string;
    title: string;
    message: string;
    recipientRole?: string;
    recipientUserId?: string;
    priority?: string;
    entityType?: string;
    entityId?: string;
    metadata?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        recipientRole: data.recipientRole || null,
        recipientUserId: data.recipientUserId || null,
        priority: data.priority || 'NORMAL',
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        metadata: data.metadata || null,
      },
    });

    if (data.recipientRole) {
      this.gateway.emitNotificationToRole(data.recipientRole, notification);
    } else {
      this.gateway.emitGlobalEvent(notification);
    }

    return notification;
  }

  async markAsRead(id: string) {
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { success: true };
  }
}
