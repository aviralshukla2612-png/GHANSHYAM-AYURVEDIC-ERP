import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { RawMaterialsService } from './raw-materials.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/raw-materials')
@UseGuards(JwtAuthGuard)
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.rawMaterialsService.findAll(query);
  }

  @Get('categories')
  async getCategories() {
    return this.rawMaterialsService.getCategories();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rawMaterialsService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.rawMaterialsService.create(data);
  }
}
