import { Injectable } from '@nestjs/common';
import { CURRENT_GST_CONFIG, GSTRulesConfig, roundCurrency } from './gst-config';

export interface TaxCalculationResult {
  isInterState: boolean;
  taxableValue: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface GSTR1Classification {
  gstrSection: 'TABLE_4_B2B' | 'TABLE_5_B2CL' | 'TABLE_6_EXPORT' | 'TABLE_7_B2CS' | 'TABLE_9_CDNR';
  sectionLabel: string;
}

@Injectable()
export class GstEngineService {
  private config: GSTRulesConfig = CURRENT_GST_CONFIG;

  getConfig(): GSTRulesConfig {
    return this.config;
  }

  // 1. Determine Place of Supply & Tax Split (CGST+SGST vs IGST)
  calculateTax(taxableValue: number, gstRate: number, customerStateCode?: string, customerState?: string): TaxCalculationResult {
    const isInterState = Boolean(
      (customerStateCode && customerStateCode !== this.config.companyStateCode) ||
      (customerState && customerState.toLowerCase() !== this.config.companyState.toLowerCase())
    );

    const safeTaxable = roundCurrency(taxableValue);
    const totalTax = roundCurrency((safeTaxable * gstRate) / 100);

    if (isInterState) {
      return {
        isInterState: true,
        taxableValue: safeTaxable,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: gstRate,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: totalTax,
        totalTax,
        totalAmount: roundCurrency(safeTaxable + totalTax),
      };
    } else {
      const halfRate = gstRate / 2;
      const halfTax = roundCurrency(totalTax / 2);
      return {
        isInterState: false,
        taxableValue: safeTaxable,
        cgstRate: halfRate,
        sgstRate: halfRate,
        igstRate: 0,
        cgstAmount: halfTax,
        sgstAmount: halfTax,
        igstAmount: 0,
        totalTax: roundCurrency(halfTax * 2),
        totalAmount: roundCurrency(safeTaxable + halfTax * 2),
      };
    }
  }

  // 2. Classify Sales Invoice for GSTR-1 Projection
  // Aug 2024 Rule: B2C Large applies to Inter-state supplies to unregistered customers > ₹1,00,000 invoice value
  classifyGstr1Invoice(invoice: {
    customerGstin?: string | null;
    isInterState: boolean;
    totalAmount: number;
    customerType?: string;
  }): GSTR1Classification {
    const hasValidGstin = Boolean(invoice.customerGstin && invoice.customerGstin.trim().length === 15);

    if (invoice.customerType === 'EXPORT') {
      return { gstrSection: 'TABLE_6_EXPORT', sectionLabel: 'Table 6: Exports Outward Supplies' };
    }

    if (hasValidGstin) {
      return { gstrSection: 'TABLE_4_B2B', sectionLabel: 'Table 4: B2B Invoices (Registered)' };
    }

    // Unregistered Customer (B2C)
    if (invoice.isInterState && invoice.totalAmount > this.config.b2cLargeThreshold) {
      return { gstrSection: 'TABLE_5_B2CL', sectionLabel: 'Table 5: B2C Large Invoices (> ₹1 Lakh Inter-state)' };
    }

    return { gstrSection: 'TABLE_7_B2CS', sectionLabel: 'Table 7: B2C Others / Small Invoices' };
  }
}
