import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GstExceptionItem, GstExceptionSummary } from './gstr1-types';

@Injectable()
export class GstExceptionsService {
  private resolvedExceptionIds: Set<string> = new Set();
  private auditLogViolations: Array<{ id: string; period: string; details: string; date: string }> = [];

  constructor(private prisma: PrismaService) {}

  // Record an unauthorized modification attempt on a period-locked return
  recordPeriodLockedViolation(period: string, details: string) {
    this.auditLogViolations.push({
      id: `EXC-LOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      period,
      details,
      date: new Date().toISOString(),
    });
  }

  async getExceptions(period: string = 'September 2026', tenantId?: string): Promise<GstExceptionSummary> {
    // Scoped query for multi-tenancy if organizationId is present in DB or filtering
    const invoiceWhere: any = {};
    const invoices = await this.prisma.salesInvoice.findMany({
      where: invoiceWhere,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    const exceptions: GstExceptionItem[] = [];

    // 1. Check for B2B missing or invalid GSTIN format
    invoices.forEach((inv) => {
      const isB2B = inv.customer?.customerType === 'B2B';
      const gstin = inv.customer?.gstin?.trim();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

      if (isB2B && !gstin) {
        exceptions.push({
          id: `EXC-GSTIN-${inv.id}`,
          code: 'ERR_GSTIN_MISMATCH',
          severity: 'CRITICAL',
          status: this.resolvedExceptionIds.has(`EXC-GSTIN-${inv.id}`) ? 'RESOLVED' : 'UNRESOLVED',
          entityNumber: inv.invoiceNumber,
          message: `Invoice ${inv.invoiceNumber} customer '${inv.customer?.name}' is B2B but missing GSTIN.`,
          resolutionUrl: `/dashboard/sales/customers?id=${inv.customerId}`,
          detectedAt: inv.createdAt.toISOString(),
        });
      } else if (gstin && !gstinRegex.test(gstin)) {
        exceptions.push({
          id: `EXC-GSTIN-FMT-${inv.id}`,
          code: 'ERR_GSTIN_FORMAT_INVALID',
          severity: 'CRITICAL',
          status: this.resolvedExceptionIds.has(`EXC-GSTIN-FMT-${inv.id}`) ? 'RESOLVED' : 'UNRESOLVED',
          entityNumber: inv.invoiceNumber,
          message: `Customer '${inv.customer?.name}' has invalid GSTIN format '${gstin}'.`,
          resolutionUrl: `/dashboard/sales/customers?id=${inv.customerId}`,
          detectedAt: inv.createdAt.toISOString(),
        });
      }
    });

    // 2. Check for missing HSN codes in invoice items
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!item.product?.hsnCode) {
          exceptions.push({
            id: `EXC-HSN-${inv.id}-${item.id}`,
            code: 'ERR_HSN_MISSING',
            severity: 'CRITICAL',
            status: this.resolvedExceptionIds.has(`EXC-HSN-${inv.id}-${item.id}`) ? 'RESOLVED' : 'UNRESOLVED',
            entityNumber: inv.invoiceNumber,
            message: `Invoice ${inv.invoiceNumber} item '${item.product?.name}' has missing HSN code.`,
            resolutionUrl: `/dashboard/products?id=${item.productId}`,
            detectedAt: inv.createdAt.toISOString(),
          });
        }
      });
    });

    // 3. Check for GST Ledger Mismatch
    invoices.forEach((inv) => {
      const calculatedTotalTax = inv.cgstAmount + inv.sgstAmount + inv.igstAmount;
      if (Math.abs(calculatedTotalTax - inv.taxAmount) > 1.0) {
        exceptions.push({
          id: `EXC-LEDGER-${inv.id}`,
          code: 'ERR_GST_LEDGER_MISMATCH',
          severity: 'CRITICAL',
          status: this.resolvedExceptionIds.has(`EXC-LEDGER-${inv.id}`) ? 'RESOLVED' : 'UNRESOLVED',
          entityNumber: inv.invoiceNumber,
          message: `Invoice ${inv.invoiceNumber} header tax (₹${inv.taxAmount}) does not match component tax sum (₹${calculatedTotalTax}).`,
          resolutionUrl: `/dashboard/accounting/invoices?id=${inv.id}`,
          detectedAt: inv.createdAt.toISOString(),
        });
      }
    });

    // 4. Period Lock Violation Exceptions
    this.auditLogViolations
      .filter((v) => v.period === period)
      .forEach((v) => {
        exceptions.push({
          id: v.id,
          code: 'ERR_PERIOD_LOCKED_ATTEMPT',
          severity: 'WARNING',
          status: this.resolvedExceptionIds.has(v.id) ? 'RESOLVED' : 'UNRESOLVED',
          entityNumber: 'PERIOD-LOCK',
          message: v.details,
          resolutionUrl: '/dashboard/accounting/gstr1?tab=lock',
          detectedAt: v.date,
        });
      });

    const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length;
    const warningCount = exceptions.filter((e) => e.severity === 'WARNING' && e.status !== 'RESOLVED').length;
    const resolvedCount = exceptions.filter((e) => e.status === 'RESOLVED').length;

    return {
      criticalCount,
      warningCount,
      resolvedCount,
      totalCount: exceptions.length,
      exceptions,
    };
  }

  resolveException(id: string, notes?: string): { success: boolean; message: string } {
    this.resolvedExceptionIds.add(id);
    return {
      success: true,
      message: `Exception '${id}' marked as RESOLVED. ${notes ? `Notes: ${notes}` : ''}`,
    };
  }
}
