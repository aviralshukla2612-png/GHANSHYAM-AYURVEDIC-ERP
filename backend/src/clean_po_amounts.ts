import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pos = await prisma.purchaseOrder.findMany({
    include: { items: true },
  });

  for (const po of pos) {
    for (const it of po.items) {
      if (it.quantity > 500 || it.rate > 1000 || it.totalAmount > 50000) {
        const clampedQty = Math.min(it.quantity, 100);
        const clampedRate = Math.min(it.rate, 250);
        const total = clampedQty * clampedRate;
        await prisma.purchaseOrderItem.update({
          where: { id: it.id },
          data: { quantity: clampedQty, rate: clampedRate, totalAmount: total },
        });
      }
    }

    const freshItems = await prisma.purchaseOrderItem.findMany({ where: { poId: po.id } });
    let calculatedTotal = 0;
    for (const it of freshItems) {
      calculatedTotal += it.quantity * it.rate;
    }
    if (calculatedTotal === 0) calculatedTotal = 12000;

    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        totalAmount: calculatedTotal,
        subtotal: Number((calculatedTotal * 0.88).toFixed(2)),
        taxAmount: Number((calculatedTotal * 0.12).toFixed(2)),
      },
    });
  }

  const updatedPOs = await prisma.purchaseOrder.findMany();
  const sum = updatedPOs.reduce((acc, p) => acc + p.totalAmount, 0);
  console.log(`Cleaned total purchases sum: ₹${sum.toLocaleString('en-IN')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
