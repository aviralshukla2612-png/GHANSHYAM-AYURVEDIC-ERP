import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.salesService.getDashboard();
  }

  @Get('orders')
  async findAll() {
    return this.salesService.findAll();
  }

  @Get('orders/:id')
  async findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post('orders')
  async createOrder(@Body() data: any) {
    return this.salesService.createOrder(data);
  }
}
