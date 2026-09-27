import { Module } from '@nestjs/common';
import { BOMService } from './bom.service';
import { BOMController } from './bom.controller';

@Module({
  providers: [BOMService],
  controllers: [BOMController],
  exports: [BOMService],
})
export class BOMModule {}
