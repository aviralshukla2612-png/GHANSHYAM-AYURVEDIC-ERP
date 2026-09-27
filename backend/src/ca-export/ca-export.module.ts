import { Module } from '@nestjs/common';
import { CAExportService } from './ca-export.service';
import { CAExportController } from './ca-export.controller';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  providers: [CAExportService],
  controllers: [CAExportController],
  exports: [CAExportService],
})
export class CAExportModule {}
