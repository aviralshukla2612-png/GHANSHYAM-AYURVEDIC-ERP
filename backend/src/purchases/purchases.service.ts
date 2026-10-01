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

  async getPurchaseBills() {
    const pos = await this.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: { include: { rawMaterial: true } },
        receipts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const bills = pos.map((po, index) => {
      const receipt = po.receipts?.[0];
      const billNumber = receipt?.invoiceNumber || `BILL-${po.poNumber.replace('PO-', 'RM-')}`;
      const billDate = receipt?.invoiceDate || po.createdAt;
      const isReceived = po.status === 'RECEIVED' || (po.receipts && po.receipts.length > 0);

      const items = po.items.map((it) => {
        const rate = it.rate || it.rawMaterial?.purchasePrice || 120;
        const qty = it.quantity || 10;
        const taxable = rate * qty;
        const gstRate = it.gstRate || it.rawMaterial?.gstRate || 18;
        const gstAmount = (taxable * gstRate) / 100;
        return {
          id: it.id,
          rawMaterialName: it.rawMaterial?.name || 'Ayurvedic Botanical Herb',
          sku: it.rawMaterial?.sku || 'RM-HERB',
          hsnCode: '12119090',
          quantity: qty,
          unit: it.rawMaterial?.unit || 'KG',
          rate,
          gstRate,
          taxableAmount: taxable,
          gstAmount,
          totalAmount: taxable + gstAmount,
        };
      });

      const totalTaxable = items.reduce((sum, it) => sum + it.taxableAmount, 0);
      const totalGST = items.reduce((sum, it) => sum + it.gstAmount, 0);
      const totalAmount = totalTaxable + totalGST;

      return {
        id: po.id,
        billNumber,
        poNumber: po.poNumber,
        billDate,
        supplier: {
          id: po.supplier?.id || 'sup-001',
          name: po.supplier?.name || 'Saurashtra Herbs & Spices Ltd',
          gstin: po.supplier?.gstin || '24AAAFS4411L1Z9',
          contactPerson: (po.supplier as any)?.contactPerson || (po.supplier as any)?.companyName || 'Kantilal Patel',
          phone: po.supplier?.phone || '+91 98250 12345',
          state: po.supplier?.state || 'Gujarat (24)',
        },
        items,
        totalTaxable,
        totalGST,
        totalAmount,
        paymentStatus: isReceived ? 'PAID / INWARD_VERIFIED' : 'PENDING_CLEARANCE',
        goodsReceipt: receipt ? {
          grnNumber: receipt.grnNumber,
          batchNumber: receipt.batchNumber,
          quantityReceived: receipt.quantityReceived,
          qualityStatus: receipt.qualityStatus,
        } : null,
        status: po.status,
      };
    });

    return { success: true, data: bills };
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

      // Increment Raw Material stock for all PO items
      for (const item of po.items) {
        if (item.rawMaterialId && qtyAcc > 0) {
          const itemQty = po.items.length === 1 ? qtyAcc : Number(item.quantity);
          await tx.rawMaterial.update({
            where: { id: item.rawMaterialId },
            data: { currentStock: { increment: itemQty } },
          });

          await tx.stockBalance.upsert({
            where: { itemId: item.rawMaterialId },
            create: {
              itemType: 'RAW_MATERIAL',
              itemId: item.rawMaterialId,
              batchNumber: data.batchNumber || `LOT-${Date.now().toString().slice(-4)}`,
              quantity: itemQty,
              unit: item.rawMaterial.unit,
            },
            update: {
              quantity: { increment: itemQty },
            },
          });

          // Record Inventory Ledger
          await tx.inventoryTransaction.create({
            data: {
              transactionId: `TXN-GRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              itemType: 'RAW_MATERIAL',
              itemId: item.rawMaterialId,
              itemName: item.rawMaterial.name,
              batchNumber: data.batchNumber || `LOT-${Date.now().toString().slice(-4)}`,
              quantity: itemQty,
              unit: item.rawMaterial.unit,
              direction: 'IN',
              type: 'PURCHASE_RECEIPT',
              referenceType: 'GoodsReceipt',
              referenceId: grn.id,
              performedBy: 'Stock Manager',
            },
          });
        }
      }

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'RECEIVED' },
      });

      if (po.rmPurchaseRequestId) {
        await tx.rawMaterialPurchaseRequest.update({
          where: { id: po.rmPurchaseRequestId },
          data: { status: 'RECEIVED' },
        }).catch(() => null);
      }

      // AUTO-RECHECK BOM SHORTAGES ON BLOCKED PRODUCTION REQUESTS
      const blockedRequests = await tx.productionRequest.findMany({
        where: { status: { in: ['MATERIAL_SHORTAGE', 'SUBMITTED', 'PENDING'] } },
        include: {
          product: true,
          bom: { include: { bomItems: { include: { rawMaterial: true } } } },
        },
      });

      for (const req of blockedRequests) {
        if (!req.bom?.bomItems) continue;

        let allMaterialsSufficient = true;
        for (const bItem of req.bom.bomItems) {
          const reqQty = bItem.quantity * (req.requestedQuantity / (req.bom.expectedYield || 100));
          const currentStock = bItem.rawMaterial.currentStock;
          if (currentStock < reqQty) {
            allMaterialsSufficient = false;
            break;
          }
        }

        if (allMaterialsSufficient) {
          await tx.productionRequest.update({
            where: { id: req.id },
            data: { status: 'READY_FOR_PRODUCTION' },
          });

          // Notify Production Supervisor
          await tx.notification.create({
            data: {
              type: 'MATERIAL_RECEIVED',
              title: '🌿 RAW MATERIAL SHORTAGE RESOLVED',
              message: `Raw materials received via ${grnNo}. Production Request ${req.requestNo} (${req.product.name}) is now READY to start!`,
              recipientRole: 'PRODUCTION',
              priority: 'HIGH',
            },
          });
        }
      }

      // Broadcast Notifications to Sales, Production and Accountant
      const matNames = po.items.map((i) => i.rawMaterial?.name).filter(Boolean).join(', ') || 'Herbal Ingredients';

      // 1. Notify Production Supervisor
      await tx.notification.create({
        data: {
          type: 'MATERIAL_RECEIVED',
          title: '🌿 RAW MATERIAL DELIVERED & VERIFIED',
          message: `Stock Manager verified & accepted ${matNames} (${qtyAcc} KG) into warehouse. Production batches are unblocked & ready to process!`,
          recipientRole: 'PRODUCTION',
          priority: 'URGENT',
        },
      });

      // 2. Notify Sales Executive
      await tx.notification.create({
        data: {
          type: 'MATERIAL_RECEIVED',
          title: '🌿 RAW MATERIAL DELIVERED TO FACTORY',
          message: `Stock Manager verified delivery of ${matNames} (${qtyAcc} KG) for PO ${po.poNumber}. Customer order fulfillment is moving forward!`,
          recipientRole: 'SALES',
          priority: 'HIGH',
        },
      });

      // 3. Notify Head Accountant
      await tx.notification.create({
        data: {
          type: 'PURCHASE_BILL_VERIFIED',
          title: '📄 RM PURCHASE BILL VERIFIED (GRN RECORDED)',
          message: `Purchase bill for PO ${po.poNumber} verified with GRN ${grnNo}. Ready for supplier clearance & CA GSTR-2B filing.`,
          recipientRole: 'ACCOUNTANT',
          priority: 'HIGH',
        },
      });

      return {
        success: true,
        message: 'Goods Receipt recorded. Raw Material stock updated and notifications sent to Sales & Production.',
        data: grn,
      };
    });
  }
}
