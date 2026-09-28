import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
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
  async validateGST(@Body() data: { period?: string }) {
    return this.accountingService.validateGST(data?.period);
  }

  @Get('gstr1')
  async getGSTR1() {
    return this.accountingService.getGSTR1();
  }

  @Get('procurement-finances')
  async getProcurementFinances() {
    return this.accountingService.getProcurementFinances();
  }
}
