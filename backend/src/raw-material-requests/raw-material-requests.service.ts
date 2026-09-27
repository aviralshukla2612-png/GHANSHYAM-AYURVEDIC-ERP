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

    return { success: true, message: 'Raw Material Purchase Request submitted', data: request };
  }

  async convertToPurchaseOrder(id: string, user: any) {
    if (!user.permissions.includes('raw_material.purchase_order.create') && !user.roles.includes('SUPER_ADMIN') && !user.roles.includes('SALES')) {
      throw new ForbiddenException('User lacks permission: raw_material.purchase_order.create');
    }

    const request = await this.prisma.rawMaterialPurchaseRequest.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { rawMaterial: true } } },
    });

    if (!request) throw new NotFoundException('RM Request not found');
    if (!request.supplierId) throw new BadRequestException('Please assign a Supplier before creating PO');

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
