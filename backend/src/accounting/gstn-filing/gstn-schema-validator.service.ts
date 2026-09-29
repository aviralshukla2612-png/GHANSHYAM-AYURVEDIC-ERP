import { Injectable } from '@nestjs/common';
import { GstnGstr1Payload } from './gstn-filing.types';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class GstnSchemaValidatorService {
  private errorCatalog: Record<string, string> = {
    RET0001: 'Invalid Gross Turnover value in payload header.',
    RET0002: 'Duplicate invoice number already submitted to GSTN portal.',
    GSTIN_INACTIVE: 'Customer/Supplier GSTIN is cancelled, suspended, or inactive on GSTN portal.',
    HSN_INVALID: 'HSN code specified is invalid according to official 8-digit GST tariff schema.',
    POS_INVALID: 'Place of Supply state code does not match official 2-digit Indian State Code list.',
    RET9999: 'System timeout or internal GSTN server connection failure.',
  };

  validateGstnPayload(payload: GstnGstr1Payload): SchemaValidationResult {
    const errors: string[] = [];

    // GSTIN format check
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!payload.gstin || !gstinRegex.test(payload.gstin)) {
      errors.push(`Invalid supplier GSTIN format '${payload.gstin}'. Expected 15-character GSTIN.`);
    }

    // Financial Period check (MMYYYY)
    if (!payload.fp || !/^(0[1-9]|1[0-2])[0-9]{4}$/.test(payload.fp)) {
      errors.push(`Invalid financial period '${payload.fp}'. Expected MMYYYY format e.g. 092026.`);
    }

    // Gross Turnover non-negative check
    if (typeof payload.gt !== 'number' || payload.gt < 0) {
      errors.push(`Invalid gross turnover '${payload.gt}'. Must be a non-negative number.`);
    }

    // B2B Section check
    payload.b2b?.forEach((b) => {
      if (b.ctin && !gstinRegex.test(b.ctin)) {
        errors.push(`B2B Section: Receiver GSTIN '${b.ctin}' format is invalid.`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  mapGstnError(errorCode?: string, fallbackMessage?: string): { code: string; message: string; resolutionUrl: string } {
    const code = errorCode || 'UNKNOWN_ERROR';
    const message = this.errorCatalog[code] || fallbackMessage || 'Unclassified error received from GSTN/GSP server.';

    let resolutionUrl = '/dashboard/accounting/gstr1';
    if (code === 'GSTIN_INACTIVE') resolutionUrl = '/dashboard/sales/customers';
    if (code === 'HSN_INVALID') resolutionUrl = '/dashboard/products';
    if (code === 'RET0002') resolutionUrl = '/dashboard/accounting/invoices';

    return {
      code,
      message,
      resolutionUrl,
    };
  }
}
