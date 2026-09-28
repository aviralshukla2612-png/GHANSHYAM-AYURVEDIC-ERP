import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        userRoles: { include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        department: u.department,
        designation: u.designation,
        employeeId: u.employeeId,
        isActive: u.isActive,
        roles: (u.userRoles || [])
          .map((ur) => ur?.role?.name)
          .filter((name): name is string => Boolean(name)),
        createdAt: u.createdAt,
      })),
    };
  }

  async createUser(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    designation?: string;
    employeeId?: string;
    roleName: string;
  }) {
    const hash = await bcrypt.hash(data.password || 'Ghanshyam@2026', 10);
    const role = await this.prisma.role.findUnique({ where: { name: data.roleName } });
    if (!role) throw new NotFoundException(`Role ${data.roleName} not found`);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        phone: data.phone,
        department: data.department || 'General',
        designation: data.designation || 'Staff',
        employeeId: data.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        userRoles: {
          create: { roleId: role.id },
        },
      },
      include: { userRoles: { include: { role: true } } },
    });

    return { success: true, message: 'User created successfully', data: user };
  }
}
