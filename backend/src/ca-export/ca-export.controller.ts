import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CAExportService } from './ca-export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/ca-export')
@UseGuards(JwtAuthGuard)
export class CAExportController {
  constructor(private readonly caExportService: CAExportService) {}

  @Get()
  async getHistory() {
    return this.caExportService.getHistory();
  }

  @Post('send-whatsapp')
  async sendWhatsApp(@Body() body: { period?: string; caPhone?: string }, @Req() req: any) {
    const period = body.period || 'September 2026';
    return this.caExportService.generateAndSendPackage(period, req.user.id, body.caPhone);
  }

  @Post(':id/retry')
  async retrySend(@Param('id') id: string) {
    return this.caExportService.retrySend(id);
  }
}
