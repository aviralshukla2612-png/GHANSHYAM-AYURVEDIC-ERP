'use client';

import { useState } from 'react';
import { FileSpreadsheet, Download, FileText, CheckCircle2, FileDown, Sparkles } from 'lucide-react';

export default function SalesReportsPage() {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const reports = [
    {
      id: 'sales_register',
      title: 'Daily & Monthly Sales Register',
      desc: 'Detailed sales order ledger with customer GSTIN, tax breakup, and payment status.',
      category: 'COMMERCIAL REVENUE',
      recordsCount: '1,428 Orders',
    },
    {
      id: 'rm_procurement',
      title: 'Raw Material Procurement Report',
      desc: 'Sales-initiated raw material requests, supplier lead times, and PO status.',
      category: 'SUPPLY CHAIN & INVENTORY',
      recordsCount: '482 Purchase Orders',
    },
    {
      id: 'receivables',
      title: 'Outstanding Receivables Report',
      desc: 'Customer aging summary, payment credit limits, and overdue balance details.',
      category: 'FINANCIAL AUDIT & CREDIT',
      recordsCount: '34 Overdue Balances',
    },
  ];

  const handleExport = (reportTitle: string, format: 'Excel' | 'PDF') => {
    setDownloadingReport(`${reportTitle}_${format}`);
    setTimeout(() => {
      setDownloadingReport(null);
      setToastMsg(`✓ ${reportTitle} successfully exported as .${format === 'Excel' ? 'xlsx' : 'pdf'} file!`);
      setTimeout(() => setToastMsg(null), 5000);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
            Executive Financial & Sales Intelligence
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] flex items-center gap-2 mt-1.5">
            <FileSpreadsheet className="w-5 h-5 text-[#5C1D24]" /> Sales Reports & Data Exports
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Generate and download sales registers, customer breakdown reports, raw material procurement logs, and collection reports in Excel, PDF, or CSV formats.
          </p>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {toastMsg && (
        <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#1A1817] font-semibold text-xs flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5C1D24]" />
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg(null)} className="text-[#8C857E] hover:text-[#1A1817] font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* REPORT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] space-y-4 flex flex-col justify-between hover:border-[#D6D0C4] transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
                  {rep.category}
                </span>
                <span className="text-[11px] font-mono text-[#78726D] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EAE5DC]">
                  {rep.recordsCount}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#1A1817] leading-snug">{rep.title}</h3>
              <p className="text-xs text-[#78726D] leading-relaxed">{rep.desc}</p>
            </div>

            {/* PREMIUM BUTTONS */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-[#EAE5DC]">
              <button
                type="button"
                onClick={() => handleExport(rep.title, 'Excel')}
                disabled={Boolean(downloadingReport)}
                className="flex-1 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#B8944D]" />
                {downloadingReport === `${rep.title}_Excel` ? 'Exporting...' : 'Excel'}
              </button>

              <button
                type="button"
                onClick={() => handleExport(rep.title, 'PDF')}
                disabled={Boolean(downloadingReport)}
                className="flex-1 py-2.5 bg-[#FAF8F5] hover:bg-[#FDF2F4] text-[#8C1D2F] border border-[#F7D2D9] rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5 text-[#8C1D2F]" />
                {downloadingReport === `${rep.title}_PDF` ? 'Exporting...' : 'PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
