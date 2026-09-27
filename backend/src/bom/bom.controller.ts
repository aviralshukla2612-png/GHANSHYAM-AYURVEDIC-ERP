import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { BOMService } from './bom.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/bom')
@UseGuards(JwtAuthGuard)
export class BOMController {
  constructor(private readonly bomService: BOMService) {}

  @Get()
  async findAll() {
    return this.bomService.findAll();
  }

  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string) {
    return this.bomService.findByProduct(productId);
  }

  @Post()
  async create(@Body() data: any) {
    return this.bomService.create(data);
  }
}
