import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/system')
@UseGuards(JwtAuthGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async getHealthStatus() {
    return this.systemService.getHealthStatus();
  }

  @Get('integrity')
  async getWorkflowIntegrity() {
    return this.systemService.getWorkflowIntegrity();
  }

  @Post('integrity/run')
  async runConsistencyScan() {
    return this.systemService.runConsistencyScan();
  }

  @Get('trace/:id')
  async traceTransaction(@Param('id') id: string) {
    return this.systemService.traceTransaction(id);
  }

  @Post('ai-query')
  async queryERPIntelligence(@Body() body: { query: string }) {
    return this.systemService.queryERPIntelligence(body.query || '');
  }
}
