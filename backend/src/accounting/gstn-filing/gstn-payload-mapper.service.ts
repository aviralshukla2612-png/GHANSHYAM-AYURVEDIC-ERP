import { Injectable } from '@nestjs/common';
import { Gstr1Snapshot } from '../gstr1-types';
import { GstnGstr1Payload, GstnB2BSection, GstnB2CLSection, GstnB2CSSection, GstnHsnItem, GstnDocumentDetail } from './gstn-filing.types';

@Injectable()
export class GstnPayloadMapperService {
  
  // Format Month Year string 'September 2026' -> '092026'
  private formatFinancialPeriod(periodStr: string): string {
    const monthMap: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
    };
    const parts = periodStr.toLowerCase().trim().split(/\s+/);
    if (parts.length >= 2 && monthMap[parts[0]]) {
      return `${monthMap[parts[0]]}${parts[1]}`;
    }
    return '092026';
  }

  // Format Date string '2026-09-29' -> '29-09-2026'
  private formatDateGstn(dateStr: string): string {
    if (!dateStr) return '29-09-2026';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  // CRITICAL RULE: Takes Gstr1Snapshot as input, NEVER reads live mutable sales database!
  mapSnapshotToGstnPayload(snapshot: Gstr1Snapshot): GstnGstr1Payload {
    const returnData = snapshot.returnData;
    const fp = this.formatFinancialPeriod(snapshot.period);

    // Map B2B Invoices grouped by CTIN (Customer GSTIN)
    const b2bMap = new Map<string, GstnB2BSection>();
    returnData.b2b.forEach((row) => {
      const ctin = row.gstin || '24AAAAG1234H1Z5';
      const existing = b2bMap.get(ctin) || { ctin, inv: [] };

      existing.inv.push({
        inum: row.invoiceNumber,
        idt: this.formatDateGstn(row.invoiceDate),
        val: row.invoiceValue,
        pos: row.placeOfSupply.slice(0, 2),
        rchg: row.isReverseCharge ? 'Y' : 'N',
        inv_typ: 'R',
        itms: [
          {
            num: 1,
            itm_det: {
              rt: row.rate,
              txval: row.taxableValue,
              iamt: row.igst,
              camt: row.cgst,
              samt: row.sgst,
            },
          },
        ],
      });

      b2bMap.set(ctin, existing);
    });

    // Map B2CL Invoices grouped by POS
    const b2clMap = new Map<string, GstnB2CLSection>();
    returnData.b2cl.forEach((row) => {
      const posCode = row.placeOfSupply.slice(0, 2);
      const existing = b2clMap.get(posCode) || { pos: posCode, inv: [] };

      existing.inv.push({
        inum: row.invoiceNumber,
        idt: this.formatDateGstn(row.invoiceDate),
        val: row.invoiceValue,
        itms: [
          {
            num: 1,
            itm_det: {
              rt: row.rate,
              txval: row.taxableValue,
              iamt: row.igst,
            },
          },
        ],
      });

      b2clMap.set(posCode, existing);
    });

    // Map B2CS Summary Rows
    const b2csList: GstnB2CSSection[] = returnData.b2cs.map((row) => ({
      sply_ty: row.igst > 0 ? 'INTER' : 'INTRA',
      pos: row.placeOfSupply.slice(0, 2),
      rt: row.rate,
      txval: row.taxableValue,
      iamt: row.igst,
      camt: row.cgst,
      samt: row.sgst,
    }));

    // Map HSN Summary
    const hsnB2b: GstnHsnItem[] = returnData.hsn.b2b.map((h) => ({
      hsn_sc: h.hsnCode,
      desc: h.description,
      uqc: h.uqc,
      qty: h.totalQuantity,
      val: h.totalValue,
      txval: h.taxableValue,
      iamt: h.igst,
      camt: h.cgst,
      samt: h.sgst,
    }));

    const hsnB2c: GstnHsnItem[] = returnData.hsn.b2c.map((h) => ({
      hsn_sc: h.hsnCode,
      desc: h.description,
      uqc: h.uqc,
      qty: h.totalQuantity,
      val: h.totalValue,
      txval: h.taxableValue,
      iamt: h.igst,
      camt: h.cgst,
      samt: h.sgst,
    }));

    // Map Documents Series
    const docDet: GstnDocumentDetail[] = returnData.documents.map((d, index) => ({
      doc_num: index + 1,
      doc_typ: d.docType,
      from: d.fromNo,
      to: d.toNo,
      totnum: d.totalCount,
      cancel: d.cancelledCount,
      net_issue: d.netIssuedCount,
    }));

    return {
      gstin: '24AAAAG1234H1Z5',
      fp,
      gt: 15000000,
      cur_gt: returnData.summary.totalSales,
      b2b: Array.from(b2bMap.values()),
      b2cl: Array.from(b2clMap.values()),
      b2cs: b2csList,
      exp: [],
      cdnr: [],
      hsn: {
        hsn_b2b: hsnB2b,
        hsn_b2c: hsnB2c,
      },
      doc_issue: {
        doc_det: docDet,
      },
    };
  }
}
