'use client';

import { FileSpreadsheet, Download, FileText, Filter } from 'lucide-react';

export default function SalesReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-ayurveda-700" /> Sales Reports & Data Exports
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Generate and download sales registers, customer breakdown reports, raw material procurement logs, and collection reports in Excel, PDF, or CSV formats.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Daily & Monthly Sales Register', desc: 'Detailed sales order ledger with customer GSTIN, tax breakup, and payment status.' },
          { title: 'Raw Material Procurement Report', desc: 'Sales-initiated raw material requests, supplier lead times, and PO status.' },
          { title: 'Outstanding Receivables Report', desc: 'Customer aging summary, payment credit limits, and overdue balance details.' },
        ].map((rep, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-gray-900">{rep.title}</h3>
              <p className="text-xs text-gray-500">{rep.desc}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => alert(`Exporting ${rep.title} to Excel...`)}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => alert(`Exporting ${rep.title} to PDF...`)}
                className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
