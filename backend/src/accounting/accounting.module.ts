import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { GstEngineService } from './gst-engine.service';
import { Gstr1MapperService } from './gstr1-mapper.service';
import { Gstr1ValidationService } from './gstr1-validation.service';
import { GstReconciliationService } from './gst-reconciliation.service';

@Module({
  providers: [AccountingService, GstEngineService, Gstr1MapperService, Gstr1ValidationService, GstReconciliationService],
  controllers: [AccountingController],
  exports: [AccountingService, GstEngineService, Gstr1MapperService, Gstr1ValidationService, GstReconciliationService],
})
export class AccountingModule {}



