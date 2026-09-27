import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { RawMaterialsModule } from './raw-materials/raw-materials.module';
import { BOMModule } from './bom/bom.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductionModule } from './production/production.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { AccountingModule } from './accounting/accounting.module';
import { CAExportModule } from './ca-export/ca-export.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { RawMaterialRequestsModule } from './raw-material-requests/raw-material-requests.module';
import { HealthModule } from './health/health.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    RawMaterialsModule,
    BOMModule,
    InventoryModule,
    ProductionModule,
    SalesModule,
    PurchasesModule,
    DispatchModule,
    AccountingModule,
    CAExportModule,
    WhatsAppModule,
    NotificationsModule,
    AuditModule,
    CustomersModule,
    SuppliersModule,
    RawMaterialRequestsModule,
    HealthModule,
    SystemModule,
  ],
})
export class AppModule {}
