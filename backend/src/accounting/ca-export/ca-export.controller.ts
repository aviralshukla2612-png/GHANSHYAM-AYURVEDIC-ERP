import { Controller, Get, Post, Body, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { CaExportService } from './ca-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('api/accounting/ca-export')
@UseGuards(JwtAuthGuard)
export class CaExportController {
  constructor(private readonly caExportService: CaExportService) {}

  @Get('preview')
  async getPreview(@Query('period') period?: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId;
    return this.caExportService.getPreview(period, tenantId);
  }

  @Post('generate')
  async generatePackage(@Body() data: { period?: string }, @Req() req?: any) {
    const tenantId = req?.user?.organizationId || 'org-default';
    const userId = req?.user?.name || req?.user?.email || 'System Accountant';
    const result = await this.caExportService.generatePackage(data?.period, userId, tenantId);
    return { success: true, message: 'CA Review Package generated successfully', data: result };
  }

  @Get(':id')
  async getPackage(@Param('id') id: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId;
    const pkg = await this.caExportService.getPackage(id, tenantId);
    return { success: true, data: pkg };
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id') id: string,
    @Query('file') file?: string,
    @Req() req?: any,
    @Res() res?: Response
  ) {
    const tenantId = req?.user?.organizationId;
    const { buffer, mimeType, filename } = await this.caExportService.downloadFile(id, file, tenantId);

    res?.setHeader('Content-Type', mimeType);
    res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res?.send(buffer);
  }
}
