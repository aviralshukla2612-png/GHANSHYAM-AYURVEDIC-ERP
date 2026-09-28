import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(loginDto.password || '', user.password || '');
    } catch {
      isMatch = false;
    }
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    const roles = (user.userRoles || [])
      .map((ur) => ur?.role?.name)
      .filter((name): name is string => Boolean(name));

    const permissions = new Set<string>();
    (user.userRoles || []).forEach((ur) => {
      ur?.role?.rolePermissions?.forEach((rp) => {
        if (rp?.permission?.code) {
          permissions.add(rp.permission.code);
        }
      });
    });

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions: Array.from(permissions),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'ghanshyam_ayurvedic_erp_super_secret_refresh_key_2026',
      expiresIn: '7d',
    });

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress: ipAddress || '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }).catch(() => null);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: ipAddress || '127.0.0.1',
      },
    }).catch(() => null);

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          designation: user.designation,
          employeeId: user.employeeId,
          roles,
          permissions: Array.from(permissions),
        },
      },
    };
  }

  async logout(userId: string) {
    // Delete active sessions for user in DB
    await this.prisma.session.deleteMany({
      where: { userId },
    }).catch(() => null);

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: userId,
      },
    }).catch(() => null);

    return { success: true, message: 'Successfully logged out and revoked sessions' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const roles = (user.userRoles || [])
      .map((ur) => ur?.role?.name)
      .filter((name): name is string => Boolean(name));

    const permissions = new Set<string>();
    (user.userRoles || []).forEach((ur) => {
      ur?.role?.rolePermissions?.forEach((rp) => {
        if (rp?.permission?.code) {
          permissions.add(rp.permission.code);
        }
      });
    });

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        designation: user.designation,
        employeeId: user.employeeId,
        roles,
        permissions: Array.from(permissions),
      },
    };
  }
}
