import { Module } from '@nestjs/common';
import { RawMaterialsService } from './raw-materials.service';
import { RawMaterialsController } from './raw-materials.controller';

@Module({
  providers: [RawMaterialsService],
  controllers: [RawMaterialsController],
  exports: [RawMaterialsService],
})
export class RawMaterialsModule {}
