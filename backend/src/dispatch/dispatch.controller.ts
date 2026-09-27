import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/dispatch')
@UseGuards(JwtAuthGuard)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get()
  async findAll() {
    return this.dispatchService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dispatchService.findOne(id);
  }

  @Post()
  async createDispatch(@Body() data: any) {
    return this.dispatchService.createDispatch(data);
  }

  @Post(':id/deliver')
  async confirmDelivery(@Param('id') id: string, @Body() data: any) {
    return this.dispatchService.confirmDelivery(id, data);
  }
}
