import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Ghanshyam Ayurvedic ERP Database Seeding...');

  // 1. Create Primary Roles
  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'Full system visibility and administrative control' },
    { name: 'SALES', description: 'Sales orders, customer management, RM requisition & purchase request initiation' },
    { name: 'STOCK_MANAGER', description: 'Raw material & finished goods inventory, PO receipts, dispatch' },
    { name: 'ACCOUNTANT', description: 'Invoices, expenses, P&L, GST reporting, CA WhatsApp export' },
    { name: 'PRODUCTION', description: 'BOM formulations, production orders, batch execution, wastage' },
  ];

  const rolesMap = new Map();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    rolesMap.set(r.name, role);
  }

  // 2. Create Granular Permissions
  const permissionsData = [
    { code: 'sales.view', name: 'View Sales', module: 'sales' },
    { code: 'sales.create', name: 'Create Sales Orders', module: 'sales' },
    { code: 'customers.create', name: 'Create Customers', module: 'sales' },
    { code: 'raw_material.purchase_request.create', name: 'Initiate RM Purchase Request', module: 'procurement' },
    { code: 'raw_material.purchase_order.create', name: 'Create Purchase Order', module: 'procurement' },
    { code: 'raw_material.purchase_order.approve', name: 'Approve Purchase Order', module: 'procurement' },
    { code: 'raw_material.purchase_payment.approve', name: 'Approve Supplier Payment', module: 'accounts' },
    { code: 'stock.view', name: 'View Stock', module: 'stock' },
    { code: 'stock.adjust', name: 'Adjust Stock', module: 'stock' },
    { code: 'production.view', name: 'View Production', module: 'production' },
    { code: 'production.create', name: 'Create Production Order', module: 'production' },
    { code: 'production.start', name: 'Start Production Batch', module: 'production' },
    { code: 'accounts.view', name: 'View Accounts', module: 'accounts' },
    { code: 'accounts.export', name: 'Export to CA', module: 'accounts' },
    { code: 'users.create', name: 'Create Users', module: 'admin' },
  ];

  const permMap = new Map();
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
    permMap.set(p.code, perm);

    // Assign ALL permissions to SUPER_ADMIN
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rolesMap.get('SUPER_ADMIN').id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: rolesMap.get('SUPER_ADMIN').id,
        permissionId: perm.id,
      },
    });
  }

  // Assign specific Sales permissions to SALES role
  const salesPermissions = [
    'sales.view',
    'sales.create',
    'customers.create',
    'raw_material.purchase_request.create',
    'raw_material.purchase_order.create',
    'stock.view',
    'production.view',
  ];
  for (const code of salesPermissions) {
    const perm = permMap.get(code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: rolesMap.get('SALES').id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: rolesMap.get('SALES').id,
          permissionId: perm.id,
        },
      });
    }
  }

  // 3. Create Users with Quick Login credentials
  const defaultPassword = await bcrypt.hash('Ghanshyam@2026', 10);

  const usersData = [
    { email: 'admin@ghanshyamerp.local', name: 'Super Admin', role: 'SUPER_ADMIN', dept: 'Management' },
    { email: 'sales@ghanshyamerp.local', name: 'Sales Executive', role: 'SALES', dept: 'Sales' },
    { email: 'stock@ghanshyamerp.local', name: 'Stock Manager', role: 'STOCK_MANAGER', dept: 'Inventory' },
    { email: 'accounts@ghanshyamerp.local', name: 'Head Accountant', role: 'ACCOUNTANT', dept: 'Accounts' },
    { email: 'production@ghanshyamerp.local', name: 'Production Supervisor', role: 'PRODUCTION', dept: 'Production' },
  ];

  const userMap = new Map();
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: defaultPassword,
        department: u.dept,
        designation: `${u.role} Manager`,
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        userRoles: {
          create: {
            roleId: rolesMap.get(u.role).id,
          },
        },
      },
    });
    userMap.set(u.email, user);
    console.log(`👤 Seeded user: ${u.email} (${u.role})`);
  }

  // 4. Create Categories & Products
  const churnaCat = await prisma.productCategory.upsert({
    where: { name: 'Herbal Churna' },
    update: {},
    create: { name: 'Herbal Churna', description: 'Ayurvedic Powders & Digestives' },
  });
  const syrupCat = await prisma.productCategory.upsert({
    where: { name: 'Herbal Syrup' },
    update: {},
    create: { name: 'Herbal Syrup', description: 'Cough & Health Syrups' },
  });
  const soapCat = await prisma.productCategory.upsert({
    where: { name: 'Herbal Skin Care' },
    update: {},
    create: { name: 'Herbal Skin Care', description: 'Natural Soaps & Lotions' },
  });
  const oilCat = await prisma.productCategory.upsert({
    where: { name: 'Ayurvedic Oils' },
    update: {},
    create: { name: 'Ayurvedic Oils', description: 'Hair & Pain Relief Oils' },
  });

  const productsData = [
    {
      sku: 'KAY-100G',
      name: 'Kayam Churna',
      categoryId: churnaCat.id,
      unit: 'BOTTLE',
      packSize: '100g',
      mrp: 110,
      b2bPrice: 80,
      b2cPrice: 105,
      distributorPrice: 70,
      gstRate: 12,
      hsnCode: '30049011',
      shelfLifeMonths: 36,
      minStock: 100,
      reorderLevel: 250,
    },
    {
      sku: 'CS-200ML',
      name: 'Ayurvedic Cough Syrup',
      categoryId: syrupCat.id,
      unit: 'BOTTLE',
      packSize: '200ml',
      mrp: 145,
      b2bPrice: 100,
      b2cPrice: 135,
      distributorPrice: 90,
      gstRate: 12,
      hsnCode: '30049011',
      shelfLifeMonths: 24,
      minStock: 80,
      reorderLevel: 200,
    },
    {
      sku: 'NEEM-125G',
      name: 'Neem Soap',
      categoryId: soapCat.id,
      unit: 'BAR',
      packSize: '125g',
      mrp: 60,
      b2bPrice: 38,
      b2cPrice: 55,
      distributorPrice: 32,
      gstRate: 18,
      hsnCode: '34011110',
      shelfLifeMonths: 24,
      minStock: 150,
      reorderLevel: 300,
    },
    {
      sku: 'HO-200ML',
      name: 'Ayurvedic Hair Oil',
      categoryId: oilCat.id,
      unit: 'BOTTLE',
      packSize: '200ml',
      mrp: 220,
      b2bPrice: 150,
      b2cPrice: 200,
      distributorPrice: 135,
      gstRate: 18,
      hsnCode: '33059011',
      shelfLifeMonths: 36,
      minStock: 60,
      reorderLevel: 150,
    },
    {
      sku: 'PO-100ML',
      name: 'Ayurvedic Pain Oil',
      categoryId: oilCat.id,
      unit: 'BOTTLE',
      packSize: '100ml',
      mrp: 190,
      b2bPrice: 130,
      b2cPrice: 175,
      distributorPrice: 115,
      gstRate: 12,
      hsnCode: '30049011',
      shelfLifeMonths: 36,
      minStock: 50,
      reorderLevel: 120,
    },
  ];

  const productMap = new Map();
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    productMap.set(p.sku, prod);

    // Initial finished goods stock
    await prisma.stockBalance.upsert({
      where: { itemId: prod.id },
      update: { quantity: 250 },
      create: {
        itemType: 'FINISHED_PRODUCT',
        itemId: prod.id,
        quantity: 250,
        reservedQuantity: 0,
        unit: prod.unit,
      },
    });
  }

  // 5. Create Raw Materials & Categories
  const herbsCat = await prisma.rawMaterialCategory.upsert({
    where: { name: 'Herbs & Powders' },
    update: {},
    create: { name: 'Herbs & Powders' },
  });
  const oilsRMCat = await prisma.rawMaterialCategory.upsert({
    where: { name: 'Extracts & Base Oils' },
    update: {},
    create: { name: 'Extracts & Base Oils' },
  });
  const pkgCat = await prisma.rawMaterialCategory.upsert({
    where: { name: 'Packaging Materials' },
    update: {},
    create: { name: 'Packaging Materials' },
  });

  const rawMaterialsData = [
    { sku: 'RM-SENNA', name: 'Senna Leaf Powder', categoryId: herbsCat.id, unit: 'KG', currentStock: 450, minStock: 50, purchasePrice: 120, gstRate: 5 },
    { sku: 'RM-MULETHI', name: 'Mulethi Powder', categoryId: herbsCat.id, unit: 'KG', currentStock: 300, minStock: 40, purchasePrice: 280, gstRate: 5 },
    { sku: 'RM-NEEM-EXT', name: 'Pure Neem Extract', categoryId: oilsRMCat.id, unit: 'LTR', currentStock: 200, minStock: 30, purchasePrice: 450, gstRate: 12 },
    { sku: 'RM-SESAME-OIL', name: 'Til / Sesame Oil', categoryId: oilsRMCat.id, unit: 'LTR', currentStock: 600, minStock: 100, purchasePrice: 220, gstRate: 5 },
    { sku: 'RM-EUCALYPTUS', name: 'Nilgiri / Eucalyptus Oil', categoryId: oilsRMCat.id, unit: 'LTR', currentStock: 150, minStock: 25, purchasePrice: 850, gstRate: 12 },
    { sku: 'RM-BOTTLE-200ML', name: 'PET Bottles 200ml', categoryId: pkgCat.id, unit: 'PCS', currentStock: 5000, minStock: 1000, purchasePrice: 4.5, gstRate: 18 },
    { sku: 'RM-CAPS-SET', name: 'Seal Caps & Wrappers', categoryId: pkgCat.id, unit: 'PCS', currentStock: 10000, minStock: 2000, purchasePrice: 1.2, gstRate: 18 },
    { sku: 'RM-CARTONS-100G', name: 'Printed Outer Cartons 100g', categoryId: pkgCat.id, unit: 'PCS', currentStock: 4000, minStock: 800, purchasePrice: 3.5, gstRate: 18 },
  ];

  const rmMap = new Map();
  for (const rm of rawMaterialsData) {
    const raw = await prisma.rawMaterial.upsert({
      where: { sku: rm.sku },
      update: { currentStock: rm.currentStock },
      create: rm,
    });
    rmMap.set(rm.sku, raw);

    await prisma.stockBalance.upsert({
      where: { itemId: raw.id },
      update: { quantity: rm.currentStock },
      create: {
        itemType: 'RAW_MATERIAL',
        itemId: raw.id,
        quantity: rm.currentStock,
        reservedQuantity: 0,
        unit: raw.unit,
      },
    });
  }

  // 6. Create BOM / Formulations
  const kayamProd = productMap.get('KAY-100G');
  if (kayamProd) {
    await prisma.productBOM.upsert({
      where: { productId_version: { productId: kayamProd.id, version: 'v1.0' } },
      update: {},
      create: {
        productId: kayamProd.id,
        version: 'v1.0',
        expectedYield: 100, // 100 bottles yield
        expectedWastage: 3.0,
        processSteps: '1. Herbal Sorting -> 2. Pulverizing / Grinding -> 3. Sifting -> 4. Bottle Filling -> 5. Sealing',
        bomItems: {
          create: [
            { rawMaterialId: rmMap.get('RM-SENNA').id, quantity: 8.5, unit: 'KG', itemType: 'RAW_MATERIAL' },
            { rawMaterialId: rmMap.get('RM-MULETHI').id, quantity: 2.0, unit: 'KG', itemType: 'RAW_MATERIAL' },
            { rawMaterialId: rmMap.get('RM-CARTONS-100G').id, quantity: 100, unit: 'PCS', itemType: 'PACKAGING' },
            { rawMaterialId: rmMap.get('RM-CAPS-SET').id, quantity: 100, unit: 'PCS', itemType: 'PACKAGING' },
          ],
        },
      },
    });
  }

  // 7. Create Customers & Suppliers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cust-b2b-01' },
    update: {},
    create: {
      id: 'cust-b2b-01',
      name: 'Gujarat Herbal Distributors',
      companyName: 'Gujarat Herbal Distributors Pvt Ltd',
      customerType: 'B2B',
      gstin: '24AAACG8899K1Z4',
      pan: 'AAACG8899K',
      phone: '+91 98250 12345',
      whatsapp: '+91 98250 12345',
      email: 'orders@gujaratherbal.com',
      billingAddress: 'GIDC Industrial Area, Sector 3',
      shippingAddress: 'GIDC Industrial Area, Sector 3',
      city: 'Rajkot',
      state: 'Gujarat',
      pincode: '360003',
      creditLimit: 500000,
    },
  });

  const supplier1 = await prisma.supplier.upsert({
    where: { id: 'supp-01' },
    update: {},
    create: {
      id: 'supp-01',
      name: 'Saurashtra Herbs & Spices',
      companyName: 'Saurashtra Herbs Pvt Ltd',
      gstin: '24AAAFS4411L1Z9',
      phone: '+91 94260 99887',
      email: 'sales@saurashtraherbs.com',
      address: 'Grain Market Road',
      city: 'Jamnagar',
      state: 'Gujarat',
      pincode: '361001',
      leadTimeDays: 3,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
