import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const finishedStock = await this.prisma.stockBalance.findMany({
      where: { itemType: 'FINISHED_PRODUCT' },
    });
    const rawStock = await this.prisma.stockBalance.findMany({
      where: { itemType: 'RAW_MATERIAL' },
    });

    const lowStockRaw = await this.prisma.rawMaterial.findMany({
      where: { currentStock: { lte: this.prisma.rawMaterial.fields.minStock } },
      include: { category: true },
    });

    const lowStockFinished = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });

    const recentTransactions = await this.prisma.inventoryTransaction.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
    });

    return {
      success: true,
      data: {
        totalFinishedProductsCount: finishedStock.length,
        totalRawMaterialsCount: rawStock.length,
        lowStockItemsCount: lowStockRaw.length,
        recentTransactions,
        lowStockRaw,
      },
    };
  }

  async getTransactions(query?: { type?: string; itemType?: string }) {
    const where: any = {};
    if (query?.type) where.type = query.type;
    if (query?.itemType) where.itemType = query.itemType;

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return { success: true, data: transactions };
  }

  async recordTransaction(data: {
    itemType: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
    itemId: string;
    itemName: string;
    batchNumber?: string;
    quantity: number;
    unit: string;
    direction: 'IN' | 'OUT';
    type: string;
    referenceType?: string;
    referenceId?: string;
    performedBy?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Create ledger transaction entry
      const txId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const transaction = await tx.inventoryTransaction.create({
        data: {
          transactionId: txId,
          itemType: data.itemType,
          itemId: data.itemId,
          itemName: data.itemName,
          batchNumber: data.batchNumber,
          quantity: data.quantity,
          unit: data.unit,
          direction: data.direction,
          type: data.type,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          performedBy: data.performedBy,
        },
      });

      // Update StockBalance
      const existing = await tx.stockBalance.findUnique({
        where: { itemId: data.itemId },
      });

      const change = data.direction === 'IN' ? data.quantity : -data.quantity;
      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + change;

      if (newQty < 0 && data.direction === 'OUT') {
        throw new BadRequestException(`Insufficient stock for ${data.itemName}. Current stock: ${currentQty}`);
      }

      await tx.stockBalance.upsert({
        where: { itemId: data.itemId },
        create: {
          itemType: data.itemType,
          itemId: data.itemId,
          batchNumber: data.batchNumber,
          quantity: newQty,
          unit: data.unit,
        },
        update: {
          quantity: newQty,
          batchNumber: data.batchNumber || undefined,
        },
      });

      // If raw material, update rawMaterial.currentStock
      if (data.itemType === 'RAW_MATERIAL') {
        await tx.rawMaterial.update({
          where: { id: data.itemId },
          data: { currentStock: newQty },
        });
      }

      // If finished product IN, update matching sales orders to READY_FOR_DISPATCH and notify Sales
      if (data.itemType === 'FINISHED_PRODUCT' && data.direction === 'IN') {
        if (data.batchNumber) {
          await tx.productionBatch.updateMany({
            where: { batchNumber: data.batchNumber },
            data: { status: 'RELEASED_TO_STOCK' },
          }).catch(() => null);
        }

        const pendingOrders = await tx.salesOrder.findMany({
          where: {
            status: { in: ['PRODUCTION_REQUIRED', 'PRODUCTION', 'MATERIAL_REQUIRED', 'STOCK_CHECK', 'CONFIRMED'] },
          },
          include: { items: true, customer: true },
        });

        for (const order of pendingOrders) {
          await tx.salesOrder.update({
            where: { id: order.id },
            data: { status: 'READY_FOR_DISPATCH' },
          });

          // Also update associated ProductionRequests
          await tx.productionRequest.updateMany({
            where: { salesOrderId: order.id },
            data: { status: 'COMPLETED' },
          });

          // Create notification for Sales role
          await tx.notification.create({
            data: {
              type: 'PRODUCT_READY_FOR_DELIVERY',
              title: '📦 PRODUCT BATCH READY FOR DELIVERY',
              message: `Order ${order.orderNumber} (${order.customer.name}) for ${data.itemName} (${data.quantity} Units) has been accepted by Stock Manager and is READY FOR DISPATCH!`,
              recipientRole: 'SALES',
            },
          });
        }
      }

      return transaction;
    });
  }
}
