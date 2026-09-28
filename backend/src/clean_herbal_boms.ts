import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- PURGING PACKAGING ITEMS FROM BOMS & SETTING 100% PURE HERBAL FORMULATIONS ---');

  // 1. Delete all BOM items that are packaging materials or non-herbal
  const deletedPkg = await prisma.bOMItem.deleteMany({
    where: {
      OR: [
        { itemType: 'PACKAGING' },
        { unit: 'PCS' },
        { rawMaterial: { category: { name: 'Packaging Materials' } } },
      ],
    },
  });
  console.log(`✓ Removed ${deletedPkg.count} non-herbal / packaging items from all BOM formulas.`);

  // 2. Query products & herbal raw materials
  const products = await prisma.product.findMany();
  const rawMaterials = await prisma.rawMaterial.findMany();
  const rmMap = new Map(rawMaterials.map((rm) => [rm.sku, rm]));

  const senna = rmMap.get('RM-SENNA') || rawMaterials.find(r => r.name.includes('Senna'));
  const mulethi = rmMap.get('RM-MULETHI') || rawMaterials.find(r => r.name.includes('Mulethi'));
  const neem = rmMap.get('RM-NEEM-EXT') || rawMaterials.find(r => r.name.includes('Neem'));
  const sesame = rmMap.get('RM-SESAME-OIL') || rawMaterials.find(r => r.name.includes('Sesame') || r.name.includes('Til'));
  const eucalyptus = rmMap.get('RM-EUCALYPTUS') || rawMaterials.find(r => r.name.includes('Eucalyptus') || r.name.includes('Nilgiri'));

  // 3. Update or create pure herbal BOMs for every product
  for (const prod of products) {
    let bom = await prisma.productBOM.findFirst({
      where: { productId: prod.id, isActive: true },
    });

    if (!bom) {
      bom = await prisma.productBOM.create({
        data: {
          productId: prod.id,
          version: 'v1.0',
          isActive: true,
          expectedYield: 100,
          expectedWastage: 2.5,
          processSteps: '1. Botanical Inspection -> 2. Grinding / Decoction -> 3. Formulation Blending -> 4. Finished Medicine Assay',
        },
      });
    }

    // Delete existing items for clean reset
    await prisma.bOMItem.deleteMany({ where: { bomId: bom.id } });

    // Assign authentic Ayurvedic herbal ingredients
    const pName = prod.name.toLowerCase();
    if (pName.includes('kayam') || pName.includes('churna')) {
      if (senna) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: senna.id, quantity: 8.5, unit: 'KG', itemType: 'RAW_MATERIAL' },
        });
      }
      if (mulethi) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: mulethi.id, quantity: 1.5, unit: 'KG', itemType: 'RAW_MATERIAL' },
        });
      }
    } else if (pName.includes('pain') || pName.includes('oil')) {
      if (sesame) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: sesame.id, quantity: 8.0, unit: 'LTR', itemType: 'RAW_MATERIAL' },
        });
      }
      if (eucalyptus) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: eucalyptus.id, quantity: 2.0, unit: 'LTR', itemType: 'RAW_MATERIAL' },
        });
      }
    } else if (pName.includes('hair')) {
      if (sesame) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: sesame.id, quantity: 8.0, unit: 'LTR', itemType: 'RAW_MATERIAL' },
        });
      }
      if (neem) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: neem.id, quantity: 2.0, unit: 'LTR', itemType: 'RAW_MATERIAL' },
        });
      }
    } else if (pName.includes('cough') || pName.includes('syrup')) {
      if (mulethi) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: mulethi.id, quantity: 6.0, unit: 'KG', itemType: 'RAW_MATERIAL' },
        });
      }
      if (neem) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: neem.id, quantity: 2.0, unit: 'LTR', itemType: 'RAW_MATERIAL' },
        });
      }
    } else if (pName.includes('soap')) {
      if (neem) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: neem.id, quantity: 3.5, unit: 'LTR', itemType: 'RAW_MATERIAL' },
        });
      }
      if (sesame) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: sesame.id, quantity: 9.0, unit: 'LTR', itemType: 'RAW_MATERIAL' },
        });
      }
    } else {
      if (senna) {
        await prisma.bOMItem.create({
          data: { bomId: bom.id, rawMaterialId: senna.id, quantity: 5.0, unit: 'KG', itemType: 'RAW_MATERIAL' },
        });
      }
    }
  }

  // 4. Update all Production Requests to recalculate shortage based only on herbs
  const requests = await prisma.productionRequest.findMany({
    include: {
      bom: {
        include: {
          bomItems: {
            include: { rawMaterial: true },
          },
        },
      },
    },
  });

  for (const pr of requests) {
    if (!pr.bom) continue;
    const factor = pr.requestedQuantity / (pr.bom.expectedYield || 100);
    let hasShortage = false;

    for (const item of pr.bom.bomItems) {
      const required = item.quantity * factor;
      const avail = item.rawMaterial?.currentStock || 0;
      if (required > avail) {
        hasShortage = true;
      }
    }

    const newStatus = hasShortage ? 'MATERIAL_SHORTAGE' : 'READY_FOR_PRODUCTION';
    if (pr.status !== 'IN_PRODUCTION' && pr.status !== 'BATCH_SCHEDULED' && pr.status !== 'COMPLETED') {
      await prisma.productionRequest.update({
        where: { id: pr.id },
        data: { status: newStatus },
      });
    }
  }

  console.log('✅ ALL PRODUCT BOMS RECONFIGURED: 100% PURE HERBAL RAW MATERIALS (KG / LITERS).');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
