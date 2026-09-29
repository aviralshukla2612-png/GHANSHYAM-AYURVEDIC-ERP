import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Gstr1ReturnData, Gstr1ReconciliationReport, GstExceptionSummary } from '../gstr1-types';

@Injectable()
export class ExcelGeneratorService {
  async generateCaExcelWorkbook(
    returnData: Gstr1ReturnData,
    reconReport?: Gstr1ReconciliationReport,
    exceptions?: GstExceptionSummary
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ghanshyam Ayurvedic Pharmacy ERP';
    workbook.created = new Date();

    // 1. GSTR-1 Summary Sheet
    const summarySheet = workbook.addWorksheet('GSTR-1 Summary');
    summarySheet.columns = [
      { header: 'Metric / Section', key: 'metric', width: 35 },
      { header: 'Value (INR) / Count', key: 'val', width: 25 },
    ];
    summarySheet.addRows([
      { metric: 'Return Period', val: returnData.period },
      { metric: 'Generated At', val: returnData.generatedAt },
      { metric: 'Total Outward Sales', val: returnData.summary.totalSales },
      { metric: 'Total Taxable Value', val: returnData.summary.totalTaxable },
      { metric: 'Total CGST', val: returnData.summary.totalCgst },
      { metric: 'Total SGST', val: returnData.summary.totalSgst },
      { metric: 'Total IGST', val: returnData.summary.totalIgst },
      { metric: 'Total Tax Output', val: returnData.summary.totalTax },
      { metric: 'Table 4 B2B Invoice Count', val: returnData.summary.b2bCount },
      { metric: 'Table 5 B2CL Invoice Count', val: returnData.summary.b2clCount },
      { metric: 'Table 7 B2CS Summary Rows', val: returnData.summary.b2csCount },
      { metric: 'Table 6 Export Count', val: returnData.summary.exportCount },
      { metric: 'Table 9 Credit/Debit Notes Count', val: returnData.summary.cdnrCount },
    ]);

    // 2. B2B Sheet
    const b2bSheet = workbook.addWorksheet('B2B');
    b2bSheet.columns = [
      { header: 'GSTIN of Supplier/Customer', key: 'gstin', width: 20 },
      { header: 'Receiver Name', key: 'customerName', width: 30 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
      { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
      { header: 'Invoice Value (₹)', key: 'invoiceValue', width: 18 },
      { header: 'Place of Supply', key: 'placeOfSupply', width: 20 },
      { header: 'Rate (%)', key: 'rate', width: 10 },
      { header: 'Taxable Value (₹)', key: 'taxableValue', width: 18 },
      { header: 'CGST (₹)', key: 'cgst', width: 15 },
      { header: 'SGST (₹)', key: 'sgst', width: 15 },
      { header: 'IGST (₹)', key: 'igst', width: 15 },
    ];
    b2bSheet.addRows(returnData.b2b);

    // 3. B2CL Sheet
    const b2clSheet = workbook.addWorksheet('B2CL');
    b2clSheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
      { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
      { header: 'Invoice Value (₹)', key: 'invoiceValue', width: 18 },
      { header: 'Place of Supply', key: 'placeOfSupply', width: 20 },
      { header: 'Rate (%)', key: 'rate', width: 10 },
      { header: 'Taxable Value (₹)', key: 'taxableValue', width: 18 },
      { header: 'IGST (₹)', key: 'igst', width: 15 },
    ];
    b2clSheet.addRows(returnData.b2cl);

    // 4. B2CS Sheet
    const b2csSheet = workbook.addWorksheet('B2CS');
    b2csSheet.columns = [
      { header: 'Place of Supply', key: 'placeOfSupply', width: 20 },
      { header: 'Supply Type', key: 'type', width: 12 },
      { header: 'Rate (%)', key: 'rate', width: 10 },
      { header: 'Taxable Value (₹)', key: 'taxableValue', width: 18 },
      { header: 'CGST (₹)', key: 'cgst', width: 15 },
      { header: 'SGST (₹)', key: 'sgst', width: 15 },
      { header: 'IGST (₹)', key: 'igst', width: 15 },
    ];
    b2csSheet.addRows(returnData.b2cs);

    // 5. Exports Sheet
    const exportSheet = workbook.addWorksheet('Exports');
    exportSheet.columns = [
      { header: 'Export Type', key: 'exportType', width: 20 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
      { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
      { header: 'Invoice Value (₹)', key: 'invoiceValue', width: 18 },
      { header: 'Taxable Value (₹)', key: 'taxableValue', width: 18 },
      { header: 'IGST (₹)', key: 'igst', width: 15 },
    ];
    exportSheet.addRows(returnData.exports);

    // 6. Credit/Debit Notes Sheet
    const cdnrSheet = workbook.addWorksheet('Credit Debit Notes');
    cdnrSheet.columns = [
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Note Type', key: 'noteType', width: 12 },
      { header: 'Note Number', key: 'noteNumber', width: 18 },
      { header: 'Note Date', key: 'noteDate', width: 15 },
      { header: 'Original Invoice No', key: 'originalInvoiceNumber', width: 18 },
      { header: 'Taxable Value (₹)', key: 'taxableValue', width: 18 },
      { header: 'CGST (₹)', key: 'cgst', width: 15 },
      { header: 'SGST (₹)', key: 'sgst', width: 15 },
      { header: 'IGST (₹)', key: 'igst', width: 15 },
    ];
    cdnrSheet.addRows(returnData.creditDebitNotes);

    // 7. HSN B2B Sheet
    const hsnB2bSheet = workbook.addWorksheet('HSN B2B');
    hsnB2bSheet.columns = [
      { header: 'HSN Code', key: 'hsnCode', width: 15 },
      { header: 'Description', key: 'description', width: 25 },
      { header: 'UQC', key: 'uqc', width: 12 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Total Value (₹)', key: 'totalValue', width: 18 },
      { header: 'Taxable Value (₹)', key: 'taxableValue', width: 18 },
      { header: 'CGST (₹)', key: 'cgst', width: 15 },
      { header: 'SGST (₹)', key: 'sgst', width: 15 },
      { header: 'IGST (₹)', key: 'igst', width: 15 },
    ];
    hsnB2bSheet.addRows(returnData.hsn.b2b);

    // 8. HSN B2C Sheet
    const hsnB2cSheet = workbook.addWorksheet('HSN B2C');
    hsnB2cSheet.columns = [
      { header: 'HSN Code', key: 'hsnCode', width: 15 },
      { header: 'Description', key: 'description', width: 25 },
      { header: 'UQC', key: 'uqc', width: 12 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Total Value (₹)', key: 'totalValue', width: 18 },
      { header: 'Taxable Value (₹)', key: 'taxableValue', width: 18 },
      { header: 'CGST (₹)', key: 'cgst', width: 15 },
      { header: 'SGST (₹)', key: 'sgst', width: 15 },
      { header: 'IGST (₹)', key: 'igst', width: 15 },
    ];
    hsnB2cSheet.addRows(returnData.hsn.b2c);

    // 9. Documents Sheet
    const docSheet = workbook.addWorksheet('Documents');
    docSheet.columns = [
      { header: 'Document Type', key: 'docType', width: 30 },
      { header: 'Table Section', key: 'tableSection', width: 15 },
      { header: 'From Serial No', key: 'fromNo', width: 18 },
      { header: 'To Serial No', key: 'toNo', width: 18 },
      { header: 'Total Count', key: 'totalCount', width: 15 },
      { header: 'Cancelled Count', key: 'cancelledCount', width: 15 },
      { header: 'Net Issued Count', key: 'netIssuedCount', width: 15 },
    ];
    docSheet.addRows(returnData.documents);

    // 10. Reconciliation Sheet
    if (reconReport) {
      const reconSheet = workbook.addWorksheet('Reconciliation');
      reconSheet.columns = [
        { header: 'Parameter', key: 'param', width: 30 },
        { header: 'Sales Ledger (₹)', key: 'sales', width: 20 },
        { header: 'GSTR-1 Reported (₹)', key: 'reported', width: 20 },
        { header: 'Variance (₹)', key: 'variance', width: 18 },
      ];
      reconSheet.addRows([
        { param: 'Sales Turnover', sales: reconReport.totalInvoiceTurnover, reported: reconReport.gstr1ReportedTurnover, variance: reconReport.turnoverVariance },
        { param: 'Total Tax Amount', sales: reconReport.totalInvoiceTax, reported: reconReport.gstr1ReportedTax, variance: reconReport.taxVariance },
        { param: 'Reconciliation Status', sales: reconReport.status, reported: reconReport.status, variance: 0 },
      ]);
    }

    // 11. Exceptions Sheet
    if (exceptions) {
      const excSheet = workbook.addWorksheet('Exceptions');
      excSheet.columns = [
        { header: 'Exception Code', key: 'code', width: 25 },
        { header: 'Severity', key: 'severity', width: 15 },
        { header: 'Entity Number', key: 'entityNumber', width: 18 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Message', key: 'message', width: 45 },
      ];
      excSheet.addRows(exceptions.exceptions);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
