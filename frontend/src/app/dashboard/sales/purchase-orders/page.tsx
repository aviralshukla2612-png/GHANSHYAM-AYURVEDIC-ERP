'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { ClipboardList, CheckCircle2, ArrowUpRight } from 'lucide-react';

export default function SalesPurchaseOrdersPage() {
  const { data: poRes } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => apiClient.get('/api/purchases'),
  });

  const pos = (poRes as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
            RAW MATERIAL PROCUREMENT & POs
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] mt-1 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#5C1D24]" /> Supplier Purchase Orders (PO)
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Supplier purchase orders converted from sales shortage requests. Stock increases only upon Goods Receipt.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#78726D] border-b border-[#EAE5DC] text-[11px] uppercase tracking-wider font-mono">
                <th className="p-3">PO Number</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Subtotal</th>
                <th className="p-3">GST Tax</th>
                <th className="p-3">Grand Total</th>
                <th className="p-3">Expected Delivery</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {pos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#A39D96]">
                    No supplier purchase orders generated yet. Convert a raw material shortage request to PO.
                  </td>
                </tr>
              ) : (
                pos.map((p: any) => {
                  const status = (p.status || 'SENT').toUpperCase();
                  const badgeStyle =
                    status === 'RECEIVED'
                      ? 'bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC]'
                      : status === 'SENT'
                      ? 'bg-[#FAF6ED] text-[#8C6512] border border-[#EAD7B5]'
                      : status === 'CANCELLED'
                      ? 'bg-[#FDF2F4] text-[#8C1D2F] border border-[#F7D2D9]'
                      : 'bg-[#FAF8F5] text-[#78726D] border border-[#EAE5DC]';

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1A1817]">{p.poNumber}</td>
                      <td className="p-3 font-semibold text-[#1A1817]">{p.supplier?.name || 'Saurashtra Herbs & Spices'}</td>
                      <td className="p-3 text-[#5A544F]">₹{p.subtotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-[#5A544F]">₹{p.taxAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="p-3 font-bold text-[#1A1817]">₹{p.totalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-[#78726D]">{new Date(p.expectedDelivery).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1 ${badgeStyle}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
