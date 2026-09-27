import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class CAExportService {
  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
  ) {}

  async getHistory() {
    const exports = await this.prisma.cAExport.findMany({
      include: { files: true, exporter: true },
      orderBy: { generatedAt: 'desc' },
    });
    return { success: true, data: exports };
  }

  async generateAndSendPackage(period: string, userId: string, customCaPhone?: string) {
    const exportNo = `CA-EXP-${Date.now().toString().slice(-6)}`;
    const caPhone = customCaPhone || process.env.CA_WHATSAPP_NUMBER || '+917383198428';

    // 1. Generate package files metadata
    const generatedFiles = [
      { fileName: `Sales_Register_${period}.xlsx`, fileType: 'EXCEL', fileUrl: `/exports/Sales_Register_${period}.xlsx`, fileSizeKb: 245.8 },
      { fileName: `Purchase_Register_${period}.xlsx`, fileType: 'EXCEL', fileUrl: `/exports/Purchase_Register_${period}.xlsx`, fileSizeKb: 188.2 },
      { fileName: `GST_Summary_${period}.xlsx`, fileType: 'EXCEL', fileUrl: `/exports/GST_Summary_${period}.xlsx`, fileSizeKb: 112.4 },
      { fileName: `Profit_And_Loss_${period}.xlsx`, fileType: 'EXCEL', fileUrl: `/exports/Profit_And_Loss_${period}.xlsx`, fileSizeKb: 95.6 },
      { fileName: `Stock_Summary_${period}.xlsx`, fileType: 'EXCEL', fileUrl: `/exports/Stock_Summary_${period}.xlsx`, fileSizeKb: 140.1 },
      { fileName: `CA_Summary_Report_${period}.pdf`, fileType: 'PDF', fileUrl: `/exports/CA_Summary_Report_${period}.pdf`, fileSizeKb: 520.0 },
    ];

    // 2. Create CAExport database entry
    const caExport = await this.prisma.cAExport.create({
      data: {
        exportNo,
        period,
        generatedBy: userId,
        status: 'SENDING',
        files: {
          create: generatedFiles,
        },
      },
      include: { files: true },
    });

    // 3. Send package via WhatsApp Cloud API
    try {
      const result = await this.whatsAppService.sendCAPackage(caPhone, period, {
        exportNo,
        fileUrls: generatedFiles.map((f) => f.fileUrl),
      });

      const updated = await this.prisma.cAExport.update({
        where: { id: caExport.id },
        data: {
          status: 'DELIVERED',
          whatsappMsgId: result.messageId,
        },
        include: { files: true },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'CA_EXPORT_SENT',
          entity: 'CAExport',
          entityId: caExport.id,
          newValue: JSON.stringify({ exportNo, period, status: 'DELIVERED' }),
        },
      });

      return {
        success: true,
        message: `CA Financial Package generated & successfully dispatched to WhatsApp (${caPhone}).`,
        data: updated,
      };
    } catch (error: any) {
      await this.prisma.cAExport.update({
        where: { id: caExport.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  async retrySend(id: string) {
    const caExport = await this.prisma.cAExport.findUnique({
      where: { id },
      include: { files: true },
    });
    if (!caExport) throw new NotFoundException('Export record not found');

    const caPhone = process.env.CA_WHATSAPP_NUMBER || '+917383198428';
    const result = await this.whatsAppService.sendCAPackage(caPhone, caExport.period, {
      exportNo: caExport.exportNo,
      fileUrls: caExport.files.map((f) => f.fileUrl),
    });

    const updated = await this.prisma.cAExport.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        whatsappMsgId: result.messageId,
        errorMessage: null,
      },
      include: { files: true },
    });

    return { success: true, message: 'CA Export resent successfully', data: updated };
  }
}
