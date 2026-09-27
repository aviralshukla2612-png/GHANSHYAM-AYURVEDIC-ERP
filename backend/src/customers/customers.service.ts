import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: customers };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { salesOrders: true, invoices: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return { success: true, data: customer };
  }

  async create(data: any) {
    const customer = await this.prisma.customer.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        customerType: data.customerType || 'B2B',
        gstin: data.gstin,
        pan: data.pan,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        email: data.email,
        billingAddress: data.billingAddress || 'Default Address',
        shippingAddress: data.shippingAddress || data.billingAddress || 'Default Address',
        state: data.state || 'Gujarat',
        city: data.city || 'Rajkot',
        pincode: data.pincode || '360002',
        creditLimit: Number(data.creditLimit || 100000),
      },
    });
    return { success: true, message: 'Customer created', data: customer };
  }
}
