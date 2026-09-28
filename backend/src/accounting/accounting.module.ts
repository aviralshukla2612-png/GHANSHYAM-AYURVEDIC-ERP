import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { GstEngineService } from './gst-engine.service';

@Module({
  providers: [AccountingService, GstEngineService],
  controllers: [AccountingController],
  exports: [AccountingService, GstEngineService],
})
export class AccountingModule {}

