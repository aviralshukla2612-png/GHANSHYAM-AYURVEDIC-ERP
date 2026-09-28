import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Gstr1MapperService } from './gstr1-mapper.service';
import { roundCurrency } from './gst-config';
import {
  InvoiceReconciliationItem,
  Gstr1ReconciliationReport,
  CreditDebitNoteRow,
} from './gstr1-types';

export const GST_RECONCILIATION_TOLERANCE = 1.00; // Configurable currency tolerance threshold

@Injectable()
export class GstReconciliationService {
  constructor(
    private prisma: PrismaService,
    private mapperService: Gstr1MapperService,
  ) {}

  // 1. Invoice ↔ GST Ledger Reconciliation with Granular Status (EXACT, WITHIN_TOLERANCE, MISMATCH)
  async reconcileInvoiceVsLedger(period: string = 'September 2026'): Promise<Gstr1ReconciliationReport> {
    const invoices = await this.prisma.salesInvoice.findMany({
      include: { customer: true, items: true },
      orderBy: { invoiceNumber: 'asc' },
    });

    const returnData = await this.mapperService.mapGstr1Return(period);
    const reconciliationItems: InvoiceReconciliationItem[] = [];

    invoices.forEach((inv) => {
      // Compare Invoice Header values vs Line Item sums
      const itemsTaxable = roundCurrency(inv.items.reduce((s, it) => s + (it.totalAmount - it.taxAmount), 0));
      const itemsTax = roundCurrency(inv.items.reduce((s, it) => s + it.taxAmount, 0));

      const invTaxable = roundCurrency(inv.subtotal);
      const invTax = roundCurrency(inv.taxAmount);

      const taxableDiff = roundCurrency(Math.abs(invTaxable - itemsTaxable));
      const taxDiff = roundCurrency(Math.abs(invTax - itemsTax));
      const maxDiff = Math.max(taxableDiff, taxDiff);

      let status: InvoiceReconciliationItem['status'] = 'MATCHED';
      if (maxDiff === 0) {
        status = 'MATCHED'; // Exact match
      } else if (maxDiff <= GST_RECONCILIATION_TOLERANCE) {
        status = 'TAXABLE_MISMATCH'; // Flagged within tolerance for granular analysis
      } else {
        status = 'TAX_MISMATCH'; // Hard mismatch
      }

      reconciliationItems.push({
        invoiceNumber: inv.invoiceNumber,
        invoiceTaxable: invTaxable,
        ledgerTaxable: itemsTaxable,
        taxableDiff,
        invoiceTax: invTax,
        ledgerTax: itemsTax,
        taxDiff,
        status,
      });
    });

    // 2. GSTR-1 ↔ Sales Turnover Reconciliation
    const totalInvoiceTurnover = roundCurrency(invoices.reduce((sum, inv) => sum + inv.subtotal, 0));
    const gstr1ReportedTurnover = returnData.summary.totalTaxable;
    const turnoverVariance = roundCurrency(Math.abs(totalInvoiceTurnover - gstr1ReportedTurnover));

    const totalInvoiceTax = roundCurrency(invoices.reduce((sum, inv) => sum + inv.taxAmount, 0));
    const gstr1ReportedTax = returnData.summary.totalTax;
    const taxVariance = roundCurrency(Math.abs(totalInvoiceTax - gstr1ReportedTax));

    const unexplainedNotes: string[] = [];
    if (turnoverVariance > GST_RECONCILIATION_TOLERANCE) {
      unexplainedNotes.push(
        `Turnover mismatch of ₹${turnoverVariance.toFixed(2)} detected between Sales Invoices (₹${totalInvoiceTurnover.toFixed(2)}) and GSTR-1 (₹${gstr1ReportedTurnover.toFixed(2)}).`
      );
    }
    if (taxVariance > GST_RECONCILIATION_TOLERANCE) {
      unexplainedNotes.push(
        `Tax mismatch of ₹${taxVariance.toFixed(2)} detected between Sales Invoices (₹${totalInvoiceTax.toFixed(2)}) and GSTR-1 (₹${gstr1ReportedTax.toFixed(2)}).`
      );
    }

    return {
      period,
      status: unexplainedNotes.length > 0 ? 'UNEXPLAINED_VARIANCES' : 'RECONCILED',
      totalInvoiceTurnover,
      gstr1ReportedTurnover,
      turnoverVariance,
      totalInvoiceTax,
      gstr1ReportedTax,
      taxVariance,
      invoiceReconciliations: reconciliationItems,
      unexplainedNotes,
    };
  }

  // 3. Credit / Debit Notes Management
  async getCreditDebitNotes(period: string = 'September 2026'): Promise<CreditDebitNoteRow[]> {
    const returnData = await this.mapperService.mapGstr1Return(period);
    return returnData.creditDebitNotes;
  }
}
