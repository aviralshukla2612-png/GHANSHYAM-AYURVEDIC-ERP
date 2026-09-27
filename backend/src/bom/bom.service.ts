import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BOMService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const boms = await this.prisma.productBOM.findMany({
      include: {
        product: true,
        bomItems: {
          include: { rawMaterial: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: boms };
  }

  async findByProduct(productId: string) {
    const boms = await this.prisma.productBOM.findMany({
      where: { productId },
      include: {
        bomItems: {
          include: { rawMaterial: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: boms };
  }

  async create(data: {
    productId: string;
    version: string;
    expectedYield: number;
    expectedWastage: number;
    processSteps?: string;
    items: Array<{ rawMaterialId: string; quantity: number; unit: string; itemType?: string }>;
  }) {
    const bom = await this.prisma.productBOM.create({
      data: {
        productId: data.productId,
        version: data.version || 'v1.0',
        expectedYield: Number(data.expectedYield || 100),
        expectedWastage: Number(data.expectedWastage || 3.0),
        processSteps: data.processSteps,
        bomItems: {
          create: data.items.map((item) => ({
            rawMaterialId: item.rawMaterialId,
            quantity: Number(item.quantity),
            unit: item.unit,
            itemType: item.itemType || 'RAW_MATERIAL',
          })),
        },
      },
      include: {
        product: true,
        bomItems: { include: { rawMaterial: true } },
      },
    });

    return { success: true, message: 'BOM created successfully', data: bom };
  }
}
