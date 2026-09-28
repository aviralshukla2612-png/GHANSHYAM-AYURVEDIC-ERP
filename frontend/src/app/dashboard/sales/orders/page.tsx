'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { ListOrdered, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function AllOrdersPage() {
  const { data: ordersRes } = useQuery({
    queryKey: ['salesOrders'],
    queryFn: () => apiClient.get('/api/sales/orders'),
  });

  const orders = (ordersRes as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
            Commercial Sales Register
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] flex items-center gap-2 mt-1.5">
            <ListOrdered className="w-5 h-5 text-[#5C1D24]" /> Sales Orders Registry
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Complete list of customer orders, lifecycle statuses, and raw-material procurement linkages.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#8C857E] border-b border-[#EAE5DC] uppercase text-[11px] font-mono">
                <th className="p-3.5 whitespace-nowrap">Order No</th>
                <th className="p-3.5 whitespace-nowrap">Customer</th>
                <th className="p-3.5 whitespace-nowrap">Total Amount</th>
                <th className="p-3.5 whitespace-nowrap">Order Status</th>
                <th className="p-3.5 whitespace-nowrap">Payment</th>
                <th className="p-3.5 whitespace-nowrap">Order Date</th>
                <th className="p-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#8C857E] font-medium">
                    No sales orders found
                  </td>
                </tr>
              ) : (
                orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#1A1817] whitespace-nowrap">{o.orderNumber}</td>
                    <td className="p-3.5 font-semibold text-[#1A1817] whitespace-nowrap">{o.customer?.name}</td>
                    <td className="p-3.5 font-bold text-[#1A1817] whitespace-nowrap">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          o.status === 'MATERIAL_REQUIRED'
                            ? 'bg-[#FDF2F4] text-[#8C1D2F] border-[#F7D2D9]'
                            : o.status === 'PRODUCTION_REQUIRED'
                            ? 'bg-[#FAF6ED] text-[#8C6512] border-[#EAD7B5]'
                            : o.status === 'DELIVERED'
                            ? 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]'
                            : 'bg-[#FAF8F5] text-[#1A1817] border-[#EAE5DC]'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-[#5A544F] whitespace-nowrap">{o.paymentStatus}</td>
                    <td className="p-3.5 text-[#78726D] whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/sales/orders/${o.id}`}
                        className="px-3 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white rounded-xl font-semibold text-xs inline-flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                      >
                        View Details <ArrowUpRight className="w-3.5 h-3.5 text-[#B8944D]" />
                      </Link>
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
