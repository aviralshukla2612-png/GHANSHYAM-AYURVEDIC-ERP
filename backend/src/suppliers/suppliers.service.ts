import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany({
      include: { rawMaterials: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: suppliers };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { rawMaterials: true, purchaseOrders: true },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return { success: true, data: supplier };
  }

  async create(data: any) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        gstin: data.gstin,
        pan: data.pan,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        email: data.email,
        address: data.address || 'Industrial Estate',
        city: data.city || 'Rajkot',
        state: data.state || 'Gujarat',
        pincode: data.pincode || '360002',
      },
    });
    return { success: true, message: 'Supplier created', data: supplier };
  }
}
