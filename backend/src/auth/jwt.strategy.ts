import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'ghanshyam_ayurvedic_erp_super_secret_jwt_key_2026',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
      employeeId: user.employeeId,
      roles,
      permissions: Array.from(permissions),
    };
  }
}
