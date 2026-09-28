import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ASSIGNING PROCUREMENT & PO PERMISSIONS TO STOCK_MANAGER ROLE ---');

  const stockRole = await prisma.role.findUnique({ where: { name: 'STOCK_MANAGER' } });
  if (!stockRole) {
    console.log('STOCK_MANAGER role not found!');
    return;
  }

  const permissionsToAssign = [
    'raw_material.purchase_order.create',
    'raw_material.purchase_order.approve',
    'raw_material.goods_receipt.create',
    'raw_material.purchase_request.create',
    'stock.view',
    'stock.adjust',
    'production.view',
  ];

  for (const code of permissionsToAssign) {
    let perm = await prisma.permission.findUnique({ where: { code } });
    if (!perm) {
      perm = await prisma.permission.create({
        data: {
          code,
          name: code.replace(/_/g, ' ').toUpperCase(),
          module: 'procurement',
        },
      });
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: stockRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: stockRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log('✅ Permissions successfully assigned to STOCK_MANAGER role.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
