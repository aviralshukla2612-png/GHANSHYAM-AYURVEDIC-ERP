import { PrismaClient } from '@prisma/client';

async function resetTestOrdersAndWorkflowData() {
  const prisma = new PrismaClient();
  console.log('🧹 Starting cleanup of test orders, dispatches, production batches & notifications...');

  try {
    // Delete in reverse order of foreign key dependencies
    const deletedConfirmations = await prisma.deliveryConfirmation.deleteMany({});
    console.log(`✓ Deleted ${deletedConfirmations.count} DeliveryConfirmation records.`);

    const deletedDispatchItems = await prisma.dispatchItem.deleteMany({});
    console.log(`✓ Deleted ${deletedDispatchItems.count} DispatchItem records.`);

    const deletedDispatches = await prisma.dispatch.deleteMany({});
    console.log(`✓ Deleted ${deletedDispatches.count} Dispatch records.`);

    const deletedInvoiceItems = await prisma.salesInvoiceItem.deleteMany({});
    console.log(`✓ Deleted ${deletedInvoiceItems.count} SalesInvoiceItem records.`);

    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✓ Deleted ${deletedPayments.count} Payment records.`);

    const deletedInvoices = await prisma.salesInvoice.deleteMany({});
    console.log(`✓ Deleted ${deletedInvoices.count} SalesInvoice records.`);

    const deletedAccounting = await prisma.accountingEntry.deleteMany({});
    console.log(`✓ Deleted ${deletedAccounting.count} AccountingEntry records.`);

    const deletedGST = await prisma.gSTRecord.deleteMany({});
    console.log(`✓ Deleted ${deletedGST.count} GSTRecord records.`);

    const deletedQualityChecks = await prisma.qualityCheck.deleteMany({});
    console.log(`✓ Deleted ${deletedQualityChecks.count} QualityCheck records.`);

    const deletedWastes = await prisma.productionWaste.deleteMany({});
    console.log(`✓ Deleted ${deletedWastes.count} ProductionWaste records.`);

    const deletedMaterialsConsumed = await prisma.productionMaterial.deleteMany({});
    console.log(`✓ Deleted ${deletedMaterialsConsumed.count} ProductionMaterial records.`);

    const deletedBatches = await prisma.productionBatch.deleteMany({});
    console.log(`✓ Deleted ${deletedBatches.count} ProductionBatch records.`);

    const deletedProdOrders = await prisma.productionOrder.deleteMany({});
    console.log(`✓ Deleted ${deletedProdOrders.count} ProductionOrder records.`);

    const deletedMaterialCheckItems = await prisma.materialCheckRequestItem.deleteMany({});
    console.log(`✓ Deleted ${deletedMaterialCheckItems.count} MaterialCheckRequestItem records.`);

    const deletedMaterialChecks = await prisma.materialCheckRequest.deleteMany({});
    console.log(`✓ Deleted ${deletedMaterialChecks.count} MaterialCheckRequest records.`);

    const deletedRMReqItems = await prisma.rawMaterialPurchaseRequestItem.deleteMany({});
    console.log(`✓ Deleted ${deletedRMReqItems.count} RawMaterialPurchaseRequestItem records.`);

    const deletedRMReqs = await prisma.rawMaterialPurchaseRequest.deleteMany({});
    console.log(`✓ Deleted ${deletedRMReqs.count} RawMaterialPurchaseRequest records.`);

    const deletedPOItems = await prisma.purchaseOrderItem.deleteMany({});
    console.log(`✓ Deleted ${deletedPOItems.count} PurchaseOrderItem records.`);

    const deletedGRNs = await prisma.goodsReceipt.deleteMany({});
    console.log(`✓ Deleted ${deletedGRNs.count} GoodsReceipt records.`);

    const deletedPOs = await prisma.purchaseOrder.deleteMany({});
    console.log(`✓ Deleted ${deletedPOs.count} PurchaseOrder records.`);

    const deletedProdRequests = await prisma.productionRequest.deleteMany({});
    console.log(`✓ Deleted ${deletedProdRequests.count} ProductionRequest records.`);

    const deletedOrderItems = await prisma.salesOrderItem.deleteMany({});
    console.log(`✓ Deleted ${deletedOrderItems.count} SalesOrderItem records.`);

    const deletedSalesOrders = await prisma.salesOrder.deleteMany({});
    console.log(`✓ Deleted ${deletedSalesOrders.count} SalesOrder records.`);

    const deletedInventoryTxns = await prisma.inventoryTransaction.deleteMany({});
    console.log(`✓ Deleted ${deletedInventoryTxns.count} InventoryTransaction records.`);

    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✓ Deleted ${deletedNotifications.count} Notification records.`);

    const deletedTasks = await prisma.taskAssignment.deleteMany({});
    console.log(`✓ Deleted ${deletedTasks.count} TaskAssignment records.`);

    // Reset stock balances to clean default levels for products and raw materials
    await prisma.stockBalance.updateMany({
      data: { quantity: 0, reservedQuantity: 0 },
    });
    console.log(`✓ Reset all StockBalance quantities to 0.`);

    await prisma.rawMaterial.updateMany({
      data: { currentStock: 100, reservedStock: 0 },
    });
    console.log(`✓ Reset RawMaterial stocks to standard baseline (100 Units).`);

    console.log('\n✨ CLEANUP COMPLETE: All test orders, dispatches, batches & notifications deleted!');
    console.log('Master data (Customers, Products, Suppliers, Raw Materials, Users & BOMs) preserved.');

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestOrdersAndWorkflowData();
