import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaReviewStatus } from '../ca-export/ca-export.types';

@Injectable()
export class CaReviewService {
  constructor(private prisma: PrismaService) {}

  // Create initial review tracking record
  async createReview(exportPackageId: string, status: CaReviewStatus = 'SENT', comments?: string, organizationId: string = 'org-default') {
    const pkg = await this.prisma.caExportPackage.findUnique({ where: { id: exportPackageId } });
    if (!pkg) throw new NotFoundException('CA Export Package not found');

    const review = await this.prisma.caReview.create({
      data: {
        organizationId,
        exportPackageId,
        status,
        comments,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CA_REVIEW_STATUS_CHANGED',
        entity: 'CaReview',
        entityId: review.id,
        newValue: JSON.stringify({ exportPackageId, status, comments }),
      },
    });

    return review;
  }

  // Update Review Status transition
  async updateReviewStatus(
    id: string,
    status: CaReviewStatus,
    reviewedBy?: string,
    comments?: string,
    organizationId?: string
  ) {
    const review = await this.prisma.caReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('CA Review record not found');
    if (organizationId && review.organizationId !== organizationId) {
      throw new NotFoundException('CA Review record not found for organization');
    }

    const updated = await this.prisma.caReview.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewedBy || review.reviewedBy,
        comments: comments || review.comments,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CA_REVIEW_STATUS_UPDATED',
        entity: 'CaReview',
        entityId: id,
        newValue: JSON.stringify({ previousStatus: review.status, newStatus: status, reviewedBy, comments }),
      },
    });

    return updated;
  }

  // Get Review History for an Export Package
  async getReviewHistory(exportPackageId: string, organizationId?: string) {
    const reviews = await this.prisma.caReview.findMany({
      where: { exportPackageId },
      orderBy: { createdAt: 'desc' },
    });
    return reviews;
  }
}
