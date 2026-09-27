import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.inventoryService.getDashboard();
  }

  @Get('transactions')
  async getTransactions(@Query() query: any) {
    return this.inventoryService.getTransactions(query);
  }

  @Post('transactions')
  async recordTransaction(@Body() data: any, @Req() req: any) {
    return this.inventoryService.recordTransaction({
      ...data,
      performedBy: req.user?.name || 'Stock Manager',
    });
  }

  @Post('adjustment')
  async recordAdjustment(@Body() data: any, @Req() req: any) {
    return this.inventoryService.recordTransaction({
      ...data,
      performedBy: req.user?.name || 'Stock Manager',
    });
  }
}
