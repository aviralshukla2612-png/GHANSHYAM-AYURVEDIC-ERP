import { Module } from '@nestjs/common';
import { RawMaterialRequestsService } from './raw-material-requests.service';
import { RawMaterialRequestsController } from './raw-material-requests.controller';

@Module({
  providers: [RawMaterialRequestsService],
  controllers: [RawMaterialRequestsController],
  exports: [RawMaterialRequestsService],
})
export class RawMaterialRequestsModule {}
