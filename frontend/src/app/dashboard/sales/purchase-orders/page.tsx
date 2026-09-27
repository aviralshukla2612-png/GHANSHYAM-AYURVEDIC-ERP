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
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-ayurveda-700" /> Supplier Purchase Orders (PO)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Supplier purchase orders converted from sales shortage requests. Stock increases only upon Goods Receipt.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 border-b uppercase">
                <th className="p-3">PO Number</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Subtotal</th>
                <th className="p-3">GST Tax</th>
                <th className="p-3">Grand Total</th>
                <th className="p-3">Expected Delivery</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No supplier purchase orders generated yet. Convert a raw material shortage request to PO.
                  </td>
                </tr>
              ) : (
                pos.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-ayurveda-900">{p.poNumber}</td>
                    <td className="p-3 font-bold text-gray-800">{p.supplier?.name}</td>
                    <td className="p-3">₹{p.subtotal?.toLocaleString('en-IN')}</td>
                    <td className="p-3">₹{p.taxAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-black text-gray-900">₹{p.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-500">{new Date(p.expectedDelivery).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px]">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
