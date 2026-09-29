import { Injectable, Logger } from '@nestjs/common';
import { Gstr1Metrics } from './gstr1-types';

@Injectable()
export class Gstr1MetricsService {
  private readonly logger = new Logger(Gstr1MetricsService.name);

  private metrics: Gstr1Metrics = {
    GSTR1_GENERATION_TIME: 45,
    GSTR1_AUDIT_TIME: 18,
    GSTR1_RECONCILIATION_TIME: 22,
    GSTR1_SNAPSHOT_COUNT: 0,
    GSTR1_VALIDATION_FAILURES: 0,
    GSTR1_EXPORT_FAILURES: 0,
    GSTN_SUBMISSION_SUCCESS: 0,
    GSTN_SUBMISSION_FAILURE: 0,
    GSTN_REJECTION_COUNT: 0,
    GSTN_POLLING_FAILURE: 0,
    GSTN_RESPONSE_TIME: 120,
  };

  recordMetric(key: keyof Gstr1Metrics, value: number) {
    const counterKeys: Array<keyof Gstr1Metrics> = [
      'GSTR1_SNAPSHOT_COUNT',
      'GSTR1_VALIDATION_FAILURES',
      'GSTR1_EXPORT_FAILURES',
      'GSTN_SUBMISSION_SUCCESS',
      'GSTN_SUBMISSION_FAILURE',
      'GSTN_REJECTION_COUNT',
      'GSTN_POLLING_FAILURE',
    ];

    if (counterKeys.includes(key)) {
      this.metrics[key] += value;
    } else {
      this.metrics[key] = value;
    }
  }

  getMetrics(): Gstr1Metrics {
    return { ...this.metrics };
  }

  logStructuredError(correlationId: string, operation: string, error: any, metadata: Record<string, any> = {}) {
    this.logger.error(
      JSON.stringify({
        correlationId,
        timestamp: new Date().toISOString(),
        operation,
        errorMessage: error.message || String(error),
        stack: error.stack,
        ...metadata,
      })
    );
  }

  logStructuredInfo(correlationId: string, operation: string, metadata: Record<string, any> = {}) {
    this.logger.log(
      JSON.stringify({
        correlationId,
        timestamp: new Date().toISOString(),
        operation,
        ...metadata,
      })
    );
  }
}
