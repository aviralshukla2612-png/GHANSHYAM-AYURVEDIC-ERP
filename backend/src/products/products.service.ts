import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
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

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        boms: {
          where: { isActive: true },
          include: {
            bomItems: {
              include: { rawMaterial: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: products };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        boms: {
          include: {
            bomItems: {
              include: { rawMaterial: true },
            },
          },
        },
        productionBatches: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return { success: true, data: product };
  }

  async create(data: any) {
    const product = await this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        categoryId: data.categoryId,
        productType: data.productType || 'FINISHED_GOODS',
        description: data.description,
        unit: data.unit || 'BOTTLE',
        packSize: data.packSize || '100g',
        mrp: Number(data.mrp),
        b2bPrice: Number(data.b2bPrice),
        b2cPrice: Number(data.b2cPrice),
        distributorPrice: Number(data.distributorPrice),
        gstRate: Number(data.gstRate || 12),
        hsnCode: data.hsnCode || '30049011',
        shelfLifeMonths: Number(data.shelfLifeMonths || 24),
        minStock: Number(data.minStock || 50),
        maxStock: Number(data.maxStock || 1000),
        reorderLevel: Number(data.reorderLevel || 100),
        imageUrl: data.imageUrl,
        barcode: data.barcode,
      },
    });

    // Also initialize StockBalance if not existing
    await this.prisma.stockBalance.upsert({
      where: { itemId: product.id },
      create: {
        itemType: 'FINISHED_PRODUCT',
        itemId: product.id,
        quantity: 0,
        unit: product.unit,
      },
      update: {},
    });

    return { success: true, message: 'Product created successfully', data: product };
  }

  async update(id: string, data: any) {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        mrp: data.mrp !== undefined ? Number(data.mrp) : undefined,
        b2bPrice: data.b2bPrice !== undefined ? Number(data.b2bPrice) : undefined,
        b2cPrice: data.b2cPrice !== undefined ? Number(data.b2cPrice) : undefined,
        distributorPrice: data.distributorPrice !== undefined ? Number(data.distributorPrice) : undefined,
        minStock: data.minStock !== undefined ? Number(data.minStock) : undefined,
        reorderLevel: data.reorderLevel !== undefined ? Number(data.reorderLevel) : undefined,
        isActive: data.isActive,
      },
    });
    return { success: true, message: 'Product updated successfully', data: product };
  }

  async getCategories() {
    const categories = await this.prisma.productCategory.findMany({
      include: { _count: { select: { products: true } } },
    });
    return { success: true, data: categories };
  }
}
