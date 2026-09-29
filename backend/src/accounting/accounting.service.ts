import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GstEngineService } from './gst-engine.service';
import { Gstr1MapperService } from './gstr1-mapper.service';
import { Gstr1ValidationService } from './gstr1-validation.service';
import { GstReconciliationService } from './gst-reconciliation.service';
import { GstExceptionsService } from './gst-exceptions.service';
import { Gstr1MetricsService } from './gstr1-metrics.service';
import { roundCurrency } from './gst-config';

@Injectable()
export class AccountingService {
  constructor(
    private prisma: PrismaService,
    private gstEngine: GstEngineService,
    private mapperService: Gstr1MapperService,
    private validationService: Gstr1ValidationService,
    private reconciliationService: GstReconciliationService,
    private exceptionsService: GstExceptionsService,
    private metricsService: Gstr1MetricsService,
  ) {}

  async autoProvisionInvoices() {
    const orders = await this.prisma.salesOrder.findMany({
      where: {
        status: { in: ['DISPATCHED', 'DELIVERED', 'READY_FOR_DISPATCH'] },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        invoices: true,
      },
    });

    for (const order of orders) {
      if (!order.invoices || order.invoices.length === 0) {
        const invNo = `INV-2026-${order.orderNumber.replace('SO-', '')}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const subtotal = order.subtotal || order.totalAmount / 1.12;

        // Use GstEngine to calculate CGST, SGST, IGST based on customer state
        const state = order.customer?.state || 'Gujarat';
        const pincode = order.customer?.pincode || '24';
        const stateCode = pincode.length >= 2 ? pincode.slice(0, 2) : '24';
        const taxRes = this.gstEngine.calculateTax(subtotal, 12.0, stateCode, state);

        await this.prisma.salesInvoice.create({
          data: {
            invoiceNumber: invNo,
            salesOrderId: order.id,
            customerId: order.customerId,
            invoiceDate: new Date(),
            dueDate,
            subtotal: Number(subtotal.toFixed(2)),
            taxAmount: taxRes.totalTax,
            cgstAmount: taxRes.cgstAmount,
            sgstAmount: taxRes.sgstAmount,
            igstAmount: taxRes.igstAmount,
            discount: order.discount || 0,
            totalAmount: order.totalAmount,
            paidAmount: 0,
            balanceAmount: order.totalAmount,
            status: order.status === 'DELIVERED' ? 'ISSUED' : 'UNPAID',
            items: {
              create: order.items.map((it) => ({
                productId: it.productId,
                batchNumber: 'KAY-2026-2633',
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                gstRate: it.gstRate || 12.0,
                taxAmount: Number((it.totalAmount - (it.quantity * it.unitPrice)).toFixed(2)) || Number((it.totalAmount * 0.12).toFixed(2)),
                totalAmount: it.totalAmount,
              })),
            },
          },
        }).catch(() => null);
      }
    }
  }

  async getDashboard() {
    await this.autoProvisionInvoices();
    const invoices = await this.prisma.salesInvoice.findMany();
    const purchases = await this.prisma.purchaseOrder.findMany();
    const expenses = await this.prisma.expense.findMany();

    const totalRevenue = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const totalPurchases = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    const grossProfit = totalRevenue - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    const receivables = invoices
      .filter((i) => i.status !== 'PAID')
      .reduce((acc, i) => acc + i.balanceAmount, 0);
    const payables = 185000;

    const gstSummary = {
      cgst: Number((totalRevenue * 0.06).toFixed(2)),
      sgst: Number((totalRevenue * 0.06).toFixed(2)),
      igst: 0,
      totalTax: Number((totalRevenue * 0.12).toFixed(2)),
    };

    return {
      success: true,
      data: {
        totalRevenue,
        totalPurchases,
        grossProfit,
        netProfit,
        totalExpenses,
        receivables,
        payables,
        gstSummary,
      },
    };
  }

  async getProductProfitability() {
    const products = await this.prisma.product.findMany({
      include: {
        boms: {
          where: { isActive: true },
          include: { bomItems: { include: { rawMaterial: true } } },
        },
      },
    });

    const profitability = products.map((prod) => {
      const bom = prod.boms[0];
      let rmCostPerYield = 0;
      if (bom) {
        rmCostPerYield = bom.bomItems.reduce(
          (acc, item) => acc + item.quantity * (item.rawMaterial.purchasePrice || 10),
          0
        );
      }
      const yieldQty = bom ? bom.expectedYield : 100;
      const unitRMCost = yieldQty > 0 ? rmCostPerYield / yieldQty : 25;
      const packagingCost = 8.5;
      const totalUnitCost = unitRMCost + packagingCost;

      const sellingPrice = prod.b2bPrice || prod.mrp;
      const grossProfitPerUnit = sellingPrice - totalUnitCost;
      const marginPercentage = sellingPrice > 0 ? (grossProfitPerUnit / sellingPrice) * 100 : 0;

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        sellingPrice,
        unitRawMaterialCost: Number(unitRMCost.toFixed(2)),
        unitPackagingCost: packagingCost,
        totalUnitCost: Number(totalUnitCost.toFixed(2)),
        grossProfitPerUnit: Number(grossProfitPerUnit.toFixed(2)),
        marginPercentage: Number(marginPercentage.toFixed(2)),
      };
    });

    return { success: true, data: profitability };
  }

  async getInvoices() {
    await this.autoProvisionInvoices();
    const invoices = await this.prisma.salesInvoice.findMany({
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: invoices };
  }

  async getExpenses() {
    const expenses = await this.prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: expenses };
  }

  async createExpense(data: { category: string; amount: number; description: string; vendorName?: string }) {
    const expenseNo = `EXP-${Date.now().toString().slice(-6)}`;
    const expense = await this.prisma.expense.create({
      data: {
        expenseNo,
        category: data.category,
        amount: Number(data.amount),
        description: data.description,
        vendorName: data.vendorName,
      },
    });
    return { success: true, message: 'Expense logged successfully', data: expense };
  }

  async validateGST(period: string = 'September 2026', tenantId?: string) {
    const startTime = Date.now();
    const report = await this.validationService.validateGstr1Return(period, tenantId);
    this.metricsService.recordMetric('GSTR1_AUDIT_TIME', Date.now() - startTime);
    return {
      success: true,
      data: report,
    };
  }

  async getGSTR1(period: string = 'September 2026', tenantId?: string) {
    const startTime = Date.now();
    const returnData = await this.mapperService.mapGstr1Return(period, tenantId);
    this.metricsService.recordMetric('GSTR1_GENERATION_TIME', Date.now() - startTime);
    return {
      success: true,
      data: returnData,
    };
  }

  async createSnapshot(period: string = 'September 2026', userId: string = 'System Accountant', userRole: string = 'MANAGER', tenantId?: string) {
    const snapshot = await this.validationService.createSnapshot(period, userId, userRole, tenantId);
    this.metricsService.recordMetric('GSTR1_SNAPSHOT_COUNT', 1);
    return {
      success: true,
      message: 'Immutable GSTR-1 snapshot created successfully & return period locked',
      data: snapshot,
    };
  }

  async getSnapshots(period: string = 'September 2026', tenantId?: string) {
    const snapshots = await this.validationService.getSnapshots(period, tenantId);
    return {
      success: true,
      data: snapshots,
    };
  }

  async reconcileGSTR1(period: string = 'September 2026') {
    const startTime = Date.now();
    const report = await this.reconciliationService.reconcileInvoiceVsLedger(period);
    this.metricsService.recordMetric('GSTR1_RECONCILIATION_TIME', Date.now() - startTime);
    return {
      success: true,
      data: report,
    };
  }

  async getCreditDebitNotes(period: string = 'September 2026') {
    const cdnr = await this.reconciliationService.getCreditDebitNotes(period);
    return {
      success: true,
      data: cdnr,
    };
  }

  async getExceptions(period: string = 'September 2026', tenantId?: string) {
    const summary = await this.exceptionsService.getExceptions(period, tenantId);
    return {
      success: true,
      data: summary,
    };
  }

  async resolveException(id: string, notes?: string) {
    const result = this.exceptionsService.resolveException(id, notes);
    return result;
  }

  async getMetrics() {
    return {
      success: true,
      data: this.metricsService.getMetrics(),
    };
  }

  async lockPeriod(period: string = 'September 2026', userRole: string = 'MANAGER') {
    const result = this.validationService.lockPeriod(period, userRole);
    return { success: true, message: `Period ${period} locked successfully`, data: result };
  }

  async unfreezePeriod(period: string = 'September 2026', userRole: string = 'ADMIN') {
    const result = this.validationService.unfreezePeriod(period, userRole);
    return { success: true, message: `Period ${period} unfrozen successfully`, data: result };
  }

  async getProcurementFinances() {
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: { include: { rawMaterial: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingRequests = await this.prisma.rawMaterialPurchaseRequest.findMany({
      where: { status: { notIn: ['ORDERED', 'RECEIVED', 'RESOLVED'] } },
      include: { items: { include: { rawMaterial: true } }, supplier: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalPOValue = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const totalReceivedValue = purchaseOrders
      .filter((po) => po.status === 'RECEIVED')
      .reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const pendingCommitment = pendingRequests.reduce(
      (sum, req) => sum + (req.estimatedCost || 0),
      0
    );

    return {
      success: true,
      data: {
        totalPOValue,
        totalReceivedValue,
        pendingCommitment,
        purchaseOrders,
        pendingRequests,
      },
    };
  }
}

