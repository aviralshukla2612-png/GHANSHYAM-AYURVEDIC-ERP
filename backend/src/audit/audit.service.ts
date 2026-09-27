import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const logs = await this.prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return { success: true, data: logs };
  }
}
