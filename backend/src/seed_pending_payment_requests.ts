import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding pending raw material payment requests from Stock Manager to Sales...');

  const anyUser = await prisma.user.findFirst();
  const userId = anyUser ? anyUser.id : 'cluser0001';
  const supplier = await prisma.supplier.findFirst();

  const senna = await prisma.rawMaterial.findFirst({ where: { name: { contains: 'Senna' } } });
  const mulethi = await prisma.rawMaterial.findFirst({ where: { name: { contains: 'Mulethi' } } });
  const ashwagandha = await prisma.rawMaterial.findFirst({ where: { name: { contains: 'Ashwagandha' } } });

  // Create Request 1: Senna & Mulethi shortage for Kayam Churna Batch
  const req1 = await prisma.rawMaterialPurchaseRequest.create({
    data: {
      requestNo: `RM-REQ-${Date.now().toString().slice(-6)}`,
      supplierId: supplier ? supplier.id : null,
      requestedById: userId,
      priority: 'HIGH',
      requiredDate: new Date(Date.now() + 3 * 86400000),
      estimatedCost: 18500,
      reason: 'Production batch shortage reported by Supervisor. Stock Manager requesting funds approval from Sales.',
      status: 'SUBMITTED',
      items: {
        create: [
          {
            rawMaterialId: senna ? senna.id : (await prisma.rawMaterial.findFirst())!.id,
            requiredQuantity: 150,
            availableQuantity: 20,
            shortageQuantity: 130,
            unit: 'KG',
            estimatedRate: 120,
            totalCost: 15600,
          },
          {
            rawMaterialId: mulethi ? mulethi.id : (await prisma.rawMaterial.findFirst())!.id,
            requiredQuantity: 25,
            availableQuantity: 5,
            shortageQuantity: 20,
            unit: 'KG',
            estimatedRate: 145,
            totalCost: 2900,
          },
        ],
      },
    },
  });

  // Create Request 2: Ashwagandha shortage for Immunity Rasayan
  if (ashwagandha) {
    await prisma.rawMaterialPurchaseRequest.create({
      data: {
        requestNo: `RM-REQ-${(Date.now() + 100).toString().slice(-6)}`,
        supplierId: supplier ? supplier.id : null,
        requestedById: userId,
        priority: 'URGENT',
        requiredDate: new Date(Date.now() + 2 * 86400000),
        estimatedCost: 22000,
        reason: 'Urgent botanical requirement for Ashwagandha Gold Rasayan production batch.',
        status: 'SUBMITTED',
        items: {
          create: [
            {
              rawMaterialId: ashwagandha.id,
              requiredQuantity: 100,
              availableQuantity: 12,
              shortageQuantity: 88,
              unit: 'KG',
              estimatedRate: 250,
              totalCost: 22000,
            },
          ],
        },
      },
    });
  }

  console.log('✓ Successfully created pending Payment Requests for Sales approval!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
