import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.accountingService.getDashboard();
  }

  @Get('product-profit')
  async getProductProfitability() {
    return this.accountingService.getProductProfitability();
  }

  @Get('invoices')
  async getInvoices() {
    return this.accountingService.getInvoices();
  }

  @Get('expenses')
  async getExpenses() {
    return this.accountingService.getExpenses();
  }

  @Post('expenses')
  async createExpense(@Body() data: any) {
    return this.accountingService.createExpense(data);
  }

  @Post('gst/validate')
  async validateGST(@Body() data: { period?: string }, @Req() req: any) {
    const tenantId = req?.user?.organizationId;
    return this.accountingService.validateGST(data?.period, tenantId);
  }

  @Get('gstr1')
  async getGSTR1(@Query('period') period?: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId;
    return this.accountingService.getGSTR1(period, tenantId);
  }

  @Post('gstr1/snapshot')
  async createSnapshot(@Body() data: { period?: string; userId?: string }, @Req() req?: any) {
    const tenantId = req?.user?.organizationId;
    const userRole = req?.user?.role || req?.user?.userRoles?.[0]?.role?.name || 'MANAGER';
    return this.accountingService.createSnapshot(data?.period, data?.userId, userRole, tenantId);
  }

  @Get('gstr1/snapshots')
  async getSnapshots(@Query('period') period?: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId;
    return this.accountingService.getSnapshots(period, tenantId);
  }

  @Get('gstr1/reconcile')
  async reconcileGSTR1(@Query('period') period?: string) {
    return this.accountingService.reconcileGSTR1(period);
  }

  @Get('gstr1/exceptions')
  async getExceptions(@Query('period') period?: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId;
    return this.accountingService.getExceptions(period, tenantId);
  }

  @Post('gstr1/exceptions/:id/resolve')
  async resolveException(@Param('id') id: string, @Body() data: { notes?: string }) {
    return this.accountingService.resolveException(id, data?.notes);
  }

  @Get('gstr1/metrics')
  async getMetrics() {
    return this.accountingService.getMetrics();
  }

  @Post('gstr1/lock')
  async lockPeriod(@Body() data: { period?: string }, @Req() req?: any) {
    const userRole = req?.user?.role || req?.user?.userRoles?.[0]?.role?.name || 'MANAGER';
    return this.accountingService.lockPeriod(data?.period, userRole);
  }

  @Post('gstr1/unfreeze')
  async unfreezePeriod(@Body() data: { period?: string }, @Req() req?: any) {
    const userRole = req?.user?.role || req?.user?.userRoles?.[0]?.role?.name || 'ADMIN';
    return this.accountingService.unfreezePeriod(data?.period, userRole);
  }

  @Get('credit-debit-notes')
  async getCreditDebitNotes(@Query('period') period?: string) {
    return this.accountingService.getCreditDebitNotes(period);
  }

  @Get('procurement-finances')
  async getProcurementFinances() {
    return this.accountingService.getProcurementFinances();
  }
}


