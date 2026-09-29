import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { GstEngineService } from './gst-engine.service';
import { Gstr1MapperService } from './gstr1-mapper.service';
import { Gstr1ValidationService } from './gstr1-validation.service';
import { GstReconciliationService } from './gst-reconciliation.service';
import { GstExceptionsService } from './gst-exceptions.service';
import { Gstr1MetricsService } from './gstr1-metrics.service';
import { CaExportService } from './ca-export/ca-export.service';
import { ExcelGeneratorService } from './ca-export/excel-generator.service';
import { PdfGeneratorService } from './ca-export/pdf-generator.service';
import { CaExportController } from './ca-export/ca-export.controller';
import { CaReviewService } from './ca-review/ca-review.service';
import { CaReviewController } from './ca-review/ca-review.controller';
import { GspMockAdapterService } from './gstn-filing/gsp-mock-adapter.service';
import { GspProductionAdapterService } from './gstn-filing/gsp-production-adapter.service';
import { ProductionSecretService } from './gstn-filing/production-secret.service';
import { GstnPayloadMapperService } from './gstn-filing/gstn-payload-mapper.service';
import { GstnSchemaValidatorService } from './gstn-filing/gstn-schema-validator.service';
import { GstnFilingService } from './gstn-filing/gstn-filing.service';
import { GstnFilingController } from './gstn-filing/gstn-filing.controller';
import { DisasterRecoveryService } from './disaster-recovery.service';

@Module({
  providers: [
    AccountingService,
    GstEngineService,
    Gstr1MapperService,
    Gstr1ValidationService,
    GstReconciliationService,
    GstExceptionsService,
    Gstr1MetricsService,
    CaExportService,
    ExcelGeneratorService,
    PdfGeneratorService,
    CaReviewService,
    GspMockAdapterService,
    GspProductionAdapterService,
    ProductionSecretService,
    GstnPayloadMapperService,
    GstnSchemaValidatorService,
    GstnFilingService,
    DisasterRecoveryService,
  ],
  controllers: [
    AccountingController,
    CaExportController,
    CaReviewController,
    GstnFilingController,
  ],
  exports: [
    AccountingService,
    GstEngineService,
    Gstr1MapperService,
    Gstr1ValidationService,
    GstReconciliationService,
    GstExceptionsService,
    Gstr1MetricsService,
    CaExportService,
    ExcelGeneratorService,
    PdfGeneratorService,
    CaReviewService,
    GspMockAdapterService,
    GspProductionAdapterService,
    ProductionSecretService,
    GstnPayloadMapperService,
    GstnSchemaValidatorService,
    GstnFilingService,
    DisasterRecoveryService,
  ],
})
export class AccountingModule {}



