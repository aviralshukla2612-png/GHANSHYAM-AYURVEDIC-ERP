import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const pos = await this.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: { include: { rawMaterial: true } },
        receipts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: pos };
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { rawMaterial: true } },
        receipts: true,
      },
    });
    if (!po) throw new NotFoundException('PO not found');
    return { success: true, data: po };
  }

  async createPO(data: {
    supplierId: string;
    expectedDelivery: string;
    notes?: string;
    items: Array<{ rawMaterialId: string; quantity: number; rate: number; gstRate?: number }>;
  }) {
    const poNo = `PO-RM-${Date.now().toString().slice(-6)}`;
    let subtotal = 0;
    let taxAmount = 0;

    const poItemsData = [];
    for (const item of data.items) {
      const rm = await this.prisma.rawMaterial.findUnique({ where: { id: item.rawMaterialId } });
      if (!rm) throw new NotFoundException(`Raw Material ${item.rawMaterialId} not found`);

      const rate = item.rate || rm.purchasePrice;
      const gst = item.gstRate || rm.gstRate;
      const itemSubtotal = rate * item.quantity;
      const itemTax = (itemSubtotal * gst) / 100;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      poItemsData.push({
        rawMaterialId: rm.id,
        quantity: Number(item.quantity),
        rate: Number(rate),
        gstRate: Number(gst),
        totalAmount: itemSubtotal + itemTax,
      });
    }

    const totalAmount = subtotal + taxAmount;

    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber: poNo,
        supplierId: data.supplierId,
        expectedDelivery: new Date(data.expectedDelivery || Date.now() + 7 * 86400000),
        notes: data.notes,
        status: 'SENT',
        subtotal,
        taxAmount,
        totalAmount,
        items: { create: poItemsData },
      },
      include: { supplier: true, items: { include: { rawMaterial: true } } },
    });

    return { success: true, message: 'Purchase Order created', data: po };
  }

  async createGoodsReceipt(data: {
    poId: string;
    invoiceNumber: string;
    invoiceDate: string;
    batchNumber: string;
    quantityReceived: number;
    rejectedQuantity?: number;
    qualityStatus?: string;
    notes?: string;
  }) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: data.poId },
      include: { items: { include: { rawMaterial: true } } },
    });

    if (!po) throw new NotFoundException('Purchase Order not found');

    const qtyRec = Number(data.quantityReceived);
    const qtyRej = Number(data.rejectedQuantity || 0);
    const qtyAcc = qtyRec - qtyRej;
    const grnNo = `GRN-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceipt.create({
        data: {
          grnNumber: grnNo,
          poId: po.id,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate || Date.now()),
          batchNumber: data.batchNumber || `LOT-${Date.now().toString().slice(-5)}`,
          quantityReceived: qtyRec,
          rejectedQuantity: qtyRej,
          acceptedQuantity: qtyAcc,
          qualityStatus: data.qualityStatus || 'PASSED',
          notes: data.notes,
        },
      });

      // Increment Raw Material stock for the first PO item
      const firstItem = po.items[0];
      if (firstItem && qtyAcc > 0) {
        await tx.rawMaterial.update({
          where: { id: firstItem.rawMaterialId },
          data: { currentStock: { increment: qtyAcc } },
        });

        await tx.stockBalance.upsert({
          where: { itemId: firstItem.rawMaterialId },
          create: {
            itemType: 'RAW_MATERIAL',
            itemId: firstItem.rawMaterialId,
            batchNumber: data.batchNumber,
            quantity: qtyAcc,
            unit: firstItem.rawMaterial.unit,
          },
          update: {
            quantity: { increment: qtyAcc },
          },
        });

        // Record Inventory Ledger
        await tx.inventoryTransaction.create({
          data: {
            transactionId: `TXN-GRN-${Date.now()}`,
            itemType: 'RAW_MATERIAL',
            itemId: firstItem.rawMaterialId,
            itemName: firstItem.rawMaterial.name,
            batchNumber: data.batchNumber,
            quantity: qtyAcc,
            unit: firstItem.rawMaterial.unit,
            direction: 'IN',
            type: 'PURCHASE_RECEIPT',
            referenceType: 'GoodsReceipt',
            referenceId: grn.id,
            performedBy: 'Stock Manager',
          },
        });
      }

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'RECEIVED' },
      });

      return {
        success: true,
        message: 'Goods Receipt recorded. Raw Material stock updated.',
        data: grn,
      };
    });
  }
}
