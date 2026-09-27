import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async checkHealth() {
    const start = Date.now();
    let dbConnected = false;
    let dbLatency = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      dbLatency = Date.now() - start;
    } catch (e) {
      dbConnected = false;
    }

    return {
      status: dbConnected ? 'healthy' : 'degraded',
      api: true,
      database: dbConnected,
      dbLatencyMs: dbLatency,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
