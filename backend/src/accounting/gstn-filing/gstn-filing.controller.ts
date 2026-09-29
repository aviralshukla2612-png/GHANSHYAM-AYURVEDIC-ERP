import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { GstnFilingService } from './gstn-filing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/accounting/gstn-filing')
@UseGuards(JwtAuthGuard)
export class GstnFilingController {
  constructor(private readonly gstnFilingService: GstnFilingService) {}

  @Get('prepare')
  async prepareFiling(@Query('period') period?: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId || 'org-default';
    const result = await this.gstnFilingService.prepareFiling(period, tenantId);
    return { success: true, data: result };
  }

  @Post('submit')
  async submitFiling(@Body() data: { period?: string }, @Req() req?: any) {
    const tenantId = req?.user?.organizationId || 'org-default';
    const userId = req?.user?.name || req?.user?.email || 'System Accountant';
    const filing = await this.gstnFilingService.submitFiling(data?.period, userId, tenantId);
    return { success: true, message: 'GSTR-1 payload submitted to GSTN portal', data: filing };
  }

  @Post(':id/poll')
  async pollFilingStatus(@Param('id') id: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId || 'org-default';
    const filing = await this.gstnFilingService.pollFilingStatus(id, tenantId);
    return { success: true, message: `GSTN status polled: ${filing.status}`, data: filing };
  }

  @Get('history')
  async getFilingHistory(@Query('period') period?: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId || 'org-default';
    const history = await this.gstnFilingService.getFilingHistory(period, tenantId);
    return { success: true, data: history };
  }
}
