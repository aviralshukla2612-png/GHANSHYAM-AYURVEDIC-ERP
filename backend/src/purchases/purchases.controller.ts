import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  async findAll() {
    return this.purchasesService.findAll();
  }

  @Get('bills')
  async getPurchaseBills() {
    return this.purchasesService.getPurchaseBills();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Post()
  async createPO(@Body() data: any) {
    return this.purchasesService.createPO(data);
  }

  @Post('receipts')
  async createGoodsReceipt(@Body() data: any) {
    return this.purchasesService.createGoodsReceipt(data);
  }
}
