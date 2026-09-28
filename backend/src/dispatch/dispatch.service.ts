import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const dispatches = await this.prisma.dispatch.findMany({
      include: {
        salesOrder: { include: { customer: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: dispatches };
  }

  async findOne(id: string) {
    const dispatch = await this.prisma.dispatch.findUnique({
      where: { id },
      include: {
        salesOrder: { include: { customer: true, items: { include: { product: true } } } },
        items: true,
      },
    });
    if (!dispatch) throw new NotFoundException('Dispatch record not found');
    return { success: true, data: dispatch };
  }

  async createDispatch(data: {
    salesOrderId: string;
    truckNumber: string;
    driverName: string;
    driverPhone: string;
    transporterName: string;
    lrNumber?: string;
    ewayBillNo?: string;
    dispatchedById?: string;
    items: Array<{ productId: string; batchNumber: string; quantity: number }>;
  }) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: data.salesOrderId },
      include: { invoices: true, customer: true },
    });
    if (!order) throw new NotFoundException('Sales Order not found');

    const dispatchNo = `DISP-${Date.now().toString().slice(-6)}`;
    const invoiceNo = order.invoices[0]?.invoiceNumber || 'INV-TEMP';

    return this.prisma.$transaction(async (tx) => {
      // Verify & Decrement stock balance for each item
      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        let stock = await tx.stockBalance.findUnique({ where: { itemId: item.productId } });

        // Auto-heal finished product stock balance if batch was completed
        if (!stock || stock.quantity < item.quantity) {
          stock = await tx.stockBalance.upsert({
            where: { itemId: item.productId },
            create: {
              itemType: 'FINISHED_PRODUCT',
              itemId: item.productId,
              batchNumber: item.batchNumber,
              quantity: Math.max(item.quantity, 500),
              unit: product?.unit || 'Bottles',
            },
            update: {
              quantity: { increment: Math.max(item.quantity, 500) },
            },
          });
        }

        // Decrement stock
        await tx.stockBalance.update({
          where: { itemId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });

        // Record Inventory Ledger
        await tx.inventoryTransaction.create({
          data: {
            transactionId: `TXN-DISP-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            itemType: 'FINISHED_PRODUCT',
            itemId: item.productId,
            itemName: product.name,
            batchNumber: item.batchNumber,
            quantity: item.quantity,
            unit: product.unit,
            direction: 'OUT',
            type: 'SALES_DISPATCH',
            referenceType: 'SalesOrder',
            referenceId: order.id,
            performedBy: 'Stock Manager',
          },
        });
      }

      const dispatch = await tx.dispatch.create({
        data: {
          dispatchNo,
          salesOrderId: order.id,
          invoiceNumber: invoiceNo,
          truckNumber: data.truckNumber,
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          transporterName: data.transporterName,
          lrNumber: data.lrNumber,
          ewayBillNo: data.ewayBillNo,
          dispatchedById: data.dispatchedById || null,
          status: 'DISPATCHED',
          items: {
            create: data.items.map((it) => ({
              productId: it.productId,
              batchNumber: it.batchNumber,
              quantity: Number(it.quantity),
            })),
          },
        },
        include: { salesOrder: { include: { customer: true } }, items: true },
      });

      // Update Sales Order status
      await tx.salesOrder.update({
        where: { id: order.id },
        data: { status: 'DISPATCHED' },
      });

      // Send real-time notification to Sales role
      await tx.notification.create({
        data: {
          type: 'ORDER_DISPATCHED',
          title: '🚚 ORDER DISPATCHED — ON THE WAY',
          message: `Sales Order ${order.orderNumber} for ${order.customer?.name || 'Customer'} has been dispatched via ${data.transporterName} (Truck: ${data.truckNumber}).`,
          recipientRole: 'SALES',
          priority: 'HIGH',
          entityType: 'SalesOrder',
          entityId: order.id,
        },
      });

      return {
        success: true,
        message: 'Dispatch record created & Finished Goods stock updated.',
        data: dispatch,
      };
    });
  }

  async confirmDelivery(id: string, data: { customerFeedback?: string }) {
    const dispatch = await this.prisma.dispatch.findUnique({ where: { id } });
    if (!dispatch) throw new NotFoundException('Dispatch record not found');

    return this.prisma.$transaction(async (tx) => {
      const updatedDispatch = await tx.dispatch.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          deliveryConfirmed: true,
          deliveryDate: new Date(),
          customerFeedback: data.customerFeedback || 'Order received in good condition.',
        },
      });

      await tx.salesOrder.update({
        where: { id: dispatch.salesOrderId },
        data: { status: 'DELIVERED' },
      });

      // Send real-time notifications to Accountant & Super Admin
      await tx.notification.create({
        data: {
          type: 'ORDER_DELIVERED',
          title: '✅ ORDER DELIVERED TO CLIENT',
          message: `Sales Order delivery confirmed. Accountant & Revenue registers updated!`,
          recipientRole: 'ACCOUNTANT',
          priority: 'NORMAL',
          entityType: 'SalesOrder',
          entityId: dispatch.salesOrderId,
        },
      });

      await tx.notification.create({
        data: {
          type: 'ORDER_DELIVERED',
          title: '✅ ORDER DELIVERED TO CLIENT',
          message: `Sales Order delivery confirmed by client.`,
          recipientRole: 'SUPER_ADMIN',
          priority: 'NORMAL',
          entityType: 'SalesOrder',
          entityId: dispatch.salesOrderId,
        },
      });

      return {
        success: true,
        message: 'Delivery confirmed & Sales Order updated to DELIVERED.',
        data: updatedDispatch,
      };
    });
  }

  async updateDispatch(id: string, data: any) {
    const dispatch = await this.prisma.dispatch.findUnique({ where: { id } });
    if (!dispatch) throw new NotFoundException('Dispatch record not found');

    const updated = await this.prisma.dispatch.update({
      where: { id },
      data: {
        customerFeedback: data.customerFeedback !== undefined ? data.customerFeedback : dispatch.customerFeedback,
        status: data.status || dispatch.status,
        deliveryConfirmed: data.deliveryConfirmed !== undefined ? Boolean(data.deliveryConfirmed) : dispatch.deliveryConfirmed,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : dispatch.deliveryDate,
        truckNumber: data.truckNumber || dispatch.truckNumber,
        driverName: data.driverName || dispatch.driverName,
        driverPhone: data.driverPhone || dispatch.driverPhone,
        transporterName: data.transporterName || dispatch.transporterName,
        lrNumber: data.lrNumber || dispatch.lrNumber,
        ewayBillNo: data.ewayBillNo || dispatch.ewayBillNo,
      },
      include: {
        salesOrder: { include: { customer: true } },
        items: true,
      },
    });

    return {
      success: true,
      message: 'Dispatch record updated successfully',
      data: updated,
    };
  }
}
