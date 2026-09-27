import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RawMaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; categoryId?: string }) {
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { sku: { contains: query.search } },
      ];
    }
    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    const materials = await this.prisma.rawMaterial.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: materials };
  }

  async findOne(id: string) {
    const material = await this.prisma.rawMaterial.findUnique({
      where: { id },
      include: { category: true, supplier: true },
    });
    if (!material) throw new NotFoundException('Raw Material not found');
    return { success: true, data: material };
  }

  async create(data: any) {
    const material = await this.prisma.rawMaterial.create({
      data: {
        sku: data.sku,
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        supplierId: data.supplierId || null,
        currentStock: Number(data.currentStock || 0),
        minStock: Number(data.minStock || 10),
        reorderLevel: Number(data.reorderLevel || 25),
        maxStock: Number(data.maxStock || 500),
        purchasePrice: Number(data.purchasePrice || 0),
        gstRate: Number(data.gstRate || 18),
        storageLocation: data.storageLocation || 'MAIN_STORE',
      },
    });

    await this.prisma.stockBalance.upsert({
      where: { itemId: material.id },
      create: {
        itemType: 'RAW_MATERIAL',
        itemId: material.id,
        quantity: material.currentStock,
        unit: material.unit,
      },
      update: {
        quantity: material.currentStock,
      },
    });

    return { success: true, message: 'Raw material created', data: material };
  }

  async getCategories() {
    const categories = await this.prisma.rawMaterialCategory.findMany({
      include: { _count: { select: { materials: true } } },
    });
    return { success: true, data: categories };
  }
}
