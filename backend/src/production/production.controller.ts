import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/production')
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.productionService.getDashboard();
  }

  @Get('requests')
  async getRequests() {
    return this.productionService.getRequests();
  }

  @Post('requests')
  async createProductionRequest(@Body() data: any) {
    return this.productionService.createProductionRequest(data);
  }

  @Get('batches')
  async getBatches() {
    return this.productionService.getBatches();
  }

  @Get('batches/trace/:id')
  async getBatchTraceability(@Param('id') id: string) {
    return this.productionService.getBatchTraceability(id);
  }

  @Get('wastage')
  async getWastage() {
    return this.productionService.getWastage();
  }

  @Get('analytics')
  async getAnalytics() {
    return this.productionService.getAnalytics();
  }

  @Get('orders')
  async findAll() {
    return this.productionService.findAll();
  }

  @Get('orders/:id')
  async findOne(@Param('id') id: string) {
    return this.productionService.findOne(id);
  }

  @Post('orders')
  async createOrder(@Body() data: any) {
    return this.productionService.createOrder(data);
  }

  @Post('orders/:id/start')
  async startProduction(@Param('id') id: string) {
    return this.productionService.startProduction(id);
  }

  @Post('orders/:id/record-waste')
  async recordWastage(@Param('id') id: string, @Body() data: any) {
    return this.productionService.recordWastage(id, data);
  }

  @Post('orders/:id/quality-check')
  async recordQualityCheck(@Param('id') id: string, @Body() data: any) {
    return this.productionService.recordQualityCheck(id, data);
  }

  @Post('orders/:id/complete')
  async completeProduction(@Param('id') id: string, @Body() data: any) {
    return this.productionService.completeProduction(id, data);
  }
}
