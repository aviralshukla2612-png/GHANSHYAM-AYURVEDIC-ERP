import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CaReviewService } from './ca-review.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CaReviewStatus } from '../ca-export/ca-export.types';

@Controller('api/accounting/ca-review')
@UseGuards(JwtAuthGuard)
export class CaReviewController {
  constructor(private readonly caReviewService: CaReviewService) {}

  @Post()
  async createReview(
    @Body() data: { exportPackageId: string; status?: CaReviewStatus; comments?: string },
    @Req() req?: any
  ) {
    const tenantId = req?.user?.organizationId || 'org-default';
    const review = await this.caReviewService.createReview(data.exportPackageId, data.status || 'SENT', data.comments, tenantId);
    return { success: true, message: 'CA Review record created', data: review };
  }

  @Patch(':id')
  async updateReviewStatus(
    @Param('id') id: string,
    @Body() data: { status: CaReviewStatus; reviewedBy?: string; comments?: string },
    @Req() req?: any
  ) {
    const tenantId = req?.user?.organizationId;
    const reviewedBy = data.reviewedBy || req?.user?.name || 'CA Auditor';
    const updated = await this.caReviewService.updateReviewStatus(id, data.status, reviewedBy, data.comments, tenantId);
    return { success: true, message: `CA Review status updated to ${data.status}`, data: updated };
  }

  @Get('package/:packageId')
  async getReviewHistory(@Param('packageId') packageId: string, @Req() req?: any) {
    const tenantId = req?.user?.organizationId;
    const history = await this.caReviewService.getReviewHistory(packageId, tenantId);
    return { success: true, data: history };
  }
}
