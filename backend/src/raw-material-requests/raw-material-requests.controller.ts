import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { RawMaterialRequestsService } from './raw-material-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/raw-material-requests')
@UseGuards(JwtAuthGuard)
export class RawMaterialRequestsController {
  constructor(private readonly rmRequestsService: RawMaterialRequestsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.rmRequestsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rmRequestsService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.rmRequestsService.create({
      ...data,
      requestedById: req.user.id,
    });
  }

  @Post(':id/convert-po')
  async convertToPO(@Param('id') id: string, @Req() req: any) {
    return this.rmRequestsService.convertToPurchaseOrder(id, req.user);
  }
}
