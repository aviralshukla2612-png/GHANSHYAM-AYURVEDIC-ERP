import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RawMaterialRequestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { status?: string; priority?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;

    const requests = await this.prisma.rawMaterialPurchaseRequest.findMany({
      where,
      include: {
        salesOrder: { include: { customer: true } },
        productionRequest: { include: { product: true } },
        supplier: true,
        requestedBy: true,
        approvedBy: true,
        items: { include: { rawMaterial: true } },
        purchaseOrders: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: requests };
  }

  async findOne(id: string) {
    const request = await this.prisma.rawMaterialPurchaseRequest.findUnique({
      where: { id },
      include: {
        salesOrder: { include: { customer: true } },
        productionRequest: { include: { product: true } },
        supplier: true,
        requestedBy: true,
        approvedBy: true,
        items: { include: { rawMaterial: true } },
        purchaseOrders: { include: { supplier: true, receipts: true } },
      },
    });

    if (!request) throw new NotFoundException('Raw Material Purchase Request not found');
    return { success: true, data: request };
  }

  async create(data: {
    salesOrderId?: string;
    productionRequestId?: string;
    supplierId?: string;
    requestedById: string;
    priority?: string;
    requiredDate: string;
    reason?: string;
    items: Array<{
      rawMaterialId: string;
      requiredQuantity: number;
      availableQuantity: number;
      shortageQuantity: number;
      unit: string;
      estimatedRate?: number;
    }>;
  }) {
    const requestNo = `RM-REQ-${Date.now().toString().slice(-6)}`;
    const itemsData = data.items.map((it) => {
      const rate = it.estimatedRate || 100;
      const totalCost = it.shortageQuantity * rate;
      return {
        rawMaterialId: it.rawMaterialId,
        requiredQuantity: Number(it.requiredQuantity),
        availableQuantity: Number(it.availableQuantity),
        shortageQuantity: Number(it.shortageQuantity),
        unit: it.unit,
        estimatedRate: Number(rate),
        totalCost,
      };
    });

    const totalEstCost = itemsData.reduce((acc, it) => acc + it.totalCost, 0);

    const request = await this.prisma.rawMaterialPurchaseRequest.create({
      data: {
        requestNo,
        salesOrderId: data.salesOrderId || null,
        productionRequestId: data.productionRequestId || null,
        supplierId: data.supplierId || null,
        requestedById: data.requestedById,
        priority: data.priority || 'HIGH',
        requiredDate: new Date(data.requiredDate || Date.now() + 5 * 86400000),
        estimatedCost: totalEstCost,
        reason: data.reason || 'Initiated by Sales Executive for order fulfillment',
        status: 'SUBMITTED',
        items: { create: itemsData },
      },
      include: { supplier: true, items: { include: { rawMaterial: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: data.requestedById,
        action: 'RM_PURCHASE_REQUEST_CREATED',
        entity: 'RawMaterialPurchaseRequest',
        entityId: request.id,
        newValue: JSON.stringify({ requestNo, totalEstCost }),
      },
    });

    // Notify Sales Executive
    await this.prisma.notification.create({
      data: {
        type: 'RM_REQUEST_CREATED',
        title: `🛒 RAW MATERIAL PROCUREMENT REQUIRED: ${requestNo}`,
        message: `Production shortage detected. Sales Executive can review and issue Purchase Order to herbal supplier.`,
        recipientRole: 'SALES',
        priority: 'HIGH',
      },
    });

    // Notify Stock Manager
    await this.prisma.notification.create({
      data: {
        type: 'RM_REQUEST_CREATED',
        title: `📦 RM PROCUREMENT REQUEST: ${requestNo}`,
        message: `Material shortage requisition ${requestNo} requires Purchase Order creation.`,
        recipientRole: 'STOCK_MANAGER',
        priority: 'HIGH',
      },
    });

    return { success: true, message: 'Raw Material Purchase Request submitted', data: request };
  }

  async forwardToSalesForPayment(id: string, user: any) {
    const request = await this.prisma.rawMaterialPurchaseRequest.findUnique({
      where: { id },
      include: { items: { include: { rawMaterial: true } }, supplier: true },
    });

    if (!request) throw new NotFoundException('RM Request not found');

    const updated = await this.prisma.rawMaterialPurchaseRequest.update({
      where: { id },
      data: { status: 'PENDING_SALES_PAYMENT' },
    });

    await this.prisma.notification.create({
      data: {
        type: 'RM_REQUEST_CREATED',
        title: `💳 PAYMENT APPROVAL REQUIRED: ${request.requestNo}`,
        message: `Stock Manager forwarded RM requisition ${request.requestNo} (₹${request.estimatedCost || 1200}) for Sales Executive payment & PO issuance.`,
        recipientRole: 'SALES',
        priority: 'HIGH',
      },
    });

    return {
      success: true,
      message: `Payment request for ${request.requestNo} sent to Sales Executive! Sales person will execute payment.`,
      data: updated,
    };
  }

  async convertToPurchaseOrder(id: string, user: any) {
    if (
      !user.roles?.includes('SALES') &&
      !user.roles?.includes('SUPER_ADMIN')
    ) {
      throw new ForbiddenException('Access Denied: Only Sales Executives can approve payments & issue Purchase Orders.');
    }

    let request = await this.prisma.rawMaterialPurchaseRequest.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { rawMaterial: true } } },
    });

    if (!request) throw new NotFoundException('RM Request not found');
    
    // If supplier is not assigned, auto-assign the first available herb supplier
    if (!request.supplierId) {
      const defaultSupplier = await this.prisma.supplier.findFirst();
      if (defaultSupplier) {
        request = await this.prisma.rawMaterialPurchaseRequest.update({
          where: { id },
          data: { supplierId: defaultSupplier.id },
          include: { supplier: true, items: { include: { rawMaterial: true } } },
        });
      }
    }

    const poNo = `PO-${Date.now().toString().slice(-6)}`;
    let subtotal = 0;
    let taxAmount = 0;

    const poItemsData = request.items.map((it) => {
      const rate = it.estimatedRate || it.rawMaterial.purchasePrice;
      const gst = it.rawMaterial.gstRate || 18;
      const itemSubtotal = rate * it.shortageQuantity;
      const itemTax = (itemSubtotal * gst) / 100;
      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        rawMaterialId: it.rawMaterialId,
        quantity: it.shortageQuantity,
        rate,
        gstRate: gst,
        totalAmount: itemSubtotal + itemTax,
      };
    });

    const totalAmount = subtotal + taxAmount;

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber: poNo,
          supplierId: request.supplierId,
          rmPurchaseRequestId: request.id,
          salesOrderId: request.salesOrderId,
          expectedDelivery: request.requiredDate,
          subtotal,
          taxAmount,
          totalAmount,
          status: 'SENT',
          items: { create: poItemsData },
        },
        include: { supplier: true, items: { include: { rawMaterial: true } } },
      });

      await tx.rawMaterialPurchaseRequest.update({
        where: { id },
        data: { status: 'ORDERED', approvedById: user.id },
      });

      if (request.salesOrderId) {
        await tx.salesOrder.update({
          where: { id: request.salesOrderId },
          data: { status: 'MATERIAL_ORDERED' },
        });
      }

      return {
        success: true,
        message: `Purchase Order ${poNo} created & sent to supplier ${request.supplier?.name}.`,
        data: po,
      };
    });
  }
}
